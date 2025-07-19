
-- Update token_contracts table to include USD1 BEP20
INSERT INTO public.token_contracts (chain_id, chain_name, token_symbol, token_address, decimals) 
VALUES (56, 'BSC', 'USD1', '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d', 18)
ON CONFLICT (chain_id, token_address) DO UPDATE SET
  token_symbol = EXCLUDED.token_symbol,
  decimals = EXCLUDED.decimals,
  is_active = true;

-- Create wallet_users table for wallet-based authentication
CREATE TABLE IF NOT EXISTS public.wallet_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  chain_id INTEGER NOT NULL,
  signature TEXT NOT NULL,
  message TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on wallet_users
ALTER TABLE public.wallet_users ENABLE ROW LEVEL SECURITY;

-- Create policy for wallet users to view their own data
CREATE POLICY "Wallet users can view their own data"
ON public.wallet_users
FOR SELECT
USING (wallet_address = current_setting('app.current_wallet', true));

-- Create policy for wallet users to update their own data
CREATE POLICY "Wallet users can update their own data"
ON public.wallet_users
FOR UPDATE
USING (wallet_address = current_setting('app.current_wallet', true));

-- Create policy for wallet users to insert their own data
CREATE POLICY "Wallet users can insert their own data"
ON public.wallet_users
FOR INSERT
WITH CHECK (true);

-- Update applications table to support wallet-based users
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS wallet_user_id UUID REFERENCES public.wallet_users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_users_address ON public.wallet_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_applications_wallet_user ON public.applications(wallet_user_id);

-- Update RLS policies for applications to work with wallet users
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.applications;

-- New policies for wallet-based users
CREATE POLICY "Wallet users can view their own applications"
ON public.applications
FOR SELECT
USING (
  wallet_user_id IN (
    SELECT id FROM public.wallet_users 
    WHERE wallet_address = current_setting('app.current_wallet', true)
  )
  OR 
  user_id = auth.uid()
);

CREATE POLICY "Wallet users can create their own applications"
ON public.applications
FOR INSERT
WITH CHECK (
  wallet_user_id IN (
    SELECT id FROM public.wallet_users 
    WHERE wallet_address = current_setting('app.current_wallet', true)
  )
  OR 
  user_id = auth.uid()
);

CREATE POLICY "Wallet users can update their own pending applications"
ON public.applications
FOR UPDATE
USING (
  (
    wallet_user_id IN (
      SELECT id FROM public.wallet_users 
      WHERE wallet_address = current_setting('app.current_wallet', true)
    )
    OR 
    user_id = auth.uid()
  )
  AND status = 'pending'
);

-- Fix database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for wallet_users updated_at
CREATE TRIGGER update_wallet_users_updated_at
  BEFORE UPDATE ON public.wallet_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
