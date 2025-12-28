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

// Speech pattern types
type SpeechPatternType = 'aphasia' | 'dysarthria' | 'standard';
type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'IMPORTANT' | null;

// Smart home action types (non-nullable for keywords record)
type SmartHomeActionType =
  | 'lights_on' | 'lights_off' | 'lights_bright' | 'lights_dim'
  | 'temp_up' | 'temp_down' | 'temp_set'
  | 'tv_on' | 'tv_off' | 'volume_up' | 'volume_down'
  | 'door_lock' | 'door_unlock'
  | 'curtains_open' | 'curtains_close'
  | 'call_help' | 'call_family';

// Nullable version for response
type SmartHomeAction = SmartHomeActionType | null;

interface ActionParams {
  room?: string;
  device?: string;
  amount?: number;
  urgency?: string;
}

interface SpeechPattern {
  type: SpeechPatternType;
  isFragmented: boolean;
  hasRepeatedSounds: boolean;
  wordCount: number;
  urgencyLevel: UrgencyLevel;
}

interface ConversationMessage {
  type: string;
  content: string;
}

interface CalibrationExample {
  phrase: string;
  audioBlob?: string;
  timestamp?: string;
}

interface UserProfile {
  conditions?: string[];
  calibration_examples?: CalibrationExample[];
}

interface VisualContext {
  room?: string;
  objects?: string[];
  people_count?: number;
  context_hint?: string;
  timestamp?: string;
}

interface DisambiguationRequest {
  transcript: string;
  conversationHistory?: ConversationMessage[];
  userContext?: string;
  userProfile?: UserProfile;
  visualContext?: VisualContext;
}

// Urgent keywords for safety detection
const URGENT_KEYWORDS = {
  critical: ['cant breathe', "can't breathe", 'chest pain', 'heart', 'stroke', 'emergency', '911', 'dying'],
  urgent: ['help', 'pain', 'hurt', 'bathroom', 'fall', 'fell', 'sick', 'dizzy', 'vomit', 'blood'],
  important: ['medication', 'uncomfortable', 'cold', 'hot', 'thirsty', 'hungry', 'tired']
};

// Action keywords for smart home control - includes stutter patterns
const ACTION_KEYWORDS: Record<SmartHomeActionType, string[]> = {
  lights_on: ['too dark', 'dark', 'light on', 'lights on', 'turn on light', 'need light', 'cant see', "can't see",
    'li-li-light', 'l-l-light', 'li light on', 'li-light on', 'ligh on', 'lite on', 'lites on', 'light o', 'lights o',
    'li on', 'lig on', 'ligh on', 'turn on the light', 'switch on light', 'li-lights on'],
  lights_off: ['too bright', 'light off', 'lights off', 'turn off light',
    'li-li-light off', 'l-l-light off', 'li light off', 'li-light off', 'ligh off', 'lite off', 'lites off',
    'li off', 'lig off', 'turn off the light', 'switch off light', 'li-lights off', 'light of', 'lights of'],
  lights_bright: ['brighter', 'more light', 'increase light', 'brighten'],
  lights_dim: ['dimmer', 'less light', 'decrease light', 'softer', 'dim'],
  temp_up: ['cold', 'freezing', 'chilly', 'warmer', 'heat up', 'too cold'],
  temp_down: ['hot', 'warm', 'cooler', 'cool down', 'too hot', 'too warm'],
  temp_set: ['set temperature', 'temp to'],
  tv_on: ['watch tv', 'tv on', 'turn on tv', 'television on', 'wan watch', 't-t-tv', 'te-tv on'],
  tv_off: ['tv off', 'turn off tv', 'television off', 't-t-tv off'],
  volume_up: ['louder', 'volume up', 'cant hear', "can't hear", 'too quiet'],
  volume_down: ['quieter', 'volume down', 'too loud'],
  door_lock: ['lock door', 'lock the door', 'secure'],
  door_unlock: ['unlock door', 'unlock the door', 'open door'],
  curtains_open: ['open curtain', 'open blind', 'let light in', 'open window'],
  curtains_close: ['close curtain', 'close blind', 'block light', 'close window'],
  call_help: ['help', 'call for help', 'need help', 'emergency', 'h-h-help', 'he-help'],
  call_family: ['call family', 'call home', 'phone family']
};

// Normalize stuttered speech - removes repetitions like "li-li-light" -> "light"
function normalizeStutter(message: string): string {
  // Remove repeated syllables with hyphens: li-li-light -> light
  let normalized = message.replace(/\b(\w+)-\1-(\w+)/gi, '$2');
  // Also handle: l-l-light -> light
  normalized = normalized.replace(/\b(\w)-\1-(\w+)/gi, '$2');
  // Handle: li-light -> light  
  normalized = normalized.replace(/\b(\w{1,2})-(\w+)/gi, '$2');
  // Handle repeated words: "light light on" -> "light on"
  normalized = normalized.replace(/\b(\w+)\s+\1\b/gi, '$1');
  return normalized;
}

// Detect smart home action from message
function detectAction(message: string): { action: SmartHomeActionType; room?: string } | null {
  const lower = message.toLowerCase();
  const normalized = normalizeStutter(lower);

  // Check both original and normalized versions
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS) as [SmartHomeActionType, string[]][]) {
    if (keywords.some(k => lower.includes(k) || normalized.includes(k))) {
      // Try to extract room from message
      const roomPatterns = [
        /(?:in\s+(?:the\s+)?|)(?:living\s+room|bedroom|kitchen|bathroom|dining\s+room|office|garage)/i,
        /(?:living|bed|bath)room/i
      ];
      let room: string | undefined;
      for (const pattern of roomPatterns) {
        const match = message.match(pattern);
        if (match) {
          room = match[0].replace(/^(?:in\s+(?:the\s+)?)/i, '').trim();
          break;
        }
      }
      return { action, room };
    }
  }
  return null;
}

// Detect urgency level from message
function detectUrgency(message: string): UrgencyLevel {
  const lower = message.toLowerCase();

  if (URGENT_KEYWORDS.critical.some(k => lower.includes(k))) {
    return 'CRITICAL';
  }
  if (URGENT_KEYWORDS.urgent.some(k => lower.includes(k))) {
    return 'URGENT';
  }
  if (URGENT_KEYWORDS.important.some(k => lower.includes(k))) {
    return 'IMPORTANT';
  }
  return null;
}

// Analyze speech pattern to determine type (aphasia, dysarthria, or standard)
function analyzeSpeechPattern(message: string, userProfile?: UserProfile): SpeechPattern {
  const fragmentIndicators = [
    /\.{2,}/, // Multiple periods (pauses)
    /\s{2,}/, // Multiple spaces
    /\b\w{1,2}\b(?:\s+\b\w{1,2}\b){2,}/, // Many short words
    /(want|need|get|help)(?!\s+\w+)/, // Action verbs without objects
  ];

  const isFragmented = fragmentIndicators.some(pattern => pattern.test(message));

  const hasAphasia = userProfile?.conditions?.includes('aphasia');
  const hasDysarthria = userProfile?.conditions?.includes('dysarthria');
  const urgencyLevel = detectUrgency(message);

  let type: SpeechPatternType = 'standard';
  if (isFragmented && hasAphasia) {
    type = 'aphasia';
  } else if (hasDysarthria) {
    type = 'dysarthria';
  } else if (isFragmented) {
    type = 'aphasia'; // Default fragmented speech to aphasia handling
  }

  return {
    type,
    isFragmented,
    hasRepeatedSounds: /(\w)\1{2,}/.test(message),
    wordCount: message.split(/\s+/).length,
    urgencyLevel
  };
}

// Build context object for prompts
function buildContext(
  transcript: string,
  conversationHistory: ConversationMessage[],
  userProfile?: UserProfile,
  visualContext?: VisualContext,
  speechPattern?: SpeechPattern
) {
  const userPatterns = userProfile?.calibration_examples?.map(ex => ({
    expected: ex.phrase
  })) || [];

  const now = new Date();

  return {
    current_message: transcript,
    recent_conversation: conversationHistory.slice(-5),
    user_speech_patterns: userPatterns,
    visual_environment: visualContext,
    user_conditions: userProfile?.conditions || [],
    pattern_analysis: speechPattern,
    current_time: now.toLocaleTimeString(),
    current_day: now.toLocaleDateString('en-US', { weekday: 'long' })
  };
}

// Build URGENT situation prompt - handles safety-critical situations
function buildUrgentPrompt(context: ReturnType<typeof buildContext>, urgencyLevel: UrgencyLevel): string {
  const detectedKeywords = [
    ...URGENT_KEYWORDS.critical,
    ...URGENT_KEYWORDS.urgent,
    ...URGENT_KEYWORDS.important
  ].filter(k => context.current_message.toLowerCase().includes(k));

  return `URGENT MEDICAL/SAFETY SITUATION DETECTED

User said: "${context.current_message}"
Contains urgent keywords: ${detectedKeywords.join(', ')}
Detected urgency level: ${urgencyLevel}

PRIORITY ASSESSMENT:
🔴 CRITICAL (call 911): "can't breathe", "chest pain", "fell down", "stroke"
🟡 URGENT (call caregiver): "pain", "bathroom", "help", "sick"
🟢 IMPORTANT but non-emergency: "medication", "uncomfortable"

YOUR RESPONSE MUST:
1. Acknowledge urgency immediately
2. Take action (offer to call for help)
3. Stay calm and reassuring
4. Ask clarifying questions ONLY if safe to wait
5. Don't delay for unclear speech - interpret best guess and ACT

EXAMPLES:

Input: "help... pain... bad"
Response: "I'm calling for help right now. Stay with me."
Action: Trigger caregiver alert

Input: "bathroom... need... now"
Response: "I'll call for bathroom assistance immediately."
Action: Alert caregiver

Input: "can't... breathe... chest"
Response: "I'm calling 911 right now. Stay calm, help is coming."
Action: Emergency call

Input: "fell... hip... hurts"
Response: "Don't move. I'm getting help right now. Are you bleeding?"
Action: Call for help + assess severity

RESPOND IN JSON:
{
  "interpretation": "what happened - reconstructed clearly",
  "urgency_level": "${urgencyLevel}",
  "confidence": 95,
  "alternatives": [],
  "response": "immediate reassuring response that takes action",
  "action_required": "call_911" | "call_caregiver" | "alert_family" | "check_on_user",
  "reasoning": "detected urgent need, prioritizing safety"
}

DO NOT delay. DO NOT ask them to clarify if situation seems critical. ACT FIRST, clarify later.`;
}

// Build DYSARTHRIA-specific prompt (slurred/unclear pronunciation)
function buildDysarthriaPrompt(context: ReturnType<typeof buildContext>): string {
  const conversationStr = context.recent_conversation
    .map(msg => `${msg.type}: ${msg.content}`)
    .join('\n');

  const patternsStr = context.user_speech_patterns
    .map(p => `- "${p.expected}"`)
    .join('\n');

  const visualStr = context.visual_environment
    ? `Location: ${context.visual_environment.room || 'unknown'}, Objects visible: ${context.visual_environment.objects?.join(', ') || 'none detected'}`
    : 'No visual context available';

  return `You are Ember, an AI assistant helping someone with DYSARTHRIA (motor speech disorder causing slurred/unclear pronunciation).

CRITICAL CONTEXT:
USER'S SPEECH: "${context.current_message}"
Visual context: ${visualStr}
Time: ${context.current_time} (${context.current_day})

Recent Conversation:
${conversationStr || 'No previous messages.'}

User's Calibration Examples (their typical speech patterns):
${patternsStr || 'No calibration examples available.'}

═══════════════════════════════════════════════════════
DYSARTHRIA CHARACTERISTICS:
═══════════════════════════════════════════════════════
- Grammar and sentence structure are CORRECT
- Only pronunciation is affected
- Consonants may be unclear: "coff" for "coffee", "wan" for "want"
- Words may be slurred together
- They KNOW what they want to say, their mouth just can't say it clearly

═══════════════════════════════════════════════════════
YOUR TASK:
═══════════════════════════════════════════════════════
1. Use visual context to disambiguate (in kitchen + says "coff" = coffee, not copy)
2. Use conversation history (if they just asked about drinks, "coff" definitely means coffee)
3. Use time of day (morning + "coff" = coffee, not coughing)
4. Consider common daily needs over obscure interpretations
5. Reconstruct the INTENDED words from unclear sounds

COMMON PATTERNS:
- Morning (6am-11am): Coffee, breakfast, medication reminders
- Afternoon (11am-5pm): Lunch, activities, communication help
- Evening (5pm-10pm): Dinner, TV/entertainment, prepare for bed
- Night (10pm-6am): Sleep issues, pain, bathroom needs

CONFIDENCE SCORING:
- 90-100: Visual context confirms + conversation history supports
- 70-89: Strong contextual clues
- 50-69: Reasonable guess based on partial context
- Below 50: Multiple interpretations equally likely

RESPOND IN JSON:
{
  "interpretation": "what they actually meant to say (corrected pronunciation)",
  "confidence": 85,
  "alternatives": [
    "alternative interpretation 1",
    "alternative interpretation 2"
  ],
  "response": "your warm, helpful response as Ember - respond as if you understood perfectly",
  "reasoning": "brief explanation: visual context (kitchen) + time (morning) + sound pattern (coff) = coffee"
}

IMPORTANT: Your response should be warm and helpful, as if you understood perfectly. NEVER mention their speech difficulty. NEVER say "I can't understand you."`;
}

// Build APHASIA-specific prompt (fragmented speech, word-finding difficulty)
function buildAphasiaPrompt(context: ReturnType<typeof buildContext>): string {
  const conversationStr = context.recent_conversation
    .map(msg => `${msg.type}: ${msg.content}`)
    .join('\n');

  const visualStr = context.visual_environment
    ? `Location: ${context.visual_environment.room || 'unknown'}, Objects visible: ${context.visual_environment.objects?.join(', ') || 'none detected'}`
    : 'No visual context available';

  return `You are Ember, an AI assistant helping someone with APHASIA (language processing disorder causing fragmented speech and word-finding difficulties).

CRITICAL CONTEXT:
USER'S FRAGMENTS: "${context.current_message}"
Visual context: ${visualStr}
Time: ${context.current_time} (${context.current_day})

Recent Conversation:
${conversationStr || 'No previous messages.'}

═══════════════════════════════════════════════════════
APHASIA CHARACTERISTICS:
═══════════════════════════════════════════════════════
- They KNOW what they want to say but can't find/form the words
- Speech is fragmented: "want... coffee... hot..." instead of "I want hot coffee"
- Function words missing: "go store" instead of "I need to go to the store"
- May use wrong words accidentally but context reveals meaning
- Pauses (...) indicate word-searching, not thinking what to say
- Intelligence is NOT affected - only language processing

═══════════════════════════════════════════════════════
COMMON APHASIA PATTERNS:
═══════════════════════════════════════════════════════
FRAGMENT TYPE: Single nouns = "I want [noun]" or "I need [noun]"
  Example: "bathroom" = "I need to use the bathroom"

FRAGMENT TYPE: Action verb only = "I want to [verb]" or "I need to [verb]"
  Example: "eat" = "I want to eat" or "I'm hungry"

FRAGMENT TYPE: Noun + adjective = "I want [adjective] [noun]"
  Example: "coffee hot" = "I want hot coffee"

FRAGMENT TYPE: Sequential actions
  Example: "go... store... milk" = "I need to go to the store to buy milk"

FRAGMENT TYPE: Word-finding difficulty
  Example: "the... thing... for writing" = "I need a pen"

FRAGMENT TYPE: Emotional/urgent
  Example: "hurts... here... bad" = "I'm in pain here and it's bad"

═══════════════════════════════════════════════════════
YOUR TASK:
═══════════════════════════════════════════════════════
1. Reconstruct the complete, grammatically correct sentence they're trying to say
2. Use semantic relationships between fragments
3. Consider common daily needs (food, bathroom, comfort, communication)
4. Use visual context (in bedroom + says "bed" = wants to lie down)
5. Reference conversation history (builds on previous topic)
6. ALWAYS offer confirmation if confidence < 80%

RESPOND IN JSON:
{
  "interpretation": "complete reconstructed sentence - what they meant to say",
  "confidence": 75,
  "alternatives": [
    "I want hot coffee",
    "I want the heater on",
    "I want something hot"
  ],
  "response": "Did you mean: [interpretation]? Let me know if that's right.",
  "reasoning": "Fragments 'want', 'coffee', 'hot' + visual context (kitchen) + time (morning) = requesting hot coffee"
}

CRITICAL: ALWAYS offer confirmation. People with aphasia need to verify you understood correctly because they're aware their speech isn't coming out right. Be patient and supportive.`;
}

// Build STANDARD prompt for clearer speech
function buildStandardPrompt(context: ReturnType<typeof buildContext>, userContext?: string): string {
  const conversationStr = context.recent_conversation
    .slice(-2)
    .map(m => m.content)
    .join(', ');

  const visualStr = context.visual_environment
    ? `Location: ${context.visual_environment.room || 'unknown'}`
    : 'unknown location';

  return `You are Ember, a compassionate voice accessibility assistant designed specifically for people with speech disabilities.

USER SAID: "${context.current_message}"

CONTEXT:
${userContext || 'No specific user context.'}
Recent conversation: ${conversationStr || 'None'}
Location: ${visualStr}
Time: ${context.current_time}

═══════════════════════════════════════════════════════
YOUR ROLE:
═══════════════════════════════════════════════════════
- UNDERSTAND unclear or fragmented speech using context
- INTERPRET what the user means, not just what they say
- RESPOND naturally as if their speech was perfectly clear
- HELP them communicate their needs
- PRESERVE their dignity and independence

═══════════════════════════════════════════════════════
COMMON DAILY TASKS YOU HELP WITH:
═══════════════════════════════════════════════════════
1. COMMUNICATION: Making calls, composing messages, scheduling
2. DEVICE CONTROL: Lights, TV, music, temperature
3. INFORMATION: Time, date, weather, reminders
4. IMMEDIATE NEEDS: Food, water, bathroom, comfort
5. EMOTIONAL SUPPORT: Active listening, validation

═══════════════════════════════════════════════════════
TONE & PERSONALITY:
═══════════════════════════════════════════════════════
- WARM but not saccharine
- PATIENT but not slow
- HELPFUL but not overbearing
- RESPECTFUL of their independence
- EMPOWERING, not pitying

Respond naturally and helpfully. If the message is clear, just answer it.
Keep responses concise (1-3 sentences maximum).

RESPOND IN JSON:
{
  "interpretation": "${context.current_message}",
  "confidence": 95,
  "alternatives": [],
  "response": "your warm, helpful response",
  "reasoning": "message was clear"
}`;
}

// Calculate confidence score based on multiple factors
function calculateConfidence(
  original: string,
  interpreted: string,
  context: ReturnType<typeof buildContext>
): number {
  let confidence = 50; // Base confidence

  // Increase confidence if visual context supports interpretation
  if (context.visual_environment) {
    const envSupports = context.visual_environment.objects?.some(obj =>
      interpreted.toLowerCase().includes(obj.toLowerCase())
    );
    if (envSupports) confidence += 20;
  }

  // Increase if conversation history provides context
  if (context.recent_conversation.length > 0) {
    confidence += 10;
  }

  // Increase if message length is reasonable
  const wordCount = interpreted.split(/\s+/).length;
  if (wordCount >= 2 && wordCount <= 15) {
    confidence += 10;
  }

  // Increase if standard pattern (clearer speech)
  if (context.pattern_analysis?.type === 'standard') {
    confidence += 10;
  }

  // Decrease if highly fragmented
  if (context.pattern_analysis?.isFragmented) {
    confidence -= 10;
  }

  // Urgent situations get higher confidence for action
  if (context.pattern_analysis?.urgencyLevel) {
    confidence += 15;
  }

  return Math.min(Math.max(confidence, 10), 99); // Clamp between 10-99
}

serve(async (req) => {
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      transcript,
      conversationHistory = [],
      userContext,
      userProfile,
      visualContext
    }: DisambiguationRequest = await req.json();

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

    // Step 1: Analyze speech pattern
    const speechPattern = analyzeSpeechPattern(transcript, userProfile);
    console.log("Detected pattern:", speechPattern.type, "Fragmented:", speechPattern.isFragmented, "Urgency:", speechPattern.urgencyLevel);

    // Step 1.5: Detect smart home action intent
    const detectedAction = detectAction(transcript);
    console.log("Detected action:", detectedAction);

    // Step 2: Build context
    const context = buildContext(
      transcript,
      conversationHistory,
      userProfile,
      visualContext,
      speechPattern
    );

    // Step 3: Select appropriate prompt based on pattern
    // URGENT situations take priority
    let prompt: string;
    let promptType: string;

    if (speechPattern.urgencyLevel) {
      prompt = buildUrgentPrompt(context, speechPattern.urgencyLevel);
      promptType = `urgent-${speechPattern.urgencyLevel}`;
    } else if (speechPattern.type === 'aphasia') {
      prompt = buildAphasiaPrompt(context);
      promptType = 'aphasia';
    } else if (speechPattern.type === 'dysarthria') {
      prompt = buildDysarthriaPrompt(context);
      promptType = 'dysarthria';
    } else {
      prompt = buildStandardPrompt(context, userContext);
      promptType = 'standard';
    }

    // Add action detection context to prompt if action detected
    if (detectedAction && !speechPattern.urgencyLevel) {
      prompt += `\n\nACTION DETECTED: The user may be requesting smart home action "${detectedAction.action}"${detectedAction.room ? ` in ${detectedAction.room}` : ''}. Include this in your response if appropriate.`;
    }

    console.log("Using prompt type:", promptType, "with action:", detectedAction?.action || 'none');

    // Step 4: Call Gemini API directly
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
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
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Step 5: Parse Gemini response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const cleanJson = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      console.error("Failed to parse Gemini response:", content);
      parsed = {
        interpretation: transcript,
        confidence: 50,
        alternatives: [],
        response: content,
        reasoning: "Response generated but couldn't parse structured format"
      };
    }

    // Step 6: Recalculate confidence with our scoring
    const calculatedConfidence = calculateConfidence(
      transcript,
      parsed.interpretation || transcript,
      context
    );

    // Use lower of parsed or calculated confidence for safety (except urgent)
    const finalConfidence = speechPattern.urgencyLevel
      ? Math.max(parsed.confidence || 85, 85) // Urgent situations get high confidence for action
      : Math.min(parsed.confidence || 50, calculatedConfidence);

    // Step 7: Determine if confirmation needed
    const requiresConfirmation = !speechPattern.urgencyLevel &&
      (finalConfidence < 80 || speechPattern.isFragmented);

    // Step 8: Build final response
    const processingTime = Date.now() - startTime;

    // Determine action to include in response
    const actionToInclude = detectedAction ? detectedAction.action : (parsed.action || null);
    const actionParams = detectedAction ? { room: detectedAction.room } : (parsed.action_params || {});
    const confirmationNeeded = actionToInclude && !['call_help', 'call_family'].includes(actionToInclude);

    const finalResponse = {
      interpretation: parsed.interpretation || transcript,
      confidence: finalConfidence,
      alternatives: parsed.alternatives || [],
      response: parsed.response || "",
      reasoning: parsed.reasoning || "",
      requires_confirmation: requiresConfirmation || confirmationNeeded,
      urgency_level: speechPattern.urgencyLevel,
      action_required: parsed.action_required || null,
      // Smart home action data
      action: actionToInclude,
      action_params: actionParams,
      action_confirmation_needed: confirmationNeeded,
      metadata: {
        pattern_detected: speechPattern.type,
        prompt_type: promptType,
        is_fragmented: speechPattern.isFragmented,
        is_urgent: !!speechPattern.urgencyLevel,
        has_action: !!actionToInclude,
        processing_time_ms: processingTime,
        visual_context_used: !!visualContext,
        model_used: "google/gemini-2.5-flash"
      }
    };

    console.log("Disambiguation complete:", {
      original: transcript,
      interpreted: finalResponse.interpretation,
      confidence: finalResponse.confidence,
      pattern: speechPattern.type,
      urgency: speechPattern.urgencyLevel,
      action: actionToInclude,
      time_ms: processingTime
    });

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Disambiguation error:", errorMessage);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        interpretation: "",
        confidence: 0,
        alternatives: [],
        requires_confirmation: true
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
