-- Create function to send Telegram notification when application is created
CREATE OR REPLACE FUNCTION public.send_telegram_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  telegram_settings jsonb;
  notification_message text;
BEGIN
  -- Get Telegram settings
  SELECT value INTO telegram_settings 
  FROM public.system_settings 
  WHERE key = 'telegram_settings';

  -- Check if notifications are enabled
  IF telegram_settings->>'notifications_enabled' = 'true' AND 
     telegram_settings->>'bot_token' IS NOT NULL AND 
     telegram_settings->>'admin_chat_id' IS NOT NULL THEN
    
    -- Build notification message
    notification_message := '🔔 <b>New Trading Fund Application</b>

📋 <b>Application:</b> ' || NEW.application_number || '
👤 <b>Applicant:</b> ' || NEW.first_name || ' ' || NEW.last_name || '
💰 <b>Amount:</b> $' || NEW.funding_amount || '
🏆 <b>Tier:</b> ' || NEW.funding_tier || '
📧 <b>Email:</b> ' || NEW.email || '
📅 <b>Submitted:</b> ' || TO_CHAR(NEW.created_at, 'YYYY-MM-DD HH24:MI') || '

Please review the application in the admin dashboard.';

    -- Call Telegram notification edge function asynchronously
    PERFORM net.http_post(
      url := 'https://qtygtskhsdowtdzsmzlv.supabase.co/functions/v1/telegram-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'service_role' || '"}'::jsonb,
      body := jsonb_build_object(
        'message', notification_message,
        'bot_token', telegram_settings->>'bot_token',
        'chat_id', telegram_settings->>'admin_chat_id'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for new applications
DROP TRIGGER IF EXISTS send_telegram_notification_trigger ON public.applications;
CREATE TRIGGER send_telegram_notification_trigger
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_telegram_notification();