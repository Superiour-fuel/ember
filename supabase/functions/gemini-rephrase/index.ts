
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
        // 1. Log that we received a request
        console.log("Request received");

        // 2. Parsy body safely
        let body;
        try {
            body = await req.json();
        } catch (e) {
            body = {};
        }

        const { text, tone } = body;

        // 3. Construct a simple response
        const debugMessage = `[Function Working] You sent: "${text}" with tone: "${tone}"`;

        // 4. Return success
        return new Response(
            JSON.stringify({ rephrased: debugMessage }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        );

    } catch (error: any) {
        // 5. Catch any unexpected errors and return 200 with error message
        // (This prevents the generic 500 error from Supabase)
        return new Response(
            JSON.stringify({ error: `Internal Function Error: ${error.message}` }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        );
    }
});
