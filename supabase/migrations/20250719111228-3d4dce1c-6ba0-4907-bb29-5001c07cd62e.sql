
-- Fix the wallet_users INSERT policy to allow creation without wallet context validation
DROP POLICY IF EXISTS "Wallet users can insert their own data" ON public.wallet_users;

CREATE POLICY "Allow wallet user creation"
ON public.wallet_users
FOR INSERT
WITH CHECK (true);

-- Update the existing policies to use proper wallet context after creation
DROP POLICY IF EXISTS "Wallet users can view their own data" ON public.wallet_users;
DROP POLICY IF EXISTS "Wallet users can update their own data" ON public.wallet_users;

CREATE POLICY "Wallet users can view their own data"
ON public.wallet_users
FOR SELECT
USING (wallet_address = current_setting('app.current_wallet', true) OR wallet_address = lower(current_setting('app.current_wallet', true)));

CREATE POLICY "Wallet users can update their own data"
ON public.wallet_users
FOR UPDATE
USING (wallet_address = current_setting('app.current_wallet', true) OR wallet_address = lower(current_setting('app.current_wallet', true)));

-- Fix database function security warnings by setting proper search_path
CREATE OR REPLACE FUNCTION public.set_wallet_context(wallet_addr text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT set_config('app.current_wallet', lower(wallet_addr), true);
$$;

-- Update application policies to work with both email and wallet users
DROP POLICY IF EXISTS "Wallet users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Wallet users can create their own applications" ON public.applications;
DROP POLICY IF EXISTS "Wallet users can update their own pending applications" ON public.applications;

CREATE POLICY "Users can view their own applications"
ON public.applications
FOR SELECT
USING (
  user_id = auth.uid() OR
  wallet_user_id IN (
    SELECT id FROM public.wallet_users 
    WHERE wallet_address = current_setting('app.current_wallet', true) OR 
          wallet_address = lower(current_setting('app.current_wallet', true))
  )
);

CREATE POLICY "Users can create their own applications"
ON public.applications
FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR
  wallet_user_id IN (
    SELECT id FROM public.wallet_users 
    WHERE wallet_address = current_setting('app.current_wallet', true) OR 
          wallet_address = lower(current_setting('app.current_wallet', true))
  )
);

CREATE POLICY "Users can update their own pending applications"
ON public.applications
FOR UPDATE
USING (
  (user_id = auth.uid() OR
   wallet_user_id IN (
     SELECT id FROM public.wallet_users 
     WHERE wallet_address = current_setting('app.current_wallet', true) OR 
           wallet_address = lower(current_setting('app.current_wallet', true))
   )
  ) AND status = 'pending'
);
