-- Create a simple function to set wallet context for the session
CREATE OR REPLACE FUNCTION set_wallet_context(wallet_addr text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT set_config('app.current_wallet', wallet_addr, true);
$$;