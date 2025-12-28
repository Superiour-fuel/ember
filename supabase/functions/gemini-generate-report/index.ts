import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  userName: string;
  stats: {
    totalInteractions: number;
    successfulInteractions: number;
    failedInteractions: number;
    mostUsedPhrases: string[];
    avgResponseTime: number;
    usageByDay: Record<string, number>;
  };
  conditions: string[];
  reportDate: string;
  visualSummary?: string; // Description of the charts/visuals passed from frontend
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, stats, conditions, reportDate } = await req.json() as ReportRequest;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `
      You are an expert Medical AI Assistant specializing in Speech Pathology and Assistive Technology.
      Generate a comprehensive, professional, 5-page "Medical Authorized Document" / Progress Report for a patient using an AAC (Augmentative and Alternative Communication) device "Ember".

      PATIENT DETAILS:
      - Name: ${userName || 'Patient'}
      - Conditions: ${conditions.length ? conditions.join(', ') : 'Unspecified Speech Disorder'}
      - Report Date: ${reportDate}

      APP TIMELINE & USAGE DATA:
      - Total Interactions: ${stats.totalInteractions}
      - Successful Communications: ${stats.successfulInteractions}
      - Needs Assistance/Failed: ${stats.failedInteractions}
      - Average Response Time: ${stats.avgResponseTime}ms
      - Most Used Phrases: ${stats.mostUsedPhrases.join(', ')}

      INSTRUCTIONS:
      Create a detailed 5-section report. For each section, provide professional medical narrative text.
      The report must sound authoritative, clinical, and data-driven.

      REQUIRED SECTIONS:
      1. **Executive Summary**: Overview of the patient's usage and progress.
      2. **Clinical Assessment**: Analysis of the speech patterns, condition progression, and adaptation to the device.
      3. **Usage Analytics**: Detailed breakdown of the statistics provided. Explain what "Successful Interactions" implies for their independence.
      4. **Timeline Analysis**: Discuss the consistency of usage (based on total interactions) and any trends.
      5. **Recommendations & Future Plan**: Clinical suggestions for continued therapy and device customization.

      OUTPUT FORMAT:
      Return valid JSON with the following structure:
      {
        "title": "Medical Progress Report: Speech & Communication Analysis",
        "patientName": "${userName}",
        "date": "${reportDate}",
        "sections": [
          {
            "heading": "1. Executive Summary",
            "content": "..."
          },
          {
            "heading": "2. Clinical Assessment",
            "content": "..."
          },
          {
            "heading": "3. Usage Analytics",
            "content": "..."
          },
          {
            "heading": "4. Timeline Analysis",
            "content": "..."
          },
          {
            "heading": "5. Recommendations & Future Plan",
            "content": "..."
          }
        ]
      }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4, // Lower temperature for more clinical/consistent output
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) throw new Error("No content generated");

    // Clean JSON markdown
    const jsonString = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonString);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
