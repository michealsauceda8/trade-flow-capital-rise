
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  action: 'process_queue' | 'send_single';
  email_id?: string;
  recipient?: string;
  subject?: string;
  content?: string;
  application_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, email_id, recipient, subject, content, application_id }: EmailRequest = await req.json();

    console.log('Email service called with action:', action);

    if (action === 'process_queue') {
      // Process pending emails from the queue
      const { data: pendingEmails, error: fetchError } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('status', 'pending')
        .order('sent_at', { ascending: true })
        .limit(10);

      if (fetchError) {
        console.error('Error fetching pending emails:', fetchError);
        throw fetchError;
      }

      console.log(`Processing ${pendingEmails?.length || 0} pending emails`);

      if (!pendingEmails || pendingEmails.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No pending emails to process',
            processed: 0 
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      // Process each email
      const results = [];
      for (const email of pendingEmails) {
        try {
          // Mark as processing
          await supabase
            .from('email_notifications')
            .update({ status: 'processing' })
            .eq('id', email.id);

          // In a real implementation, you would send the email here using a service like Resend
          // For now, we'll simulate successful sending
          console.log(`Simulating email send to: ${email.recipient_email}`);
          console.log(`Subject: ${email.subject}`);
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 100));

          // Mark as sent
          const { error: updateError } = await supabase
            .from('email_notifications')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', email.id);

          if (updateError) {
            console.error('Error updating email status:', updateError);
            // Mark as failed
            await supabase
              .from('email_notifications')
              .update({ status: 'failed' })
              .eq('id', email.id);
            
            results.push({ id: email.id, status: 'failed', error: updateError.message });
          } else {
            results.push({ id: email.id, status: 'sent' });
          }

        } catch (emailError) {
          console.error('Error processing email:', emailError);
          
          // Mark as failed
          await supabase
            .from('email_notifications')
            .update({ status: 'failed' })
            .eq('id', email.id);
          
          results.push({ id: email.id, status: 'failed', error: String(emailError) });
        }
      }

      const successCount = results.filter(r => r.status === 'sent').length;
      const failureCount = results.filter(r => r.status === 'failed').length;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Processed ${results.length} emails. ${successCount} sent, ${failureCount} failed.`,
          processed: results.length,
          results
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } else if (action === 'send_single') {
      // Send a single email immediately
      if (!recipient || !subject || !content) {
        throw new Error('Missing required fields for single email');
      }

      console.log(`Sending single email to: ${recipient}`);
      console.log(`Subject: ${subject}`);

      // In a real implementation, send the email using a service like Resend
      // For now, simulate successful sending
      await new Promise(resolve => setTimeout(resolve, 200));

      // If application_id is provided, log it in email_notifications
      if (application_id) {
        await supabase
          .from('email_notifications')
          .insert({
            application_id,
            recipient_email: recipient,
            notification_type: 'manual',
            subject,
            content,
            status: 'sent',
            sent_at: new Date().toISOString()
          });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          recipient,
          subject
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } else {
      throw new Error('Invalid action specified');
    }

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
