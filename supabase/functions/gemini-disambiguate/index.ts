/**
 * Gemini Disambiguate Edge Function
 * 
 * Purpose: Interprets unclear or fragmented speech using Google Gemini AI
 * 
 * Flow:
 * 1. Receives transcript from frontend
 * 2. Analyzes speech pattern (dysarthria, aphasia, or standard)
 * 3. Builds context-specific prompt with visual/conversation context
 * 4. Calls Gemini 2.0 Flash API for interpretation
 * 5. Returns interpretation with confidence score and alternatives
 * 
 * Used by: useElevenLabsConversation hook
 * 
 * Required secrets:
 * - GEMINI_API_KEY: Google Gemini API key
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert speech interpreter specializing in dysarthria, aphasia, and other speech disabilities.

## YOUR TASK
Interpret unclear, fragmented, or slurred speech and determine what the person ACTUALLY means.

## COMMON SPEECH PATTERNS TO RECOGNIZE

### DYSARTHRIA (Slurred Speech)
People with dysarthria often:
- Drop consonants: "wan coff" → "want coffee"
- Shorten words: "nee hel" → "need help"  
- Simplify consonant clusters: "tur on ligh" → "turn on light"
- Merge words: "wanna go" → "I want to go"

### APHASIA (Fragmented Speech)
People with aphasia often:
- Drop articles: "want coffee" → "I want coffee"
- Drop pronouns: "need help" → "I need help"
- Use fragments: "bathroom... help... now" → "I need help getting to the bathroom now"
- Miss prepositions: "go store" → "I want to go to the store"

### COMMON URGENT PHRASES
Recognize these as CRITICAL urgency:
- "help", "pain", "bad", "hurt", "can't breathe" → EMERGENCY
- "fall", "fell", "stuck", "can't move" → EMERGENCY
- "nee hel", "hel me", "pai bad" → EMERGENCY

### COMMON HOME CONTROL PHRASES
- "too dark" / "too da" → "Turn on the lights"
- "too hot" / "too col" → Temperature adjustment
- "lights on" / "ligh on" → "Turn on the lights"
- "lights off" / "ligh off" → "Turn off the lights"

## OUTPUT FORMAT
You must respond with a JSON object:

{
  "interpretation": "The complete, grammatically correct interpretation",
  "confidence": 85,
  "category": "dysarthria" | "aphasia" | "clear" | "urgent",
  "alternatives": ["Alternative interpretation 1", "Alternative interpretation 2"],
  "action": {
    "type": "lights_on" | "emergency_call" | "temp_up" | "temp_down" | null,
    "params": {}
  },
  "response": "Natural response to say back to the user"
}

## EXAMPLES

### Example 1: Dysarthria
Input: "wan coff hot"
Output:
{
  "interpretation": "I want hot coffee",
  "confidence": 87,
  "category": "dysarthria",
  "alternatives": ["I want coffee hot", "One hot coffee"],
  "action": null,
  "response": "You want hot coffee. Is that right?"
}

### Example 2: Aphasia  
Input: "bathroom help now"
Output:
{
  "interpretation": "I need help getting to the bathroom now",
  "confidence": 92,
  "category": "aphasia",
  "alternatives": ["I need to go to the bathroom", "Help me to the bathroom"],
  "action": null,
  "response": "You need help getting to the bathroom. I understand."
}

### Example 3: Emergency
Input: "hel pai bad"
Output:
{
  "interpretation": "Help, I'm in pain, it's bad",
  "confidence": 95,
  "category": "urgent",
  "alternatives": ["Help me, the pain is bad", "I need help with pain"],
  "action": {
    "type": "emergency_call",
    "params": {"urgency": "critical", "reason": "pain"}
  },
  "response": "I understand you're in pain. I'm calling for help right now."
}

### Example 4: Home Control
Input: "too da"
Output:
{
  "interpretation": "It's too dark",
  "confidence": 88,
  "category": "dysarthria",
  "alternatives": ["Turn on the lights", "Too dark in here"],
  "action": {
    "type": "lights_on",
    "params": {}
  },
  "response": "I understand it's too dark. Turning on the lights for you."
}

## RULES
1. ALWAYS provide a complete, grammatically correct interpretation
2. ALWAYS fill in missing articles (a, an, the)
3. ALWAYS fill in missing pronouns (I, you, we)
4. ALWAYS add prepositions where needed (to, for, with, in, on)
5. NEVER copy the input verbatim unless confidence is 100%
6. If confidence < 70%, provide 3 alternatives
7. If confidence >= 90%, provide 1-2 alternatives
8. ALWAYS detect emergency keywords and mark as urgent
9. ALWAYS detect home control requests and provide action

## CRITICAL
- Be generous with interpretation - people with speech disabilities KNOW what they want to say
- Favor more complete interpretations over minimal ones
- Consider context: time of day, location, previous conversation
- Don't be overly literal - interpret the INTENT, not just the words
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, userProfile, conversationHistory = [] } = await req.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: "Transcript is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const userMessage = `
User speech input: "${transcript}"

Additional context:
- User profile: ${JSON.stringify(userProfile || {})}
- Time of day: ${new Date().toLocaleTimeString()}
- Recent conversation: ${JSON.stringify(conversationHistory.slice(-3))}

Interpret what they mean and respond in JSON format.
`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: SYSTEM_PROMPT + "\n\n" + userMessage
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;

    // Gemini might wrap response in markdown, so clean it
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const interpretation = JSON.parse(jsonText);

    return new Response(
      JSON.stringify(interpretation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Disambiguation error:", errorMessage);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        interpretation: "",
        confidence: 0,
        alternatives: [],
        category: "clear",
        action: null,
        response: "Sorry, I had trouble understanding that. Could you try again?"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
