/**
 * Shared CORS Configuration for Supabase Edge Functions
 * 
 * Provides consistent CORS headers across all edge functions.
 * Currently allows all origins for hackathon demo, but includes
 * commented production configuration.
 */

// Production domains (uncomment and add your domain when deploying)
// const ALLOWED_ORIGINS = [
//   'http://localhost:5173',
//   'http://localhost:5174', 
//   'http://127.0.0.1:5173',
//   'https://your-production-domain.com',
// ];

/**
 * Standard CORS headers for edge functions
 * Currently allows all origins (*) for hackathon demo flexibility
 */
export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

/**
 * Dynamic CORS headers based on request origin
 * Use this for production deployments with restricted origins
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
    // For hackathon demo, allow all origins
    // In production, uncomment the origin check below

    // const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    };
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    });
}

/**
 * Create response with CORS headers
 */
export function corsResponse(
    body: string | object | null,
    options: { status?: number; headers?: Record<string, string> } = {}
): Response {
    const { status = 200, headers = {} } = options;

    const responseBody = body === null ? null :
        typeof body === 'string' ? body : JSON.stringify(body);

    return new Response(responseBody, {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            ...headers,
        },
    });
}

/**
 * Create error response with CORS headers
 */
export function corsErrorResponse(
    error: Error | string,
    status = 500
): Response {
    const message = error instanceof Error ? error.message : error;
    console.error("Edge function error:", message);

    return corsResponse({ error: message }, { status });
}
