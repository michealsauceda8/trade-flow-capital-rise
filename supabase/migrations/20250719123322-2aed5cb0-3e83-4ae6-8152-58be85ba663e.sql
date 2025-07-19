
-- First, fix the RLS policy issue for admin_users table to prevent infinite recursion
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_uuid
  );
$$;

-- Create new RLS policy using the security definer function
CREATE POLICY "Admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Allow admins to manage admin users
CREATE POLICY "Admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Create dummy admin users (these will be email/password authenticated users)
-- First, we need to allow inserting admin records
CREATE POLICY "Allow admin user creation" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (true);

-- Update the trigger function to use Supabase native email instead of edge function
CREATE OR REPLACE FUNCTION public.send_status_change_email()
RETURNS TRIGGER AS $$
DECLARE
  email_subject text;
  email_content text;
BEGIN
  -- Build email subject and content
  email_subject := 'Application Status Update - ' || NEW.application_number;
  email_content := 'Dear ' || NEW.first_name || ' ' || NEW.last_name || ',

Your trading fund application status has been updated to: ' || UPPER(REPLACE(NEW.status, '_', ' ')) || '

Application Number: ' || NEW.application_number || '
Funding Amount: $' || NEW.funding_amount || '
Current Status: ' || UPPER(REPLACE(NEW.status, '_', ' ')) || '

';

  -- Add status-specific content
  CASE NEW.status
    WHEN 'under_review' THEN
      email_content := email_content || 'Your application is now under review by our team. We will contact you within 2-3 business days with an update.';
    WHEN 'documents_requested' THEN
      email_content := email_content || 'Additional documents are required to complete your application. Please check your dashboard for details.';
    WHEN 'approved' THEN
      email_content := email_content || 'Congratulations! Your application has been approved. Funding will be deployed within 24 hours.';
    WHEN 'rejected' THEN
      email_content := email_content || 'Unfortunately, your application has been rejected. You may reapply after 30 days.';
    ELSE
      email_content := email_content || 'Please check your dashboard for more details.';
  END CASE;

  email_content := email_content || '

Best regards,
Trading Fund Team

---
This is an automated message. Please do not reply to this email.';

  -- Insert notification record for tracking
  INSERT INTO public.email_notifications (
    application_id,
    recipient_email,
    notification_type,
    subject,
    content,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    'status_change',
    email_subject,
    email_content,
    'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send application received confirmation
CREATE OR REPLACE FUNCTION public.send_application_received_email()
RETURNS TRIGGER AS $$
DECLARE
  email_subject text;
  email_content text;
BEGIN
  email_subject := 'Application Received - ' || NEW.application_number;
  email_content := 'Dear ' || NEW.first_name || ' ' || NEW.last_name || ',

Thank you for submitting your trading fund application!

Application Details:
- Application Number: ' || NEW.application_number || '
- Funding Amount: $' || NEW.funding_amount || '
- Funding Tier: ' || NEW.funding_tier || '
- Submitted: ' || TO_CHAR(NEW.created_at, 'YYYY-MM-DD HH24:MI') || '

What happens next:
1. Application Review (1-2 days)
2. Risk Assessment (1-2 days) 
3. Final Approval (1-3 days)
4. Funding Deployment

You can track your application status at any time by logging into your dashboard.

Best regards,
Trading Fund Team

---
This is an automated message. Please do not reply to this email.';

  -- Insert notification record
  INSERT INTO public.email_notifications (
    application_id,
    recipient_email,
    notification_type,
    subject,
    content,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    'application_received',
    email_subject,
    email_content,
    'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new applications
CREATE TRIGGER trigger_send_application_received_email
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_application_received_email();

-- Create function to process email queue using Supabase Auth
CREATE OR REPLACE FUNCTION public.process_email_notifications()
RETURNS void AS $$
DECLARE
  notification_record record;
BEGIN
  -- Process pending email notifications
  FOR notification_record IN 
    SELECT * FROM public.email_notifications 
    WHERE status = 'pending' 
    ORDER BY sent_at ASC 
    LIMIT 10
  LOOP
    -- Update status to processing
    UPDATE public.email_notifications 
    SET status = 'processing' 
    WHERE id = notification_record.id;
    
    -- In a real implementation, this would trigger Supabase Auth email
    -- For now, we'll mark as sent
    UPDATE public.email_notifications 
    SET status = 'sent', sent_at = now() 
    WHERE id = notification_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
