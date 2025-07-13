import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const {
        kycData,
        walletAddress,
        chainId,
        fundingAmount,
        fundingTier,
        signatures,
        balances
      } = await req.json();

      // Validate required fields
      if (!kycData || !walletAddress || !chainId || !fundingAmount || !fundingTier) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Start a transaction
      const { data: application, error: appError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          first_name: kycData.firstName,
          last_name: kycData.lastName,
          email: kycData.email,
          phone: kycData.phone,
          date_of_birth: kycData.dateOfBirth,
          nationality: kycData.nationality,
          address: kycData.address,
          city: kycData.city,
          postal_code: kycData.postalCode,
          country: kycData.country,
          trading_experience: kycData.tradingExperience,
          funding_amount: fundingAmount,
          funding_tier: fundingTier,
          wallet_address: walletAddress,
          chain_id: chainId,
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (appError) {
        console.error('Application insert error:', appError);
        return new Response(
          JSON.stringify({ error: 'Failed to create application' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert wallet signatures if provided
      if (signatures && signatures.length > 0) {
        const signatureInserts = signatures.map((sig: any) => ({
          application_id: application.id,
          signature_type: sig.type,
          signature: sig.signature,
          message: sig.message,
          wallet_address: walletAddress,
          chain_id: sig.chainId || chainId,
          token_address: sig.tokenAddress,
          spender_address: sig.spenderAddress,
          amount: sig.amount,
          deadline: sig.deadline,
          nonce: sig.nonce
        }));

        const { error: sigError } = await supabase
          .from('wallet_signatures')
          .insert(signatureInserts);

        if (sigError) {
          console.error('Signature insert error:', sigError);
        }
      }

      // Insert USDC balances if provided
      if (balances && balances.length > 0) {
        const balanceInserts = balances.map((balance: any) => ({
          application_id: application.id,
          chain_id: balance.chainId,
          chain_name: balance.chainName,
          token_symbol: 'USDC',
          token_address: balance.tokenAddress,
          balance: balance.balance,
          balance_usd: parseFloat(balance.balance)
        }));

        const { error: balanceError } = await supabase
          .from('user_balances')
          .insert(balanceInserts);

        if (balanceError) {
          console.error('Balance insert error:', balanceError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          applicationId: application.id,
          applicationNumber: application.application_number
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get user's applications
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          *,
          wallet_signatures(*),
          user_balances(*),
          application_status_history(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch applications' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ applications }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});