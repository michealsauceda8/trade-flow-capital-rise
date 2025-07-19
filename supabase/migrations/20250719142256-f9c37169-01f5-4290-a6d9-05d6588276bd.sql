
-- Add file storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Create storage policies for KYC documents
CREATE POLICY "Users can upload their own KYC documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own KYC documents" ON storage.objects
FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all KYC documents" ON storage.objects
FOR SELECT USING (bucket_id = 'kyc-documents' AND EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Add columns to applications table for document URLs and review
ALTER TABLE applications 
ADD COLUMN id_document_path TEXT,
ADD COLUMN proof_of_address_path TEXT,
ADD COLUMN selfie_path TEXT,
ADD COLUMN document_status TEXT DEFAULT 'pending',
ADD COLUMN review_notes TEXT,
ADD COLUMN reviewer_notes JSONB DEFAULT '{}';

-- Create admin activity logs table
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin activity logs
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admin activity logs
CREATE POLICY "Admins can view activity logs" ON admin_activity_logs
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "System can insert activity logs" ON admin_activity_logs
FOR INSERT WITH CHECK (true);

-- Create email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy for email templates
CREATE POLICY "Admins can manage email templates" ON email_templates
FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Insert default email templates
INSERT INTO email_templates (name, subject, content, variables) VALUES
('application_received', 'Application Received - {{application_number}}', 
 'Dear {{first_name}} {{last_name}},

Thank you for submitting your trading fund application!

Application Details:
- Application Number: {{application_number}}
- Funding Amount: ${{funding_amount}}
- Funding Tier: {{funding_tier}}
- Submitted: {{submitted_date}}

What happens next:
1. Document Review (1-2 days)
2. Risk Assessment (1-2 days)
3. Final Approval (1-3 days)
4. Funding Deployment

You can track your application status in your dashboard.

Best regards,
Trading Fund Team', 
'["application_number", "first_name", "last_name", "funding_amount", "funding_tier", "submitted_date"]'),

('status_changed', 'Application Status Update - {{application_number}}', 
 'Dear {{first_name}} {{last_name}},

Your trading fund application status has been updated.

Application Details:
- Application Number: {{application_number}}
- New Status: {{status}}
- Updated: {{updated_date}}

{{status_message}}

Best regards,
Trading Fund Team', 
'["application_number", "first_name", "last_name", "status", "updated_date", "status_message"]'),

('documents_requested', 'Additional Documents Required - {{application_number}}', 
 'Dear {{first_name}} {{last_name}},

We need additional documents to process your application.

Required Documents:
{{required_documents}}

Please upload these documents through your dashboard within 7 days.

Best regards,
Trading Fund Team', 
'["application_number", "first_name", "last_name", "required_documents"]');

-- Create system settings table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on system settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy for system settings
CREATE POLICY "Admins can manage system settings" ON system_settings
FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('funding_tiers', '[
  {"name": "Starter", "min_amount": 2000, "max_amount": 5000, "funding_multiplier": 5, "profit_share": 80, "processing_days": 7},
  {"name": "Professional", "min_amount": 5000, "max_amount": 10000, "funding_multiplier": 5, "profit_share": 85, "processing_days": 5},
  {"name": "Expert", "min_amount": 10000, "max_amount": 50000, "funding_multiplier": 5, "profit_share": 90, "processing_days": 3}
]', 'Available funding tiers and their configurations'),
('application_settings', '{
  "max_file_size_mb": 10,
  "allowed_file_types": ["jpg", "jpeg", "png", "pdf"],
  "auto_approve_threshold": 5000,
  "require_wallet_signature": false
}', 'General application processing settings'),
('email_settings', '{
  "from_address": "noreply@tradingfund.com",
  "from_name": "Trading Fund Team",
  "auto_send_confirmations": true,
  "send_status_updates": true
}', 'Email notification settings');

-- Add trigger to log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'applications' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
      VALUES (
        auth.uid(),
        'status_change',
        'application',
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'application_number', NEW.application_number
        )
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to applications table
CREATE TRIGGER log_application_status_changes
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_activity();

-- Update existing triggers to use new email templates
DROP TRIGGER IF EXISTS send_application_received_email_trigger ON applications;
DROP TRIGGER IF EXISTS send_status_change_email_trigger ON applications;

-- Create improved email functions that use templates
CREATE OR REPLACE FUNCTION send_templated_email(
  template_name TEXT,
  recipient_email TEXT,
  application_row applications,
  additional_vars JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  template_record email_templates;
  email_subject TEXT;
  email_content TEXT;
  template_vars JSONB;
BEGIN
  -- Get template
  SELECT * INTO template_record FROM email_templates 
  WHERE name = template_name AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Email template % not found', template_name;
    RETURN;
  END IF;
  
  -- Build variables object
  template_vars := jsonb_build_object(
    'first_name', application_row.first_name,
    'last_name', application_row.last_name,
    'application_number', application_row.application_number,
    'funding_amount', application_row.funding_amount::text,
    'funding_tier', application_row.funding_tier,
    'status', UPPER(REPLACE(application_row.status, '_', ' ')),
    'submitted_date', TO_CHAR(application_row.created_at, 'YYYY-MM-DD HH24:MI'),
    'updated_date', TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI')
  ) || COALESCE(additional_vars, '{}');
  
  -- Simple template variable replacement (in production, use a proper template engine)
  email_subject := template_record.subject;
  email_content := template_record.content;
  
  -- Replace common variables
  email_subject := REPLACE(email_subject, '{{application_number}}', application_row.application_number);
  email_subject := REPLACE(email_subject, '{{first_name}}', application_row.first_name);
  email_subject := REPLACE(email_subject, '{{last_name}}', application_row.last_name);
  
  email_content := REPLACE(email_content, '{{application_number}}', application_row.application_number);
  email_content := REPLACE(email_content, '{{first_name}}', application_row.first_name);
  email_content := REPLACE(email_content, '{{last_name}}', application_row.last_name);
  email_content := REPLACE(email_content, '{{funding_amount}}', application_row.funding_amount::text);
  email_content := REPLACE(email_content, '{{funding_tier}}', application_row.funding_tier);
  email_content := REPLACE(email_content, '{{status}}', UPPER(REPLACE(application_row.status, '_', ' ')));
  email_content := REPLACE(email_content, '{{submitted_date}}', TO_CHAR(application_row.created_at, 'YYYY-MM-DD HH24:MI'));
  email_content := REPLACE(email_content, '{{updated_date}}', TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'));
  
  -- Insert email notification
  INSERT INTO email_notifications (
    application_id,
    recipient_email,
    notification_type,
    subject,
    content,
    status
  ) VALUES (
    application_row.id,
    recipient_email,
    template_name,
    email_subject,
    email_content,
    'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger functions using templates
CREATE OR REPLACE FUNCTION send_application_received_email_v2()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_templated_email('application_received', NEW.email, NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_status_change_email_v2()
RETURNS TRIGGER AS $$
DECLARE
  status_message TEXT;
BEGIN
  -- Add status-specific messages
  CASE NEW.status
    WHEN 'under_review' THEN
      status_message := 'Your application is now under review by our team. We will contact you within 2-3 business days.';
    WHEN 'documents_requested' THEN
      status_message := 'Additional documents are required. Please check your dashboard for details.';
    WHEN 'approved' THEN
      status_message := 'Congratulations! Your application has been approved. Funding will be deployed within 24 hours.';
    WHEN 'rejected' THEN
      status_message := 'Unfortunately, your application has been rejected. You may reapply after 30 days.';
    ELSE
      status_message := 'Please check your dashboard for more details.';
  END CASE;
  
  PERFORM send_templated_email(
    'status_changed', 
    NEW.email, 
    NEW, 
    jsonb_build_object('status_message', status_message)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add new triggers
CREATE TRIGGER send_application_received_email_trigger_v2
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION send_application_received_email_v2();

CREATE TRIGGER send_status_change_email_trigger_v2
  AFTER UPDATE ON applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION send_status_change_email_v2();
