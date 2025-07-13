-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_number TEXT UNIQUE NOT NULL DEFAULT CONCAT('APP-', TO_CHAR(NOW(), 'YYYY'), '-', LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0'), '-', LPAD(EXTRACT(HOUR FROM NOW())::TEXT, 2, '0'), LPAD(EXTRACT(MINUTE FROM NOW())::TEXT, 2, '0')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'documents_requested')),
  
  -- KYC Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  
  -- Trading Information
  trading_experience TEXT NOT NULL CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
  funding_amount DECIMAL(15,2) NOT NULL,
  funding_tier TEXT NOT NULL,
  
  -- Wallet Information
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  
  -- Document References
  id_document_url TEXT,
  proof_of_address_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID REFERENCES auth.users(id)
);

-- Create wallet signatures table
CREATE TABLE public.wallet_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('verification', 'usdc_permit_eth', 'usdc_permit_bsc')),
  signature TEXT NOT NULL,
  message TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  
  -- Permit specific fields
  token_address TEXT,
  spender_address TEXT,
  amount TEXT,
  deadline BIGINT,
  nonce INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create application status history table
CREATE TABLE public.application_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'reviewer' CHECK (role IN ('admin', 'reviewer', 'manager')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user balances table for USDC tracking
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  chain_id INTEGER NOT NULL,
  chain_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL DEFAULT 'USDC',
  token_address TEXT NOT NULL,
  balance DECIMAL(20,6) NOT NULL,
  balance_usd DECIMAL(15,2),
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(application_id, chain_id, token_address)
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Create policies for applications
CREATE POLICY "Users can view their own applications" 
ON public.applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications" 
ON public.applications 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all applications" 
ON public.applications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Create policies for wallet signatures
CREATE POLICY "Users can view their own signatures" 
ON public.wallet_signatures 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE id = application_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create signatures for their applications" 
ON public.wallet_signatures 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE id = application_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all signatures" 
ON public.wallet_signatures 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Create policies for status history
CREATE POLICY "Users can view their application history" 
ON public.application_status_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE id = application_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage status history" 
ON public.application_status_history 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Create policies for user balances
CREATE POLICY "Users can view their own balances" 
ON public.user_balances 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE id = application_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own balances" 
ON public.user_balances 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE id = application_id AND user_id = auth.uid()
  )
);

-- Create policies for admin users
CREATE POLICY "Admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log status changes
CREATE OR REPLACE FUNCTION public.log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.application_status_history (
      application_id, 
      status, 
      previous_status, 
      changed_by
    ) VALUES (
      NEW.id, 
      NEW.status, 
      OLD.status, 
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status logging
CREATE TRIGGER log_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_application_status_change();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Create storage policies
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Insert USDC contract addresses as reference data
CREATE TABLE public.token_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  chain_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_address TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 6,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(chain_id, token_address)
);

-- Insert USDC contract addresses
INSERT INTO public.token_contracts (chain_id, chain_name, token_symbol, token_address, decimals) VALUES
(1, 'Ethereum', 'USDC', '0xA0b86a33E6441A8A4B22251fDaD18C0D72F6B48F', 6),  -- USDC on Ethereum
(56, 'BSC', 'USDC', '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 6);   -- USDC on BSC

-- Make token contracts readable by everyone
ALTER TABLE public.token_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Token contracts are readable by everyone" 
ON public.token_contracts 
FOR SELECT 
USING (true);