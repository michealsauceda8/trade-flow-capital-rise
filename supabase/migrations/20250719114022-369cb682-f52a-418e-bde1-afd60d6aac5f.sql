-- Create email notification tracking table
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'application_received', 'review_in_progress', 'status_change', 'approval', 'rejection'
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' -- 'sent', 'failed', 'pending'
);

-- Enable RLS for email notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Admin can manage all notifications
CREATE POLICY "Admins can manage email notifications" 
ON public.email_notifications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.user_id = auth.uid()
));

-- Users can view their own email notifications
CREATE POLICY "Users can view their email notifications" 
ON public.email_notifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM applications 
  WHERE applications.id = email_notifications.application_id 
  AND applications.user_id = auth.uid()
));

-- Add an index for better performance
CREATE INDEX idx_email_notifications_application_id ON public.email_notifications(application_id);
CREATE INDEX idx_email_notifications_type ON public.email_notifications(notification_type);

-- Create trigger to automatically send email when application status changes
CREATE OR REPLACE FUNCTION public.send_status_change_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification record (the actual email sending will be handled by edge function)
  INSERT INTO public.email_notifications (
    application_id,
    recipient_email,
    notification_type,
    subject,
    content
  ) VALUES (
    NEW.id,
    NEW.email,
    'status_change',
    'Application Status Update - ' || NEW.application_number,
    'Your application status has been updated to: ' || NEW.status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status changes
CREATE TRIGGER trigger_send_status_change_email
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.send_status_change_email();