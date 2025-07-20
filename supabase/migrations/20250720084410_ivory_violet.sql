/*
  # User Profiles and KYC Separation

  1. New Tables
    - `user_profiles` - Core user profile information
    - `kyc_verifications` - Separate KYC verification tracking
    - `user_security_settings` - 2FA and security preferences
    - `kyc_documents` - Document storage tracking
    - `security_audit_logs` - Security event logging

  2. Security
    - Enable RLS on all new tables
    - Add policies for user data access
    - Add admin oversight policies
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  nationality TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  trading_experience TEXT CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create kyc_verifications table
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'documents_requested')),
  verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'enhanced', 'premium')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES auth.users(id),
  review_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create kyc_documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kyc_verification_id UUID NOT NULL REFERENCES public.kyc_verifications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('government_id', 'proof_of_address', 'selfie', 'additional')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_security_settings table
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  login_notifications BOOLEAN DEFAULT true,
  security_notifications BOOLEAN DEFAULT true,
  last_password_change TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create security_audit_logs table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
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
  USING (public.is_admin(auth.uid()));

-- RLS Policies for kyc_verifications
CREATE POLICY "Users can view their own KYC"
  ON public.kyc_verifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own pending KYC"
  ON public.kyc_verifications
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Users can insert their own KYC"
  ON public.kyc_verifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all KYC"
  ON public.kyc_verifications
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for kyc_documents
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
  USING (public.is_admin(auth.uid()));

-- RLS Policies for user_security_settings
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
  USING (public.is_admin(auth.uid()));

-- RLS Policies for security_audit_logs
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
  USING (public.is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON public.kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_verification_id ON public.kyc_documents(kyc_verification_id);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON public.user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at
  BEFORE UPDATE ON public.user_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  
  -- Create security settings
  INSERT INTO public.user_security_settings (user_id)
  VALUES (NEW.id);
  
  -- Create initial KYC verification record
  INSERT INTO public.kyc_verifications (user_id)
  VALUES (NEW.id);
  
  -- Log the signup event
  INSERT INTO public.security_audit_logs (user_id, event_type, event_description)
  VALUES (NEW.id, 'account_created', 'User account created');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_description,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_description,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check KYC status
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

-- Update applications table to reference user profiles
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS requires_kyc BOOLEAN DEFAULT true;

-- Create index for profile reference
CREATE INDEX IF NOT EXISTS idx_applications_profile_id ON public.applications(profile_id);