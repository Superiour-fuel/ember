import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isUnclearSpeech, getSpeechCategory } from "@/utils/speechDetection";
import { interpretUnclearSpeech, GeminiInterpretation } from "@/services/geminiService";
import { findSimilarCorrection } from "@/utils/correctionStorage";
import { getStoredDevices, executeSmartHomeAction, SmartHomeAction, getActionFromVisualCommand } from "@/services/smartHomeService";

export interface Message {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  interpretation?: string | GeminiInterpretation;
  alternatives?: string[];
  confidence?: number;
  timestamp: Date;
  isUnclear?: boolean;
}

export interface DisambiguationResult {
  interpretation: string;
  confidence: number;
  alternatives?: string[];
  reasoning?: string;
  response?: string;
  requires_confirmation?: boolean;
  urgency_level?: 'CRITICAL' | 'URGENT' | 'IMPORTANT' | null;
  action_required?: 'call_911' | 'call_caregiver' | 'alert_family' | 'check_on_user' | null;
  metadata?: {
    pattern_detected: string;
    prompt_type: string;
    is_fragmented: boolean;
    is_urgent: boolean;
    processing_time_ms: number;
    visual_context_used: boolean;
  };
}

export interface AphasiaDisambiguationRequest {
  original: string;
  alternatives: Array<{ text: string; confidence: number }>;
  messageId: string;
}

interface VisualContext {
  room?: string;
  objects?: string[];
  people_count?: number;
  context_hint?: string;
  gesture?: string | null;
  pointing_target?: string | null;
  pointing_direction?: string | null;
}

interface UserProfile {
  conditions?: string[];
  calibration_examples?: Array<{ phrase: string; audioBlob?: string; timestamp?: string }>;
}

interface UrgentSituation {
  urgencyLevel: 'CRITICAL' | 'URGENT' | 'IMPORTANT';
  message: string;
  interpretation: string;
  actionRequired?: string | null;
}

interface UseElevenLabsConversationProps {
  agentId: string;
  enableDisambiguation?: boolean;
  userContext?: string;
  userProfile?: UserProfile;
  visualContext?: VisualContext | null;
  emergencyContactPhone?: string | null;
  emergencyContactMethod?: 'call' | 'whatsapp' | 'sms';
  userName?: string;
  onMessage?: (message: Message) => void;
  onAphasiaDetected?: (request: AphasiaDisambiguationRequest) => void;
  onUrgentDetected?: (situation: UrgentSituation) => void;
  onSmartHomeAction?: (action: SmartHomeAction, params: ActionParams & { confirmationRequired?: boolean, message?: string }) => void;
}

export type ProcessingStage = 'idle' | 'listening' | 'analyzing' | 'interpreting' | 'responding';

export function useElevenLabsConversation({
  agentId,
  enableDisambiguation = true,
  userContext,
  userProfile,
  visualContext,
  emergencyContactPhone,
  emergencyContactMethod = 'whatsapp',
  userName,
  onMessage,
  onAphasiaDetected,
  onUrgentDetected,
  onSmartHomeAction
}: UseElevenLabsConversationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisambiguating, setIsDisambiguating] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [currentInterpretation, setCurrentInterpretation] = useState<GeminiInterpretation | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: "Welcome to Ember. Tap the microphone to start speaking, or record 5 calibration phrases to personalize your experience.",
      timestamp: new Date(),
    },
  ]);
  const { toast } = useToast();
  const messageIdRef = useRef(0);

  // Refs for stable callbacks - allows clientTools to be truly stable
  const emergencyContactPhoneRef = useRef(emergencyContactPhone);
  const emergencyContactMethodRef = useRef(emergencyContactMethod);
  const userNameRef = useRef(userName);
  const onUrgentDetectedRef = useRef(onUrgentDetected);
  const toastRef = useRef(toast);
  const visualContextRef = useRef(visualContext);
  const onSmartHomeActionRef = useRef(onSmartHomeAction);

  // Keep refs updated
  emergencyContactPhoneRef.current = emergencyContactPhone;
  emergencyContactMethodRef.current = emergencyContactMethod;
  userNameRef.current = userName;
  onUrgentDetectedRef.current = onUrgentDetected;
  onUrgentDetectedRef.current = onUrgentDetected;
  toastRef.current = toast;
  visualContextRef.current = visualContext;
  onSmartHomeActionRef.current = onSmartHomeAction;

  // Ref for addMessage to break circular dependency
  const addMessageRef = useRef<(message: Omit<Message, "id" | "timestamp">) => Message>();

  const addMessage = useCallback((message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${++messageIdRef.current}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    onMessage?.(newMessage);
    return newMessage;
  }, [onMessage]);

  // Keep ref updated
  addMessageRef.current = addMessage;

  // Manual TTS using ElevenLabs Edge Function (Cloned Voice) with Browser Fallback
  const speakResponse = useCallback(async (text: string) => {
    setProcessingStage('responding');
    console.log('Generating speech for response:', text);

    const speakWithBrowser = () => {
      console.log('Inputting to browser TTS fallback...');
      const utterance = new SpeechSynthesisUtterance(text);

      // Default settings for clarity
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to get a high quality voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice =>
        (voice.name.includes('Google') || voice.name.includes('Premium') || voice.name.includes('Enhanced')) &&
        voice.lang.startsWith('en')
      ) || voices.find(voice => voice.lang.startsWith('en'));

      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        setProcessingStage('listening');
      };

      utterance.onerror = (e) => {
        console.error("Browser TTS Error:", e);
        setProcessingStage('listening'); // Ensure we go back to listening even on error
      };

      window.speechSynthesis.speak(utterance);
    };

    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text,
          voice_id: userProfile?.calibration_examples?.[0]?.audioBlob ? undefined : 'EXAVITQu4vr4xnSDxMaL',
          stability: 0.5,
          similarity_boost: 0.75,
        }
      });

      if (error) throw error;

      // Play audio
      const blob = new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setProcessingStage('listening');
        URL.revokeObjectURL(url);
      };

      audio.onerror = (e) => {
        console.error("Audio object playback error:", e);
        speakWithBrowser(); // Fallback if audio element fails
      };

      await audio.play();
    } catch (err) {
      console.warn('ElevenLabs TTS failed or edge function unavailable. Falling back to browser TTS.', err);
      // Silently fall back to browser TTS instead of showing error toast
      speakWithBrowser();
    }
  }, [userProfile]);

  // Disambiguate unclear speech using Gemini AI
  const disambiguateSpeech = useCallback(async (transcript: string): Promise<DisambiguationResult | null> => {
    if (!enableDisambiguation) return null;

    try {
      setIsDisambiguating(true);

      const { data, error } = await supabase.functions.invoke("gemini-disambiguate", {
        body: {
          transcript,
          conversationHistory: messages.slice(-10).map(m => ({ type: m.type, content: m.content })),
          userContext,
          userProfile,
          visualContext,
        },
      });

      if (error) {
        console.error("Disambiguation error:", error);
        return null;
      }

      return data as DisambiguationResult;
    } catch (err) {
      console.error("Failed to disambiguate:", err);
      return null;
    } finally {
      setIsDisambiguating(false);
    }
  }, [enableDisambiguation, messages, userContext, userProfile, visualContext]);

  // Stable client tools - using refs so the object never changes
  const clientTools = useRef({
    call_for_help: async (params: { urgency_level?: string; message?: string }) => {
      const urgency = (params.urgency_level?.toUpperCase() || 'URGENT') as 'CRITICAL' | 'URGENT' | 'IMPORTANT';
      const msg = params.message || 'User is asking for help';

      // Use refs for all dependencies
      onUrgentDetectedRef.current?.({
        urgencyLevel: urgency,
        message: msg,
        interpretation: msg,
        actionRequired: urgency === 'CRITICAL' ? 'call_911' : 'call_caregiver',
      });

      // Make call for URGENT or CRITICAL when method is 'call'
      if (emergencyContactPhoneRef.current && emergencyContactMethodRef.current === 'call' && (urgency === 'CRITICAL' || urgency === 'URGENT')) {
        try {
          console.log('Initiating emergency call via voice command...', {
            phone: emergencyContactPhoneRef.current,
            urgency,
            message: msg,
          });

          const { data, error } = await supabase.functions.invoke('twilio-emergency-call', {
            body: {
              phoneNumber: emergencyContactPhoneRef.current,
              message: msg,
              userName: userNameRef.current || 'Your contact',
            },
          });

          console.log('Emergency call response:', { data, error });

          if (error) throw error;

          if (data?.success) {
            toastRef.current({
              title: "Emergency call initiated",
              description: "Your emergency contact is being called now.",
            });
            addMessageRef.current?.({
              type: "system",
              content: "🚨 Emergency call initiated to your contact.",
            });
            return `Emergency call initiated successfully. Call SID: ${data.callSid}`;
          } else {
            throw new Error(data?.error || 'Failed to make call');
          }
        } catch (error) {
          console.error('Failed to make emergency call:', error);
          toastRef.current({
            variant: "destructive",
            title: "Call failed",
            description: error instanceof Error ? error.message : "Could not make emergency call",
          });
          return `Emergency alert shown but call failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }

      return `Emergency alert triggered. ${urgency === 'CRITICAL' || urgency === 'URGENT' ? 'Alert shown to user.' : 'Notification sent.'}`;
    },
    trigger_emergency: async (params: { reason?: string }) => {
      const reason = params.reason || 'Emergency detected';

      onUrgentDetectedRef.current?.({
        urgencyLevel: 'CRITICAL',
        message: reason,
        interpretation: reason,
        actionRequired: 'call_911',
      });

      // Also make a call for trigger_emergency
      if (emergencyContactPhoneRef.current && emergencyContactMethodRef.current === 'call') {
        try {
          console.log('Initiating emergency call via trigger_emergency...', {
            phone: emergencyContactPhoneRef.current,
            reason,
          });

          const { data, error } = await supabase.functions.invoke('twilio-emergency-call', {
            body: {
              phoneNumber: emergencyContactPhoneRef.current,
              message: reason,
              userName: userNameRef.current || 'Your contact',
            },
          });

          console.log('Emergency call response:', { data, error });

          if (error) throw error;

          if (data?.success) {
            toastRef.current({
              title: "Emergency call initiated",
              description: "Your emergency contact is being called now.",
            });
            addMessageRef.current?.({
              type: "system",
              content: "🚨 Emergency call initiated to your contact.",
            });
          }
        } catch (error) {
          console.error('Failed to make emergency call in trigger_emergency:', error);
        }
      }

      return 'Emergency triggered';
    },
    control_lights: async (params: { action?: string; room?: string }) => {
      const action = params.action || 'toggle';
      return await handleSmartHomeControl(`lights ${action}`, params.room);
    },
    turn_lights_on: async (params: { room?: string }) => {
      return await handleSmartHomeControl('lights on', params.room);
    },
    turn_lights_off: async (params: { room?: string }) => {
      return await handleSmartHomeControl('lights off', params.room);
    },
    control_smart_home: async (params: { command?: string; device?: string; room?: string }) => {
      return await handleSmartHomeControl(params.command || params.device || '', params.room);
    },
  }).current;

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

  // Helper function for smart home control (stable, uses no hooks)
  async function handleSmartHomeControl(action: string, room?: string): Promise<string> {
    const devices = getStoredDevices();
    const actionLower = action.toLowerCase();
    const actionNormalized = normalizeStutter(actionLower);

    let smartAction: SmartHomeAction | null = null;
    let deviceId: string | undefined;

    // ========= VISION-VOICE INTEGRATION =========
    // Check if we have visual context with pointing gesture
    const currentVisualContext = visualContextRef.current;
    if (currentVisualContext?.pointing_target || currentVisualContext?.pointing_direction) {
      console.log('[Vision+Voice] Pointing detected:', {
        target: currentVisualContext.pointing_target,
        direction: currentVisualContext.pointing_direction
      });

      // Try to get action from simple command + pointing target
      const visualResult = getActionFromVisualCommand(
        action,
        currentVisualContext.pointing_target,
        currentVisualContext.pointing_direction
      );

      if (visualResult) {
        smartAction = visualResult.action;
        // Get device ID based on category
        if (visualResult.deviceCategory === 'lights' && devices.lights.length > 0) {
          deviceId = devices.lights[0].id;
        } else if (visualResult.deviceCategory === 'entertainment' && devices.entertainment.length > 0) {
          deviceId = devices.entertainment[0].id;
        } else if (visualResult.deviceCategory === 'locks' && devices.locks.length > 0) {
          deviceId = devices.locks[0].id;
        }

        console.log('[Vision+Voice] Resolved:', { smartAction, deviceId, category: visualResult.deviceCategory });

        // Show what we detected
        addMessageRef.current?.({
          type: "system",
          content: `👁️ Detected pointing at: ${currentVisualContext.pointing_target || currentVisualContext.pointing_direction}`,
        });
      }
    }
    // ========= END VISION-VOICE INTEGRATION =========

    // If no visual match, fall back to keyword-based detection
    if (!smartAction) {
      // Check both original and normalized versions for stuttered speech
      const matchesKeyword = (keywords: string[]) =>
        keywords.some(k => actionLower.includes(k) || actionNormalized.includes(k));

      if (matchesKeyword(['light', 'lights', 'li-li', 'l-l-', 'lite', 'ligh'])) {
        if (matchesKeyword(['on', 'turn on'])) {
          smartAction = 'lights_on';
        } else if (matchesKeyword(['off', 'turn off'])) {
          smartAction = 'lights_off';
        } else if (matchesKeyword(['bright', 'brighter'])) {
          smartAction = 'lights_bright';
        } else if (matchesKeyword(['dim', 'darker'])) {
          smartAction = 'lights_dim';
        }
        if (devices.lights.length > 0) {
          deviceId = devices.lights[0].id;
        }
      } else if (matchesKeyword(['tv', 'television', 't-t-'])) {
        if (matchesKeyword(['on', 'turn on'])) {
          smartAction = 'tv_on';
        } else if (matchesKeyword(['off', 'turn off'])) {
          smartAction = 'tv_off';
        }
        if (devices.entertainment.length > 0) {
          deviceId = devices.entertainment[0].id;
        }
      } else if (matchesKeyword(['temperature', 'thermostat', 'temp'])) {
        if (matchesKeyword(['up', 'warmer', 'hotter'])) {
          smartAction = 'temp_up';
        } else if (matchesKeyword(['down', 'cooler', 'colder'])) {
          smartAction = 'temp_down';
        }
      } else if (matchesKeyword(['lock', 'door'])) {
        if (matchesKeyword(['lock'])) {
          smartAction = 'door_lock';
        } else if (matchesKeyword(['unlock'])) {
          smartAction = 'door_unlock';
        }
        if (devices.locks.length > 0) {
          deviceId = devices.locks[0].id;
        }
      }
    }

    if (smartAction) {
      try {
        const result = await executeSmartHomeAction(smartAction, { room, deviceId });
        if (result.success) {
          toastRef.current({
            title: "Done!",
            description: result.message,
          });

          // Dispatch event to update UI (VoiceControlledLights.tsx)
          if (smartAction === 'lights_on' || smartAction === 'lights_off') {
            window.dispatchEvent(new CustomEvent('ember-voice-command', { detail: { action: smartAction } }));
          }

          addMessageRef.current?.({
            type: "system",
            content: `✓ ${result.message}`,
          });

          if (smartAction === 'lights_on') return "Lights on";
          if (smartAction === 'lights_off') return "Lights off";

          return `Success: ${result.message}`;
        } else {
          toastRef.current({
            variant: "destructive",
            title: "Failed",
            description: result.message,
          });
          return `Failed: ${result.message}`;
        }
      } catch (error) {
        console.error('Smart home control error:', error);
        return `Error controlling device: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    return `Could not understand smart home command: ${action}`;
  }

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      console.log("✅ [ElevenLabs] Connected to agent - session started");
      console.log("✅ [ElevenLabs] Microphone should now be active - waiting for user speech");
      setProcessingStage('listening');
      addMessage({
        type: "system",
        content: "Connected to Ember voice assistant. Start speaking!",
      });
    },
    onDisconnect: () => {
      console.log("❌ [ElevenLabs] Disconnected from agent");
      console.log("❌ [ElevenLabs] Check agent settings for inactivity timeout if this happens too quickly");
      setProcessingStage('idle');
      addMessage({
        type: "system",
        content: "Voice session ended.",
      });
    },
    onMessage: async (message: unknown) => {
      console.log("Received message from agent:", JSON.stringify(message, null, 2));

      // Cast to access properties
      const msg = message as Record<string, unknown>;
      const messageType = msg.type as string | undefined;
      const source = msg.source as string | undefined;
      const role = msg.role as string | undefined;

      // Try to extract transcript from various possible message formats
      let transcript: string | undefined;
      let isUserMessage = false;

      // ElevenLabs format: { source: "user", role: "user", message: "..." }
      if ((source === 'user' || role === 'user') && msg.message) {
        transcript = msg.message as string;
        isUserMessage = true;
        console.log("✅ Found user message:", transcript);
      }
      // Alternative: { type: "user_transcript", user_transcription_event: { user_transcript: "..." } }
      else if (messageType === "user_transcript") {
        const event = msg.user_transcription_event as Record<string, unknown> | undefined;
        transcript = event?.user_transcript as string | undefined;
        isUserMessage = true;
      }
      // Other formats
      else if (msg.user_transcript) {
        transcript = msg.user_transcript as string;
        isUserMessage = true;
      } else if (msg.transcript) {
        transcript = msg.transcript as string;
        isUserMessage = true;
      }

      console.log("Extracted transcript:", transcript, "isUserMessage:", isUserMessage);

      if (transcript && isUserMessage) {
        // CRITICAL: Ignore Agent's own interpretations
        // We filter out common phrases where the Agent repeats back or asks for clarification
        if (
          transcript.includes('Did you mean') ||
          transcript.includes('Let me know if') ||
          transcript.includes('Is that correct') ||
          transcript.includes('I think you said') ||
          (transcript.startsWith('I ') && !transcript.toLowerCase().startsWith('i want') && !transcript.toLowerCase().startsWith('i need')) // Agent talking about itself, but allow "I want/need"
        ) {
          console.log('🚫 Ignoring Agent auto-response:', transcript);
          return;
        }

        // Set processing stage to analyzing
        setProcessingStage('analyzing');

        // Add the raw transcript first
        const userMessage = addMessage({
          type: "user",
          content: transcript,
        });

        // DIRECT COMMAND DETECTION - bypass agent for immediate actions
        const lowerTranscript = transcript.toLowerCase();
        const normalizedTranscript = normalizeStutter(lowerTranscript);

        console.log("Processing voice command - original:", lowerTranscript, "normalized:", normalizedTranscript);

        // Check for emergency/help commands
        const helpKeywords = ['help', 'emergency', 'call for help', 'need help', 'h-h-help', 'he-help'];
        if (helpKeywords.some(k => normalizedTranscript.includes(k) || lowerTranscript.includes(k))) {
          console.log('🚨 Direct help command detected:', transcript);
          clientTools.call_for_help({ urgency_level: 'URGENT', message: transcript });
        }

        // Check for "too dark" -> SmartThings Confirmation
        if (lowerTranscript.includes('too dark') || lowerTranscript.includes('it is dark') || lowerTranscript.includes("it's dark")) {
          console.log('💡 Indirect lights command detected (Too Dark):', transcript);
          onSmartHomeActionRef.current?.('lights_on', {
            room: visualContextRef.current?.room || 'current room',
            confirmationRequired: true,
            message: "It seems too dark. Turn on the lights?",
            urgency: 'normal'
          });

          // Acknowledge partially
          const ack = "It seems dark. Checking lights.";
          addMessage({ type: "assistant", content: ack });
          speakResponse("Should I turn on the lights?");
          return;
        }

        // Check for lights commands - dispatch custom events to trigger UI buttons
        const lightsOnKeywords = ['light on', 'lights on', 'turn on light', 'turn on the light', 'on light', 'on the light', 'light', 'lights'];
        const lightsOffKeywords = ['light off', 'lights off', 'turn off light', 'turn off the light', 'off light', 'off the light'];

        // Check OFF first (more specific)
        if (lightsOffKeywords.some(k => normalizedTranscript.includes(k) || lowerTranscript.includes(k))) {
          console.log('💡 Direct lights OFF command detected:', transcript);
          window.dispatchEvent(new CustomEvent('ember-voice-command', { detail: { action: 'lights_off' } }));
          handleSmartHomeControl('lights off');
        } else if (lightsOnKeywords.some(k => normalizedTranscript.includes(k) || lowerTranscript.includes(k))) {
          // Only trigger ON if "off" is NOT in the transcript
          if (!lowerTranscript.includes('off')) {
            console.log('💡 Direct lights ON command detected:', transcript);
            window.dispatchEvent(new CustomEvent('ember-voice-command', { detail: { action: 'lights_on' } }));
            handleSmartHomeControl('lights on');
          }
        }

        // Check for aphasia patterns
        const unclearCheck = isUnclearSpeech(transcript);
        console.log("Unclear speech check:", unclearCheck);

        if (unclearCheck && enableDisambiguation) {
          // Check for previously learned corrections
          const previousCorrection = findSimilarCorrection(transcript);

          if (previousCorrection) {
            // Use learned correction automatically
            console.log("Using learned correction:", previousCorrection);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === userMessage.id
                  ? {
                    ...m,
                    interpretation: previousCorrection,
                    confidence: 95,
                  }
                  : m
              )
            );
            toast({
              title: "Learned Pattern Applied",
              description: `Using your preference: "${previousCorrection}"`,
            });

            // Speak confirmation
            const responseText = `I understand, you want ${previousCorrection}`;
            addMessage({ type: "assistant", content: responseText });
            speakResponse(responseText);

          } else {
            // Use new Interpretation Service
            setIsInterpreting(true);
            setProcessingStage('interpreting');

            interpretUnclearSpeech(transcript, userProfile, messages).then((result) => {
              setIsInterpreting(false);

              if (result) {
                // Set current interpretation for valid confirmation UI
                setCurrentInterpretation(result);

                // Check for urgent situation first - using normalized levels
                if (result.category === 'urgent' || (result.action?.type === 'emergency_call')) {
                  const urgencyLevel = 'URGENT'; // Default to URGENT
                  console.log("Urgent situation detected:", urgencyLevel);
                  onUrgentDetected?.({
                    urgencyLevel: urgencyLevel,
                    message: transcript,
                    interpretation: result.interpretation,
                    actionRequired: result.action?.type === 'emergency_call' ? 'call_caregiver' : null,
                  });

                  // Speak urgent response
                  if (result.response) {
                    addMessage({ type: "assistant", content: result.response });
                    speakResponse(result.response);
                  }
                } else {
                  // Standard interpretation flow
                  if (result.confidence < 80) {
                    // Notify parent/show UI for confirmation
                    // We update the message with interpretation data
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === userMessage.id
                          ? {
                            ...m,
                            interpretation: result,
                            confidence: result.confidence,
                            isUnclear: true
                          }
                          : m
                      )
                    );
                  } else {
                    // High confidence - accept it
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === userMessage.id
                          ? {
                            ...m,
                            interpretation: result.interpretation, // Store string for compat or object? object better
                            confidence: result.confidence,
                          }
                          : m
                      )
                    );

                    if (result.response) {
                      addMessage({ type: "assistant", content: result.response });
                      speakResponse(result.response);
                    }
                  }
                }
              }
            });
          }
        } else {
          // Clear speech - maybe still run interpretation if it's a question?
          // For now, if it's clear, we assume the Agent (ElevenLabs) handles it, OR we do nothing extra
          setCurrentInterpretation(null);
        }
      }

      // IGNORE default agent responses in this mode
      // We rely on Gemini + Manual TTS
      if (messageType === "agent_response") {
        console.log("Ignored default agent response (Transcription Mode active)");
      }
    },
    onError: (error) => {
      console.error("ElevenLabs conversation error:", error);
      // ERROR TOAST REMOVED PER USER REQUEST
    },
  });

  const startConversation = useCallback(async () => {
    if (!agentId) {
      toast({
        title: "Agent ID Required",
        description: "Please configure an ElevenLabs agent ID to use voice features.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Request microphone permission handled by SDK
      // await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log("Requesting conversation token from edge function...");

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agentId },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to get conversation token");
      }

      if (!data?.signed_url) {
        throw new Error("No signed URL received from server");
      }

      console.log("Starting conversation with signed URL...");

      // Start the conversation with WebSocket and disable idle timeout via prompt override
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

      toast({
        title: "Connected",
        description: "Voice assistant is ready. Start speaking!",
      });
    } catch (error: any) {
      console.error("Failed to start conversation:", error);

      if (error.name === "NotAllowedError") {
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access to use voice features.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Could not connect to voice assistant.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, conversation, toast]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      toast({
        title: "Session Ended",
        description: "Voice session has been disconnected.",
      });
    } catch (error) {
      console.error("Error ending conversation:", error);
    }
  }, [conversation, toast]);

  return {
    messages,
    isConnecting,
    isDisambiguating,
    processingStage,
    isConnected: conversation.status === "connected",
    isSpeaking: conversation.isSpeaking,
    startConversation,
    stopConversation,
    disambiguateSpeech,
    addMessage,
    setMessages,
    currentInterpretation,
    isInterpreting,
    confirmInterpretation: async (selectedText: string) => {
      console.log('✅ User confirmed:', selectedText);
      setCurrentInterpretation(null);
      const assistantMessage = { id: `msg-${Date.now()}`, type: 'assistant' as const, content: `I understand: "${selectedText}"`, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
      await speakResponse(`I understand: ${selectedText}`);
    },
    rejectInterpretation: () => {
      console.log('❌ User rejected interpretation');
      setCurrentInterpretation(null);
      const assistantMessage = { id: `msg-${Date.now()}`, type: 'assistant' as const, content: "Sorry, I didn't understand. Please try again.", timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
      speakResponse("Sorry, I didn't understand. Please try again.");
    }
  };
}
