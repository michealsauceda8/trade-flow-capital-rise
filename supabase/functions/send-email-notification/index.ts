import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  applicationId: string;
  recipientEmail: string;
  notificationType: string;
  applicationNumber: string;
  status?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, recipientEmail, notificationType, applicationNumber, status }: EmailRequest = await req.json();

    let subject = "";
    let content = "";

    switch (notificationType) {
      case "application_received":
        subject = `Application Received - ${applicationNumber}`;
        content = `
          <h1>Application Received Successfully!</h1>
          <p>Thank you for submitting your trading fund application <strong>${applicationNumber}</strong>.</p>
          <p>We have received your application and our team will begin the review process shortly.</p>
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Initial review will be completed within 24 hours</li>
            <li>KYC verification and document review</li>
            <li>Final approval decision within 3-7 days</li>
          </ul>
          <p>You will receive email updates as your application progresses through each stage.</p>
          <p>Best regards,<br>Trading Fund Team</p>
        `;
        break;
      
      case "review_in_progress":
        subject = `Review In Progress - ${applicationNumber}`;
        content = `
          <h1>Your Application is Under Review</h1>
          <p>Your trading fund application <strong>${applicationNumber}</strong> is now under review by our team.</p>
          <p>Our experts are carefully evaluating your submission and verifying all documentation.</p>
          <p>We will notify you of any updates or if additional information is required.</p>
          <p>Thank you for your patience.</p>
          <p>Best regards,<br>Trading Fund Team</p>
        `;
        break;
      
      case "status_change":
        subject = `Application Status Update - ${applicationNumber}`;
        content = `
          <h1>Application Status Updated</h1>
          <p>Your trading fund application <strong>${applicationNumber}</strong> status has been updated.</p>
          <p><strong>New Status:</strong> ${status}</p>
          <p>Please log in to your dashboard for more details and next steps.</p>
          <p>Best regards,<br>Trading Fund Team</p>
        `;
        break;
      
      case "approval":
        subject = `🎉 Application Approved - ${applicationNumber}`;
        content = `
          <h1>Congratulations! Your Application Has Been Approved</h1>
          <p>We are pleased to inform you that your trading fund application <strong>${applicationNumber}</strong> has been approved!</p>
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>You will receive funding details within 24 hours</li>
            <li>Access to trading platforms will be granted</li>
            <li>Our support team will contact you with onboarding instructions</li>
          </ul>
          <p>Welcome to our trading fund program!</p>
          <p>Best regards,<br>Trading Fund Team</p>
        `;
        break;
      
      case "rejection":
        subject = `Application Decision - ${applicationNumber}`;
        content = `
          <h1>Application Update</h1>
          <p>Thank you for your interest in our trading fund program.</p>
          <p>After careful review, we are unable to approve application <strong>${applicationNumber}</strong> at this time.</p>
          <p>You may reapply in the future once you meet all requirements.</p>
          <p>For questions, please contact our support team.</p>
          <p>Best regards,<br>Trading Fund Team</p>
        `;
        break;
      
      default:
        subject = `Trading Fund Notification - ${applicationNumber}`;
        content = `
          <h1>Trading Fund Notification</h1>
          <p>This is a notification regarding your application <strong>${applicationNumber}</strong>.</p>
          <p>Please log in to your dashboard for more information.</p>
          <p>Best regards,<br>Trading Fund Team</p>
        `;
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Trading Fund <noreply@tradingfund.com>",
      to: [recipientEmail],
      subject: subject,
      html: content,
    });

    // Log the notification in the database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('email_notifications').insert({
      application_id: applicationId,
      recipient_email: recipientEmail,
      notification_type: notificationType,
      subject: subject,
      content: content,
      status: 'sent'
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email-notification function:", error);
    
    // Log failed notification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
      await supabase.from('email_notifications').insert({
        application_id: 'unknown',
        recipient_email: 'unknown',
        notification_type: 'error',
        subject: 'Email Send Failed',
        content: error.message,
        status: 'failed'
      });
    } catch (dbError) {
      console.error("Failed to log error to database:", dbError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);