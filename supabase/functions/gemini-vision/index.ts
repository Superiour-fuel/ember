/**
 * Gemini Vision Edge Function
 * 
 * Purpose: Analyzes camera frames for context awareness and gesture detection
 * 
 * Features:
 * - Scene analysis: Detects room type, objects, people count
 * - Gesture detection: Identifies pointing directions and targets
 * - Context hints: Provides contextual information to aid speech interpretation
 * 
 * Used by: PersonalizationSidebar for visual context awareness
 * 
 * Required secrets:
 * - GEMINI_API_KEY: Google Gemini API key
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, analyzeGestures = false } = await req.json();

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build the prompt based on whether we need gesture analysis
    const systemPrompt = analyzeGestures
      ? buildGestureAnalysisPrompt()
      : buildSceneAnalysisPrompt();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                text: analyzeGestures
                  ? "Analyze this scene for gestures and context to help understand speech intent:"
                  : "Analyze this scene for context to help understand speech intent:"
              },
              {
                inline_data: {
                  mime_type: imageData.startsWith("data:image/png") ? "image/png" : "image/jpeg",
                  data: imageData.replace(/^data:image\/\w+;base64,/, "")
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Gemini Vision API error:", response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON response
    let sceneAnalysis;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      sceneAnalysis = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse Gemini response:", content);
      sceneAnalysis = {
        room: "unknown",
        objects: [],
        people_count: 0,
        context_hint: "Unable to analyze scene",
        gesture: null,
        pointing_target: null,
        pointing_direction: null,
        suggested_phrases: []
      };
    }

    return new Response(
      JSON.stringify(sceneAnalysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Gemini Vision error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildGestureAnalysisPrompt(): string {
  return `You are a scene and gesture analyzer for an accessibility app called Ember that helps people with speech disabilities communicate.
Your job is to quickly analyze images to:
1. GESTURE DETECTION - Is the person pointing? Which direction? At what?
2. OBJECT IDENTIFICATION - What objects are visible?
3. POINTING TARGET - If pointing, what specific object are they pointing at?
4. LOCATION TYPE - What kind of room/environment is this?
5. PHRASE SUGGESTION - What might someone want to say in this situation?

GESTURE TYPES to detect:
- "pointing_right" - person is pointing to the right
- "pointing_left" - person is pointing to the left
- "pointing_forward" - person is pointing toward camera/forward
- "pointing_at_object" - person is clearly pointing at a specific visible object
- null - no pointing gesture detected

Return a JSON object with:
- room: The type of room/location (e.g., "kitchen", "living room", "bedroom", "office", "outdoor", "unknown")
- objects: Array of up to 5 notable objects visible (e.g., ["coffee maker", "refrigerator", "microwave"])
- people_count: Number of people visible (0 if none)
- context_hint: A brief phrase describing the scene that could help interpret speech
- gesture: The detected gesture type (one of the types above, or null if no gesture)
- pointing_target: If pointing at an object, what specific object (e.g., "coffee maker", "TV remote", "light switch") - null if not pointing or target unclear
- pointing_direction: If pointing, the direction ("right", "left", "forward", "up", "down") - null if not pointing
- suggested_phrases: Array of 3-4 short, first-person phrases relevant to the scene/objects. (e.g., "I'd like some coffee", "Turn on the TV", "What time is it?")

IMPORTANT: Be VERY specific about what they're pointing at. This is crucial for interpreting their speech.
If someone says "that" or "it" while pointing, the pointing_target helps us understand what they mean.

Return ONLY valid JSON, no markdown or explanation.`;
}

function buildSceneAnalysisPrompt(): string {
  return `You are a scene analyzer for an accessibility app called Ember that helps people with speech disabilities communicate.
Your job is to quickly analyze images to understand the context and environment to help interpret unclear speech.

Analyze the image and return a JSON object with:
- room: The type of room/location (e.g., "kitchen", "living room", "bedroom", "office", "outdoor", "unknown")
- objects: Array of up to 5 notable objects visible (e.g., ["coffee maker", "refrigerator", "microwave"])
- people_count: Number of people visible (0 if none)
- context_hint: A brief phrase describing the scene that could help interpret speech (e.g., "Person in kitchen near coffee maker - likely wants coffee-related assistance")
- suggested_phrases: Array of 3-4 short, first-person phrases relevant to the scene/objects. (e.g., "I'd like some coffee", "Where is the remote?", "It's too dark")

Return ONLY valid JSON, no markdown or explanation.`;
}
