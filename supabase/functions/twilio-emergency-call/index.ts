/**
 * Twilio Emergency Call Edge Function
 * 
 * Purpose: Initiates emergency voice calls to caregivers/contacts
 * 
 * Flow:
 * 1. Receives phone number, message, and user name
 * 2. Builds TwiML with Polly.Matthew voice for call content
 * 3. Calls Twilio API to initiate outbound call
 * 4. Message repeats twice for clarity
 * 
 * Used by: App.tsx when urgent situation detected by Gemini
 * 
 * Required secrets:
 * - TWILIO_ACCOUNT_SID: Twilio account identifier
 * - TWILIO_AUTH_TOKEN: Twilio authentication token
 * - TWILIO_PHONE_NUMBER: Outbound phone number
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phoneNumber, message, userName } = body;

    console.log('Emergency call request received:', {
      phoneNumber: phoneNumber ? '***' + phoneNumber.slice(-4) : 'missing',
      message,
      userName
    });

    if (!phoneNumber) {
      console.error('Phone number is missing');
      throw new Error('Phone number is required');
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    console.log('Twilio credentials check:', {
      hasSid: !!TWILIO_ACCOUNT_SID,
      hasToken: !!TWILIO_AUTH_TOKEN,
      hasPhone: !!TWILIO_PHONE_NUMBER,
    });

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio credentials not configured');
    }

    // Build the alert message
    const alertMessage = `Hello, this is an urgent alert from Ember. ${userName || 'Your contact'} is asking for help. ${message ? `They said: ${message}.` : ''} Please reach out to them as soon as possible. This is an automated emergency message. Thank you.`;

    // Create TwiML with Twilio's built-in TTS (Polly voices are high quality)
    const escapedMessage = alertMessage.replace(/[<>&'"]/g, '');
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew" language="en-US">${escapedMessage}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Matthew" language="en-US">This message will repeat once more.</Say>
  <Pause length="1"/>
  <Say voice="Polly.Matthew" language="en-US">${escapedMessage}</Say>
  <Hangup/>
</Response>`;

    // Clean phone number - ensure it has country code
    const cleanPhone = phoneNumber.replace(/[^+\d]/g, '');
    const toNumber = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log('Initiating Twilio call to:', toNumber);
    console.log('From number:', TWILIO_PHONE_NUMBER);

    // Make the Twilio call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

    const formData = new URLSearchParams();
    formData.append('To', toNumber);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Twiml', twiml);

    console.log('Making Twilio API request...');

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio API error:', JSON.stringify(twilioResult));
      throw new Error(`Twilio error: ${twilioResult.message || twilioResult.code || 'Failed to make call'}`);
    }

    console.log('Call initiated successfully:', twilioResult.sid);

    return new Response(
      JSON.stringify({
        success: true,
        callSid: twilioResult.sid,
        message: 'Emergency call initiated'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Emergency call error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
