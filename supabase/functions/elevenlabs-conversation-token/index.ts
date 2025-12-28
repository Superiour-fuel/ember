/**
 * ElevenLabs Conversation Token Edge Function
 * 
 * Purpose: Generates signed WebSocket URL for ElevenLabs Conversational AI Agent
 * 
 * Flow:
 * 1. Receives agentId from frontend
 * 2. Calls ElevenLabs API with server-side API key
 * 3. Returns signed URL for WebSocket connection
 * 
 * Used by: useElevenLabsConversation hook → startConversation()
 * 
 * Required secrets:
 * - ELEVENLABS_API_KEY: ElevenLabs API key
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY is not configured");
      throw new Error("ElevenLabs API key is not configured");
    }

    // Parse request body to get agent ID
    const { agentId } = await req.json();

    if (!agentId) {
      throw new Error("Agent ID is required");
    }

    console.log("Requesting conversation token for agent:", agentId);

    // Get a conversation token from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`Failed to get conversation token: ${response.status}`);
    }

    const data = await response.json();
    console.log("Successfully obtained signed URL");

    return new Response(JSON.stringify({ signed_url: data.signed_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in elevenlabs-conversation-token:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
