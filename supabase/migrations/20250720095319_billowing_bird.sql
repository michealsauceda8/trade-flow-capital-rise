/*
  # Fix RLS Policies for Data Access Issues

  1. Security Updates
    - Fix RLS policies that are preventing data access
    - Ensure proper user data isolation
    - Add missing policies for new tables
    - Fix admin access patterns

  2. Policy Updates
    - User profiles access
    - KYC verification access
    - Security settings access
    - Admin oversight policies
*/

-- Drop existing problematic policies and recreate them properly

-- Fix user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Fix kyc_verifications policies
DROP POLICY IF EXISTS "Users can view their own KYC" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Users can update their own pending KYC" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Users can insert their own KYC" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Admins can manage all KYC" ON public.kyc_verifications;

CREATE POLICY "Users can view their own KYC"
  ON public.kyc_verifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own pending KYC"
  ON public.kyc_verifications
  FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('pending', 'documents_requested'));

CREATE POLICY "Users can insert their own KYC"
  ON public.kyc_verifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all KYC"
  ON public.kyc_verifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Fix kyc_documents policies
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Users can insert their own KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can manage all KYC documents" ON public.kyc_documents;

CREATE POLICY "Users can view their own KYC documents"
  ON public.kyc_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.kyc_verifications kv
      WHERE kv.id = kyc_verification_id AND kv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own KYC documents"
  ON public.kyc_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kyc_verifications kv
      WHERE kv.id = kyc_verification_id AND kv.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all KYC documents"
  ON public.kyc_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Fix user_security_settings policies
DROP POLICY IF EXISTS "Users can view their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can update their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can insert their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Admins can view security settings" ON public.user_security_settings;

CREATE POLICY "Users can view their own security settings"
  ON public.user_security_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own security settings"
  ON public.user_security_settings
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own security settings"
  ON public.user_security_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view security settings"
  ON public.user_security_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Fix security_audit_logs policies
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.security_audit_logs;

CREATE POLICY "Users can view their own audit logs"
  ON public.security_audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON public.security_audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs"
  ON public.security_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Fix applications table policies to work with new profile system
DROP POLICY IF EXISTS "Users can create applications" ON public.applications;
DROP POLICY IF EXISTS "Users can view their applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their pending applications" ON public.applications;

CREATE POLICY "Users can create applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR
  (wallet_user_id IS NOT NULL AND wallet_user_id IN (
    SELECT id FROM public.wallet_users 
    WHERE wallet_address = current_setting('app.current_wallet', true)
  ))
);

CREATE POLICY "Users can view their applications" 
ON public.applications 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  (wallet_user_id IS NOT NULL AND wallet_user_id IN (
    SELECT id FROM public.wallet_users 
    WHERE wallet_address = current_setting('app.current_wallet', true)
  )) OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their pending applications" 
ON public.applications 
FOR UPDATE 
USING (
  (user_id = auth.uid() AND status IN ('pending', 'documents_requested')) OR
  (wallet_user_id IS NOT NULL AND wallet_user_id IN (
    SELECT id FROM public.wallet_users 
    WHERE wallet_address = current_setting('app.current_wallet', true)
  ) AND status IN ('pending', 'documents_requested')) OR
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Fix admin_users policies to prevent recursion
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow initial admin creation" ON public.admin_users;

-- Create a simple policy that allows admins to manage other admins
CREATE POLICY "Admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND (au.permissions->>'admin' = 'true' OR au.role = 'admin')
  )
);

CREATE POLICY "Admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND (au.permissions->>'admin' = 'true' OR au.role = 'admin')
  )
);

-- Allow initial admin creation (for setup)
CREATE POLICY "Allow initial admin creation" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.admin_users) OR
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() 
    AND (au.permissions->>'admin' = 'true' OR au.role = 'admin')
  )
);

-- Fix system_settings and email_templates policies
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;

CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Fix email_notifications policies
DROP POLICY IF EXISTS "Admins can manage email notifications" ON public.email_notifications;
DROP POLICY IF EXISTS "Users can view their email notifications" ON public.email_notifications;

CREATE POLICY "Admins can manage email notifications" 
ON public.email_notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their email notifications" 
ON public.email_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE id = email_notifications.application_id 
    AND user_id = auth.uid()
  )
);

-- Ensure all tables have proper RLS enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user has completed profile setup
CREATE OR REPLACE FUNCTION public.user_has_completed_profile(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = p_user_id AND profile_completed = true
  ) INTO profile_exists;
  
  RETURN profile_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user KYC status
CREATE OR REPLACE FUNCTION public.get_user_kyc_status(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  kyc_status TEXT;
BEGIN
  SELECT status INTO kyc_status
  FROM public.kyc_verifications
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(kyc_status, 'not_started');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;