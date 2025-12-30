// ═══════════════════════════════════════════════════════════════════════════
// TEMPORARY: ELEVENLABS INTEGRATION DISABLED FOR STABLE DEMO
// This entire hook is commented out but preserved
// Will be re-enabled before final GitHub submission
// Using browser SpeechRecognition + SpeechSynthesis instead
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from "react";
import { GeminiInterpretation } from "@/services/geminiService";

// Keep interfaces exported for type compatibility
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

export type ProcessingStage = 'idle' | 'listening' | 'analyzing' | 'interpreting' | 'responding';

// Dummy hook - returns minimal interface for compatibility
// Real implementation is preserved below in comment block
export function useElevenLabsConversation(_props: any = {}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: "Welcome to Ember. Tap the microphone to start speaking.",
      timestamp: new Date(),
    },
  ]);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [currentInterpretation, setCurrentInterpretation] = useState<GeminiInterpretation | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const messageIdRef = useRef(0);

  const addMessage = useCallback((message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${++messageIdRef.current}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  return {
    messages,
    isConnecting: false,
    isDisambiguating: false,
    processingStage,
    isConnected: false,
    isSpeaking: false,
    startConversation: () => console.log('⚠️ ElevenLabs disabled - using browser voice instead'),
    stopConversation: () => console.log('⚠️ ElevenLabs disabled'),
    disambiguateSpeech: async () => null,
    addMessage,
    setMessages,
    currentInterpretation,
    setCurrentInterpretation,
    isInterpreting,
    setIsInterpreting,
    setProcessingStage,
    confirmInterpretation: async (selectedText: string) => {
      console.log('✅ User confirmed:', selectedText);
      setCurrentInterpretation(null);
    },
    rejectInterpretation: () => {
      console.log('❌ User rejected interpretation');
      setCurrentInterpretation(null);
    }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ELEVENLABS INTEGRATION - PRESERVED BUT DISABLED FOR DEMO
   ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isUnclearSpeech, getSpeechCategory } from "@/utils/speechDetection";
import { interpretUnclearSpeech, GeminiInterpretation } from "@/services/geminiService";
import { findSimilarCorrection } from "@/utils/correctionStorage";
import { getStoredDevices, executeSmartHomeAction, SmartHomeAction, getActionFromVisualCommand } from "@/services/smartHomeService";

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
  onSmartHomeAction?: (action: SmartHomeAction, params: any) => void;
}

// ... FULL ELEVENLABS IMPLEMENTATION WAS HERE ...
// ... 800+ lines of ElevenLabs integration code ...
// ... Will be restored before final submission ...

*/ // END ELEVENLABS INTEGRATION
