import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TelegramNotificationRequest {
  message: string;
  bot_token?: string;
  chat_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, bot_token, chat_id }: TelegramNotificationRequest = await req.json();

    // Use provided credentials or fall back to environment variables
    const telegramBotToken = bot_token || Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = chat_id || Deno.env.get("TELEGRAM_CHAT_ID");

    if (!telegramBotToken || !telegramChatId) {
      console.error("Missing Telegram credentials");
      return new Response(
        JSON.stringify({ 
          error: "Telegram bot token or chat ID not configured",
          success: false 
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Send message to Telegram
    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.text();
      console.error("Telegram API error:", errorData);
      throw new Error(`Telegram API error: ${telegramResponse.status}`);
    }

    const result = await telegramResponse.json();
    console.log("Telegram notification sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent successfully",
        telegram_result: result 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in telegram-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);