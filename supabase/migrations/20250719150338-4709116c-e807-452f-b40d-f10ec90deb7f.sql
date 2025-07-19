
-- Create system_settings table for CMS and configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  template_type TEXT NOT NULL, -- 'application_received', 'status_change', 'approval', 'rejection'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_activity_logs table
CREATE TABLE public.admin_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid()
));

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid()
));

-- RLS Policies for admin_activity_logs
CREATE POLICY "Admins can view activity logs" 
ON public.admin_activity_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid()
));

CREATE POLICY "System can insert activity logs" 
ON public.admin_activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
('site_config', '{"site_name": "Trading Fund Portal", "tagline": "Professional Trading Fund Application Platform", "contact_email": "support@tradingfund.com"}', 'Main site configuration', 'general'),
('application_settings', '{"auto_approve_limit": 10000, "require_documents": true, "max_funding_amount": 1000000}', 'Application processing settings', 'applications'),
('email_settings', '{"from_email": "noreply@tradingfund.com", "support_email": "support@tradingfund.com"}', 'Email configuration', 'notifications'),
('telegram_settings', '{"bot_token": "", "admin_chat_id": "", "notifications_enabled": false}', 'Telegram bot settings', 'notifications'),
('funding_tiers', '{"tiers": [{"name": "Starter", "min": 1000, "max": 25000}, {"name": "Professional", "min": 25000, "max": 100000}, {"name": "Elite", "min": 100000, "max": 1000000}]}', 'Available funding tiers', 'applications');

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, content, template_type, variables) VALUES
('application_received', 'Application Received - {{application_number}}', 
'Dear {{first_name}} {{last_name}},

Thank you for submitting your trading fund application!

Application Details:
- Application Number: {{application_number}}
- Funding Amount: ${{funding_amount}}
- Funding Tier: {{funding_tier}}
- Submitted: {{created_at}}

What happens next:
1. Application Review (1-2 days)
2. Risk Assessment (1-2 days) 
3. Final Approval (1-3 days)
4. Funding Deployment

You can track your application status at any time by logging into your dashboard.

Best regards,
Trading Fund Team', 
'application_received', 
'["application_number", "first_name", "last_name", "funding_amount", "funding_tier", "created_at"]'::jsonb),

('status_change', 'Application Status Update - {{application_number}}', 
'Dear {{first_name}} {{last_name}},

Your trading fund application status has been updated to: {{status}}

Application Number: {{application_number}}
Funding Amount: ${{funding_amount}}
Current Status: {{status}}

Please check your dashboard for more details.

Best regards,
Trading Fund Team', 
'status_change', 
'["application_number", "first_name", "last_name", "funding_amount", "status"]'::jsonb);

-- Add trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log admin activities
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update applications table to ensure proper RLS
DROP POLICY IF EXISTS "Users can create their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.applications;

CREATE POLICY "Users can create applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR user_id IS NULL)
);

CREATE POLICY "Users can view their applications" 
ON public.applications 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);

CREATE POLICY "Users can update their pending applications" 
ON public.applications 
FOR UPDATE 
USING (
  (user_id = auth.uid() AND status IN ('pending', 'documents_requested')) OR
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
);

-- Fix admin_users RLS policies
DROP POLICY IF EXISTS "Allow admin user creation" ON public.admin_users;
CREATE POLICY "Admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users au 
  WHERE au.user_id = auth.uid() 
  AND au.permissions->>'admin' = 'true'
));

-- Allow initial admin user creation
CREATE POLICY "Allow initial admin creation" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM admin_users) OR
  EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.permissions->>'admin' = 'true')
);
