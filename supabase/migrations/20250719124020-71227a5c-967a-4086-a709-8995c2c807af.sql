-- Create trigger to automatically add users to admin_users table based on signup metadata
CREATE OR REPLACE FUNCTION public.handle_admin_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user signed up with admin role metadata
  IF NEW.raw_user_meta_data->>'role' IN ('admin', 'reviewer') THEN
    INSERT INTO public.admin_users (user_id, role, permissions)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'reviewer'),
      CASE 
        WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN '{"admin": true, "review": true, "manage_users": true}'::jsonb
        ELSE '{"admin": false, "review": true, "manage_users": false}'::jsonb
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
CREATE TRIGGER trigger_handle_admin_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user_signup();