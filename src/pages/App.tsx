import { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmberLogo } from "@/components/EmberLogo";
import { VoiceVisualization } from "@/components/VoiceVisualization";
import { PersonalizationSidebar } from "@/components/PersonalizationSidebar";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { SettingsPanel } from "@/components/SettingsPanel";
import { AphasiaDisambiguation } from "@/components/AphasiaDisambiguation";
import { ProcessingIndicator } from "@/components/ProcessingIndicator";
import { UrgentAlert } from "@/components/UrgentAlert";
import { ActionConfirmation } from "@/components/ActionConfirmation";
import { SceneAnalysis } from "@/components/CameraContext";
import { LiveCaptionDisplay } from "@/components/LiveCaptionDisplay";
import { InterpretationDisplay, InterpretationLoading } from '@/components/InterpretationDisplay';
import { useElevenLabsConversation } from "@/hooks/useElevenLabsConversation";
import { useBrowserVoice } from "@/hooks/useBrowserVoice"; // TEMPORARY: Browser voice for stable demo
import { useToast } from "@/hooks/use-toast";
import { interpretUnclearSpeech } from "@/services/geminiService"; // For browser voice interpretation
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { detectAphasiaPattern } from "@/utils/aphasiaDetector";
import { storeCorrection, findSimilarCorrection } from "@/utils/correctionStorage";
import { executeSmartHomeAction, SmartHomeAction, ActionParams, ACTION_LABELS, getStoredDevices } from "@/services/smartHomeService";
import { sendInterpretationSMS } from "@/services/caregiverService";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Settings,
  History,
  ArrowLeft,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
  PanelRightOpen,
  PanelRightClose,
  Check,
  Captions,
  CaptionsOff,
  FileText,
  Download,
  Keyboard,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import geminiIcon from "@/assets/gemini-icon.png";

// Polish Features
import { DemoMode } from '@/components/DemoMode';
import { celebrateSuccess, celebrateEmergency, celebrateFirstSuccess } from '@/utils/celebrations';
import { voiceFeedback } from '@/utils/voiceFeedback';
import { AccuracyMetrics } from '@/components/AccuracyMetrics';
import { useAccuracyStats } from '@/hooks/useAccuracyStats';
import { useKeyboardShortcuts, ShortcutHints } from '@/hooks/useKeyboardShortcuts';
import { OnboardingTour } from '@/components/OnboardingTour';
import { handleInterpretationError, withGracefulFallback } from '@/utils/errorHandling';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Ear, Brain, MessageCircle } from 'lucide-react';

// ElevenLabs Agent ID - configured via environment variable for flexibility
// Fallback to hardcoded ID for development convenience
const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_5901kdgw48dgeg797zq619xzcmed";

export default function App() {
  const [isCameraEnabled, setCameraEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showAgentConfig, setShowAgentConfig] = useState(!ELEVENLABS_AGENT_ID);
  const [agentId, setAgentId] = useState(ELEVENLABS_AGENT_ID);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [confidence, setConfidence] = useState(85);
  const [detectedContext, setDetectedContext] = useState<string | undefined>();
  const [sceneContext, setSceneContext] = useState<SceneAnalysis | null>(null);
  const [showLiveCaptions, setShowLiveCaptions] = useState(false);
  const [currentInterpretation, setCurrentInterpretation] = useState<{
    original: string;
    interpreted: string;
    confidence: number;
    usedGesture?: boolean;
  } | null>(null);
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [disambiguationData, setDisambiguationData] = useState<{
    original: string;
    alternatives: Array<{ text: string; confidence: number }>;
  } | null>(null);
  const [isProcessingAphasia, setIsProcessingAphasia] = useState(false);
  const [urgentSituation, setUrgentSituation] = useState<{
    urgencyLevel: 'CRITICAL' | 'URGENT' | 'IMPORTANT';
    message: string;
    interpretation: string;
    actionRequired?: string | null;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: SmartHomeAction;
    params: ActionParams;
    message: string;
    brand?: 'smartthings' | 'default';
  } | null>(null);

  // Handle Smart Home actions requested by voice
  const [lastActionResult, setLastActionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Polish Features State
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  const [interpretationCount, setInterpretationCount] = useState(0);
  const { stats, addRecord } = useAccuracyStats();
  const isMobile = useIsMobile();

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, settings, voiceBank, addCorrection, isLoading: isLoadingUserData } = useUserData();

  // Local settings state for emergency contact (fallback for non-logged-in users)
  const [localEmergencyPhone, setLocalEmergencyPhone] = useState<string | null>(null);
  const [localEmergencyMethod, setLocalEmergencyMethod] = useState<'call' | 'whatsapp' | 'sms'>('whatsapp');

  // Check if setup is complete and load local settings
  useEffect(() => {
    const setupComplete = localStorage.getItem('ember_setup_complete');
    if (!setupComplete) {
      navigate('/setup');
    }

    // Load local settings for emergency contact
    const emergencyPhone = localStorage.getItem('ember_emergency_phone');
    const emergencyMethod = localStorage.getItem('ember_emergency_method');
    if (emergencyPhone) setLocalEmergencyPhone(emergencyPhone);
    if (emergencyMethod) setLocalEmergencyMethod(emergencyMethod as 'call' | 'whatsapp' | 'sms');
  }, [navigate]);

  // Get effective emergency contact settings (database > localStorage)
  const emergencyPhone = settings?.emergency_contact_phone || localEmergencyPhone;
  const emergencyMethod = (settings?.emergency_contact_method as 'call' | 'whatsapp' | 'sms') || localEmergencyMethod;

  // Build user profile from database or localStorage (memoized)
  const userProfile = useMemo(() => {
    // Try database first if user is logged in
    if (user && profile) {
      const conditions = profile.condition ? profile.condition.split(',') : [];
      // Get calibration examples from localStorage (not stored in DB currently)
      let calibrationExamples: Array<{ phrase: string; audioBlob?: string; timestamp?: string }> = [];
      try {
        const examples = localStorage.getItem('ember_calibration_examples');
        calibrationExamples = examples ? JSON.parse(examples) : [];
      } catch {
        calibrationExamples = [];
      }

      return {
        conditions,
        calibration_examples: calibrationExamples,
      };
    }

    // Fallback to localStorage for guest users
    try {
      const localProfile = localStorage.getItem('ember_user_profile');
      const examples = localStorage.getItem('ember_calibration_examples');
      return {
        conditions: localProfile ? JSON.parse(localProfile).conditions : [],
        calibration_examples: examples ? JSON.parse(examples) : [],
      };
    } catch {
      return { conditions: [], calibration_examples: [] };
    }
  }, [user, profile]);

  const handleSmartHomeAction = useCallback((action: SmartHomeAction, params: ActionParams & { confirmationRequired?: boolean, message?: string }) => {
    if (params.confirmationRequired) {
      setPendingAction({
        action,
        params,
        message: params.message || `Confirm ${ACTION_LABELS[action]}?`,
        brand: 'smartthings'
      });
    } else {
      // Execute immediately if no confirmation needed (or simple direct command)
      // But for consistency with existing direct command handling in hook,
      // the hook usually executes directly. This callback is primarily for when
      // manual handling/confirmation from the UI is requested.
      // However, if the hook calls this, it EXPECTS us to handle it.
      setPendingAction({
        action,
        params,
        message: params.message || `Confirm ${ACTION_LABELS[action]}?`,
        brand: 'default' // Or executeSmartHomeAction immediately?
      });
      // The previous logic in hook for direct commands calls executeSmartHomeAction.
      // This callback is specifically for the 'too dark' path which REQUIRES confirmation.
    }
  }, []);



  // Handle aphasia detection callback from voice conversation
  const handleAphasiaDetected = useCallback((request: {
    original: string;
    alternatives: Array<{ text: string; confidence: number }>;
    messageId: string;
  }) => {
    console.log("Aphasia detected in voice conversation:", request);
    setDisambiguationData({
      original: request.original,
      alternatives: request.alternatives,
    });
    setShowDisambiguation(true);
  }, []);

  const handleUrgentDetected = useCallback((situation: {
    urgencyLevel: 'CRITICAL' | 'URGENT' | 'IMPORTANT';
  }) => {
    console.log("Urgent situation detected:", situation);
    setUrgentSituation(situation);

    // Also update detected context if interpretation available
    if (situation.interpretation) {
      // We can maybe use a specialized state for this, but for now just log
    }
  }, []);



  // Test function to simulate fragmented aphasia speech
  const {
    messages,
    isConnecting,
    isConnected,
    isSpeaking,
    isDisambiguating,
    processingStage,
    startConversation,
    stopConversation,
    addMessage,
    disambiguateSpeech,
    currentInterpretation: hookCurrentInterpretation,
    isInterpreting,
    confirmInterpretation,
    rejectInterpretation
  } = useElevenLabsConversation({
    agentId,
    enableDisambiguation: true,
    userProfile,
    visualContext: sceneContext,
    emergencyContactPhone: emergencyPhone,
    emergencyContactMethod: emergencyMethod,
    userName: profile?.display_name || undefined,
    onAphasiaDetected: handleAphasiaDetected,
    onUrgentDetected: handleUrgentDetected,
    onSmartHomeAction: handleSmartHomeAction,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPORARY: Browser voice for stable demo (replacing ElevenLabs)
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    isListening: browserIsListening,
    startListening: browserStartListening,
    stopListening: browserStopListening,
    speak: browserSpeak,
    isSupported: browserVoiceSupported,
  } = useBrowserVoice();

  // Use browser listening state instead of ElevenLabs connection state
  const isActuallyConnected = browserIsListening;

  // Local processing stage state for browser voice
  const [localProcessingStage, setLocalProcessingStage] = useState<'idle' | 'listening' | 'interpreting'>('idle');

  // Polish Feature: Keyboard Shortcuts
  const shortcuts = [
    {
      key: ' ',
      action: () => {
        if (!isConnected) toggleListening();
        else stopConversation();
      },
      description: 'Start/stop recording'
    },
    {
      key: 'Enter',
      action: () => {
        if (currentInterpretation) handleConfirm(currentInterpretation.interpreted);
      },
      description: 'Confirm interpretation'
    },
    {
      key: 'Escape',
      action: () => {
        if (currentInterpretation) handleReject();
      },
      description: 'Reject interpretation'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => setDemoModeEnabled(prev => !prev),
      description: 'Toggle demo mode'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => setShowShortcuts(prev => !prev),
      description: 'Show shortcuts'
    }
  ];

  useKeyboardShortcuts(shortcuts, true);

  // DISABLED: Voice Feedback for interpretations - Caused feedback loop
  // useEffect(() => {
  //   if (currentInterpretation && voiceFeedbackEnabled) {
  //     voiceFeedback.speakInterpretation(currentInterpretation.interpreted);
  //   }
  // }, [currentInterpretation, voiceFeedbackEnabled]);

  const handleConfirm = useCallback((selectedText: string) => {
    const isFirstSuccess = interpretationCount === 0;

    if (isFirstSuccess) {
      celebrateFirstSuccess();
      toast({
        title: "🎉 First interpretation successful!",
        description: "You're using Ember like a pro!"
      });
    } else {
      celebrateSuccess();
      toast({ title: "Got it! ✅" });
    }

    if (voiceFeedbackEnabled) {
      voiceFeedback.speakConfirmation(selectedText);
    }

    addRecord({
      input: currentInterpretation?.original || "",
      interpretation: selectedText,
      confidence: currentInterpretation?.confidence || 0,
      wasCorrect: true
    });

    setInterpretationCount(prev => prev + 1);
    confirmInterpretation(selectedText);
  }, [interpretationCount, currentInterpretation, confirmInterpretation, addRecord, toast, voiceFeedbackEnabled]);

  const handleReject = useCallback(() => {
    addRecord({
      input: currentInterpretation?.original || "",
      interpretation: currentInterpretation?.interpreted || "",
      confidence: currentInterpretation?.confidence || 0,
      wasCorrect: false
    });
    rejectInterpretation();
  }, [currentInterpretation, rejectInterpretation, addRecord]);

  const simulateAphasiaSpeech = useCallback(async (testPhrase: string = "want... coffee... hot...") => {
    // Check for aphasia pattern
    const aphasiaCheck = detectAphasiaPattern(testPhrase);

    // Add the message to chat
    addMessage({
      type: "user",
      content: testPhrase,
    });

    if (aphasiaCheck.isLikelyAphasia) {
      setIsProcessingAphasia(true);

      // Check for similar past corrections first
      const previousCorrection = findSimilarCorrection(testPhrase);

      if (previousCorrection) {
        // Use learned correction
        setIsProcessingAphasia(false);
        toast({
          title: "Learned Pattern",
          description: `Using your previous preference: "${previousCorrection}"`,
        });
        return;
      }

      // Call disambiguation API
      const result = await disambiguateSpeech(testPhrase);
      setIsProcessingAphasia(false);

      if (result && (result.confidence < 80 || result.requires_confirmation)) {
        // Show disambiguation modal
        setDisambiguationData({
          original: testPhrase,
          alternatives: [
            { text: result.interpretation, confidence: result.confidence },
            ...(result.alternatives || []).slice(0, 2).map((alt, i) => ({
              text: alt,
              confidence: Math.max(10, result.confidence - (20 * (i + 1)))
            }))
          ].slice(0, 3),
        });
        setShowDisambiguation(true);
      } else if (result) {
        // High confidence - proceed automatically
        toast({
          title: "Understood",
          description: `Interpreted as: "${result.interpretation}"`,
        });
      }
    }
  }, [addMessage, disambiguateSpeech, toast]);

  // Sync hookCurrentInterpretation to local state format (only when hook has data)
  useEffect(() => {
    if (hookCurrentInterpretation) {
      // Get the latest user message for the original text
      const lastUserMsg = [...messages].reverse().find(m => m.type === 'user');
      setCurrentInterpretation({
        original: lastUserMsg?.content || '',
        interpreted: hookCurrentInterpretation.interpretation,
        confidence: hookCurrentInterpretation.confidence,
      });
      setConfidence(hookCurrentInterpretation.confidence);
    } else {
      setCurrentInterpretation(null);
    }
  }, [hookCurrentInterpretation, messages]);

  // Update detected context from scene analysis
  const handleContextUpdate = useCallback((context: {
    room: string;
    objects: string[];
    people_count: number;
    context_hint: string;
    gesture?: string | null;
    pointing_target?: string | null;
    pointing_direction?: string | null;
  } | null) => {
    setSceneContext(context);
    if (context) {
      // Show pointing target if detected
      if (context.pointing_target) {
        setDetectedContext(`Pointing at: ${context.pointing_target}`);
      } else if (context.pointing_direction) {
        setDetectedContext(`Pointing: ${context.pointing_direction}`);
      } else {
        setDetectedContext(`${context.room}${context.objects.length > 0 ? ` - ${context.objects[0]}` : ''}`);
      }
    } else {
      setDetectedContext(undefined);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPORARY: Browser voice toggle (replacing ElevenLabs)
  // ═══════════════════════════════════════════════════════════════════════════
  const toggleListening = useCallback(() => {
    if (browserIsListening) {
      browserStopListening();
      setLocalProcessingStage('idle');
    } else {
      if (!browserVoiceSupported) {
        toast({
          title: "Browser Not Supported",
          description: "Please use Google Chrome for voice features.",
          variant: "destructive",
        });
        return;
      }

      setLocalProcessingStage('listening');

      browserStartListening(async (transcript: string) => {
        console.log('📝 Browser transcript:', transcript);
        const lowerTranscript = transcript.toLowerCase();

        // Add user message
        addMessage({
          type: "user",
          content: transcript,
        });

        // ═══════════════════════════════════════════════════════════════════
        // EMERGENCY HELP DETECTION
        // ═══════════════════════════════════════════════════════════════════
        const helpKeywords = ['help', 'i need help', 'help me', 'call for help', 'emergency', 'call 911'];
        const isHelpRequest = helpKeywords.some(k => lowerTranscript.includes(k));

        if (isHelpRequest) {
          console.log('🚨 Help request detected:', transcript);
          setLocalProcessingStage('interpreting');

          if (!emergencyPhone) {
            browserSpeak("No emergency contact configured. Please add one in settings.");
            toast({
              title: "No Emergency Contact",
              description: "Go to Settings to add your emergency contact number.",
              variant: "destructive",
            });
            addMessage({
              type: "system",
              content: "⚠️ No emergency contact configured. Please add one in Settings.",
            });
            setLocalProcessingStage('idle');
            return;
          }

          try {
            browserSpeak("Calling your emergency contact now. Stay calm, help is on the way.");

            addMessage({
              type: "system",
              content: "🚨 Calling emergency contact...",
            });

            // Call Twilio edge function
            const { data, error } = await supabase.functions.invoke('twilio-emergency-call', {
              body: {
                phoneNumber: emergencyPhone,
                message: `Emergency alert from Ember. Your contact said: "${transcript}". They may need immediate assistance.`,
                userName: profile?.display_name || 'Your contact',
              },
            });

            console.log('Twilio response:', { data, error });

            if (error) throw error;

            if (data?.success) {
              toast({
                title: "Emergency Call Initiated",
                description: "Your emergency contact is being called now.",
              });
              addMessage({
                type: "system",
                content: "✅ Emergency call initiated. Help is on the way.",
              });
            } else {
              throw new Error(data?.error || 'Call failed');
            }
          } catch (error) {
            console.error('Emergency call error:', error);
            browserSpeak("Sorry, I couldn't make the emergency call. Please try again or call manually.");
            toast({
              title: "Call Failed",
              description: error instanceof Error ? error.message : "Could not make emergency call",
              variant: "destructive",
            });
          } finally {
            setLocalProcessingStage('idle');
          }
          return; // Don't continue to other processing
        }

        // ═══════════════════════════════════════════════════════════════════
        // SMART HOME COMMAND DETECTION
        // ═══════════════════════════════════════════════════════════════════

        // Lights ON commands
        const lightsOnKeywords = ['lights on', 'light on', 'turn on the lights', 'turn on lights', 'too dark', "it's dark", 'is dark'];
        const isLightsOn = lightsOnKeywords.some(k => lowerTranscript.includes(k));

        // Lights OFF commands
        const lightsOffKeywords = ['lights off', 'light off', 'turn off the lights', 'turn off lights', 'too bright', "it's bright", 'is bright'];
        const isLightsOff = lightsOffKeywords.some(k => lowerTranscript.includes(k));

        if (isLightsOn || isLightsOff) {
          const action: SmartHomeAction = isLightsOn ? 'lights_on' : 'lights_off';
          const actionLabel = isLightsOn ? 'Turning lights on' : 'Turning lights off';

          console.log(`💡 Smart home command detected: ${action}`);
          setLocalProcessingStage('interpreting');

          // Get stored devices to find the light device ID
          const storedDevices = getStoredDevices();
          const lightDevice = storedDevices.lights[0]; // Use first configured light
          const deviceId = lightDevice?.id;

          console.log('💡 Using light device:', lightDevice?.name || 'none', 'ID:', deviceId || 'none');

          if (!deviceId) {
            browserSpeak("No lights configured. Please add a light in settings.");
            toast({
              title: "No Lights Configured",
              description: "Go to Settings → Smart Home to add your lights.",
              variant: "destructive",
            });
            setLocalProcessingStage('idle');
            return;
          }

          try {
            // Execute SmartThings action with the device ID
            const result = await executeSmartHomeAction(action, { deviceId });

            // Dispatch event to update UI (VoiceControlledLights component)
            window.dispatchEvent(new CustomEvent('ember-voice-command', {
              detail: { action }
            }));

            if (result.success) {
              browserSpeak(actionLabel);
              addMessage({
                type: "assistant",
                content: `✓ ${result.message}`,
              });
              toast({
                title: "Done!",
                description: result.message,
              });
            } else {
              browserSpeak(`Sorry, I couldn't ${isLightsOn ? 'turn on' : 'turn off'} the lights.`);
              addMessage({
                type: "assistant",
                content: `Failed: ${result.message}`,
              });
            }
          } catch (error) {
            console.error('Smart home error:', error);
            browserSpeak(`Sorry, there was an error controlling the lights.`);
            toast({
              title: "Smart Home Error",
              description: "Could not control lights. Check your SmartThings connection.",
              variant: "destructive",
            });
          } finally {
            setLocalProcessingStage('idle');
          }
          return; // Don't run Gemini interpretation for direct commands
        }

        // ═══════════════════════════════════════════════════════════════════
        // GEMINI INTERPRETATION (for unclear speech)
        // ═══════════════════════════════════════════════════════════════════
        setLocalProcessingStage('interpreting');

        try {
          const result = await interpretUnclearSpeech(transcript, userProfile, messages);

          if (result) {
            // Check if Gemini detected a smart home action
            if (result.action?.type === 'lights_on' || result.action?.type === 'lights_off') {
              const action = result.action.type;
              console.log(`💡 Gemini detected smart home action: ${action}`);

              // Get stored devices for the device ID
              const storedDevices = getStoredDevices();
              const lightDevice = storedDevices.lights[0];
              const deviceId = lightDevice?.id;

              if (deviceId) {
                try {
                  const smartResult = await executeSmartHomeAction(action, { deviceId });
                  window.dispatchEvent(new CustomEvent('ember-voice-command', {
                    detail: { action }
                  }));

                  if (smartResult.success) {
                    browserSpeak(result.response || `Done! ${smartResult.message}`);
                    addMessage({
                      type: "assistant",
                      content: `✓ ${smartResult.message}`,
                    });
                  }
                } catch (e) {
                  console.error('Smart home execution error:', e);
                }
              } else {
                console.log('💡 No light device configured, skipping SmartThings');
              }
            }

            setCurrentInterpretation({
              original: transcript,
              interpreted: result.interpretation,
              confidence: result.confidence,
            });

            // Speak the interpretation using browser TTS
            if (!result.action) {
              browserSpeak(`Did you mean: ${result.interpretation}?`);
            }

            // Add assistant response
            addMessage({
              type: "assistant",
              content: `I think you said: "${result.interpretation}" (${result.confidence}% confident)`,
            });
          } else {
            // Fallback if interpretation fails
            setCurrentInterpretation({
              original: transcript,
              interpreted: transcript,
              confidence: 50,
            });
            browserSpeak(`I heard: ${transcript}. Is that correct?`);
          }
        } catch (error) {
          console.error('Interpretation error:', error);
          toast({
            title: "Interpretation Error",
            description: "Could not interpret speech. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLocalProcessingStage('idle');
        }
      });
    }
  }, [browserIsListening, browserStartListening, browserStopListening, browserSpeak, browserVoiceSupported, addMessage, messages, userProfile, toast]);

  const toggleCamera = useCallback((enabled?: boolean) => {
    const newState = typeof enabled === 'boolean' ? enabled : !isCameraEnabled;
    setCameraEnabled(newState);
    if (newState) {
      toast({
        title: "Camera enabled",
        description: "Visual context will help ember understand your environment.",
      });
    }
  }, [isCameraEnabled, toast]);



  const saveAgentId = useCallback(() => {
    if (agentId.trim()) {
      setShowAgentConfig(false);
      localStorage.setItem('ember_agent_id', agentId);
      toast({
        title: "Agent ID Saved",
        description: "You can now start voice conversations.",
      });
    }
  }, [agentId, toast]);

  const handleDisambiguationConfirm = async (confirmedText: string) => {
    // Store correction for learning - both localStorage and database
    if (disambiguationData) {
      storeCorrection(disambiguationData.original, confirmedText);

      // Also save to database if user is logged in
      if (user) {
        await addCorrection(disambiguationData.original, confirmedText);
      }
    }
    setShowDisambiguation(false);
    setDisambiguationData(null);
    toast({ title: "Understood", description: `Proceeding with: "${confirmedText}"` });
  };

  const handleDisambiguationCancel = () => {
    setShowDisambiguation(false);
    setDisambiguationData(null);
  };

  const handleUrgentCallHelp = useCallback(async () => {
    if (!urgentSituation) return;

    console.log('handleUrgentCallHelp called', {
      urgencyLevel: urgentSituation.urgencyLevel,
      emergencyPhone,
      emergencyMethod,
    });

    // Different actions based on urgency level
    if (urgentSituation.urgencyLevel === 'CRITICAL') {
      toast({
        title: "Emergency Services Notified",
        description: "Help is on the way. Stay calm.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Caregiver Alerted",
        description: "Your caregiver has been notified of your need.",
      });
    }

    // Add system message about the action
    addMessage({
      type: "system",
      content: urgentSituation.urgencyLevel === 'CRITICAL'
        ? "🚨 Emergency services have been notified. Help is on the way."
        : "✅ Your caregiver has been alerted and is coming to help.",
    });

    setUrgentSituation(null);
  }, [urgentSituation, toast, addMessage, emergencyPhone, emergencyMethod]);

  const handleUrgentDismiss = useCallback(() => {
    if (urgentSituation?.urgencyLevel === 'CRITICAL') {
      // Don't allow dismissing critical alerts
      return;
    }
    setUrgentSituation(null);
  }, [urgentSituation]);

  // Wrap Emergency handler with red confetti
  const handleUrgentCallHelpWithCelebration = useCallback(async () => {
    celebrateEmergency();
    await handleUrgentCallHelp();
  }, [handleUrgentCallHelp]);

  // Smart home action handlers
  const handleActionConfirm = useCallback(async () => {
    if (!pendingAction) return;

    const result = await executeSmartHomeAction(pendingAction.action, pendingAction.params);
    setLastActionResult({
      success: result.success,
      message: result.message
    });
    setPendingAction(null);

    // Auto-hide result after 3 seconds
    setTimeout(() => setLastActionResult(null), 3000);

    if (result.success) {
      addMessage({
        type: "system",
        content: `✓ ${result.message}`,
      });
    }
  }, [pendingAction, addMessage]);

  const handleActionCancel = useCallback(() => {
    setPendingAction(null);
    toast({ title: "Action cancelled" });
  }, [toast]);

  return (
    <div className="h-screen overflow-hidden bg-[#4ade80] flex flex-col text-black selection:bg-black selection:text-[#4ade80]">
      <OnboardingTour />
      {/* Decorative noise/texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Radial Gradient for Depth */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(0,0,0,0.15)_100%)] z-0"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-black/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-black/60 hover:text-black transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Back to home</span>
            </Link>
            {/* Force text-black for logo context */}
            <div className="text-black">
              <EmberLogo size="sm" />
            </div>
            {isConnected && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 bg-black/5 border border-black/10`}>
                <span className={`w-2 h-2 rounded-full ${processingStage === 'listening'
                  ? 'bg-black animate-pulse'
                  : 'bg-black/50 animate-pulse'
                  }`} />
                <span className="text-black/70">
                  {processingStage === 'listening'
                    ? 'Listening'
                    : processingStage === 'analyzing'
                      ? 'Analyzing'
                      : processingStage === 'interpreting'
                        ? 'Interpreting'
                        : processingStage === 'responding'
                          ? 'Responding'
                          : 'Live'}
                </span>
              </span>
            )}
            {isDisambiguating && !isConnected && (
              <span className="text-xs text-black/70 font-medium px-2 py-1 bg-white/20 rounded-full">
                Processing...
              </span>
            )}
          </div>


          <div className="flex items-center gap-2">
            <div className="relative p-[2px] rounded-full bg-gradient-to-r from-[#4285F4] via-[#34A853] via-[#FBBC05] to-[#EA4335] mr-4 hidden md:flex hover:shadow-[0_0_20px_rgba(66,133,244,0.6)] transition-all shadow-md group hover:scale-[1.02]">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const toastId = toast({
                    title: "Generating Report...",
                    description: "Consulting Gemini and analyzing medical data. This may take a moment.",
                  });

                  try {
                    // 1. Capture visual data (Screenshot of current view)
                    const canvas = await html2canvas(document.body);
                    const imgData = canvas.toDataURL('image/png');

                    // 2. Gather Data (Mocked for now based on available state, in real app would query DB)
                    const stats = {
                      totalInteractions: 142,
                      successfulInteractions: 128,
                      failedInteractions: 14,
                      avgResponseTime: 450,
                      mostUsedPhrases: ["water", "bathroom", "thank you", "lights on"],
                      usageByDay: { "Mon": 10, "Tue": 15, "Wed": 20 }
                    };

                    // 3. Call Gemini Function
                    const { data: reportData, error } = await supabase.functions.invoke('gemini-generate-report', {
                      body: {
                        userName: profile?.display_name || "Patient Name",
                        stats,
                        conditions: userProfile.conditions,
                        reportDate: new Date().toLocaleDateString()
                      }
                    });

                    if (error) throw error;

                    // 4. Generate PDF
                    const doc = new jsPDF();
                    const margins = { top: 20, left: 20, bottom: 20 };
                    let y = margins.top;

                    // Header
                    doc.setFontSize(22);
                    doc.setTextColor(0, 0, 0);
                    doc.text("Medical Progress Report", margins.left, y);
                    y += 10;
                    doc.setFontSize(12);
                    doc.setTextColor(100);
                    doc.text(`Authorized by Ember AI | Date: ${new Date().toLocaleDateString()}`, margins.left, y);
                    y += 20;

                    // Add Sections
                    if (reportData.sections) {
                      reportData.sections.forEach((section: any, index: number) => {
                        // Check for page break
                        if (y > 250) {
                          doc.addPage();
                          y = margins.top;
                        }

                        // Section Title
                        doc.setFontSize(16);
                        doc.setTextColor(0);
                        doc.setFont("helvetica", "bold");
                        doc.text(section.heading, margins.left, y);
                        y += 10;

                        // Content
                        doc.setFontSize(11);
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(50);
                        const splitText = doc.splitTextToSize(section.content, 170);
                        doc.text(splitText, margins.left, y);
                        y += (splitText.length * 6) + 10;

                        // Add Image after 2nd section (Usage Analytics) or wherever convenient
                        if (index === 2) {
                          if (y > 180) { // If not enough space for image
                            doc.addPage();
                            y = margins.top;
                          }
                          doc.addImage(imgData, 'PNG', margins.left, y, 170, 100);
                          y += 110;
                          doc.setFontSize(9);
                          doc.text("Fig 1. Application Usage & Interface Snapshot", margins.left, y - 5);
                        }
                      });
                    }

                    doc.save("Ember_Medical_Report.pdf");

                    toast({
                      title: "Report Downloaded",
                      description: "Medical progress report generated successfully.",
                    });

                  } catch (e: any) {
                    console.error(e);
                    toast({
                      title: "Generation Failed",
                      description: e.message || "Could not generate report.",
                      variant: "destructive"
                    });
                  }
                }}
                className="gap-2 bg-black text-white hover:bg-black hover:text-white w-full h-full rounded-full border-none px-4 py-2 text-sm font-semibold"
              >
                <FileText className="w-4 h-4" />
                Generate PDF with Gemini
                <img src={geminiIcon} alt="Gemini" className="w-5 h-5 ml-1 object-contain" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLiveCaptions(!showLiveCaptions)}
              aria-label={showLiveCaptions ? "Hide live captions" : "Show live captions"}
              className="text-black hover:bg-black/10"
            >
              {showLiveCaptions ? <Captions className="w-5 h-5" /> : <CaptionsOff className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="text-black hover:bg-black/10"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleCamera()}
              aria-label={isCameraEnabled ? "Disable camera" : "Enable camera"}
              className="text-black hover:bg-black/10"
            >
              {isCameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            </Button>
            <Link to="/timeline">
              <Button variant="ghost" size="icon" aria-label="View timeline" className="text-black hover:bg-black/10">
                <History className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Settings"
              className={`transition-colors ${showSettings ? "bg-black text-white hover:bg-black/80" : "text-black hover:bg-black/10"}`}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
              className="hidden md:flex text-black hover:bg-black/10 settings-panel"
            >
              {showSidebar ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header >

      {/* Main content with sidebar */}
      < div className="relative z-10 flex-1 flex overflow-hidden p-4 md:p-6 gap-6" >
        {/* Chat area */}
        < main className="flex-1 flex flex-col overflow-hidden bg-white rounded-[2.5rem] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative" >
          {/* Agent ID Configuration */}
          {
            showAgentConfig && (
              <div className="mb-6 relative rounded-2xl p-6 border border-black/10 bg-white/30 backdrop-blur-md overflow-hidden shadow-sm">
                <GlowingEffect spread={40} glow={false} disabled={false} proximity={64} inactiveZone={0.01} />
                <div className="relative z-10">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-black">
                    <Settings className="w-5 h-5" />
                    ElevenLabs Agent Configuration
                  </h2>
                  <p className="text-sm text-black/70 mb-4">
                    Enter your ElevenLabs Agent ID to enable voice conversations.
                    Create an agent at <a href="https://elevenlabs.io/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-black underline font-semibold">elevenlabs.io/conversational-ai</a>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value)}
                      placeholder="Enter your Agent ID..."
                      className="flex-1 px-4 py-2 rounded-lg bg-white/50 border border-black/10 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                    <Button className="bg-black text-white hover:bg-black/80" onClick={saveAgentId} disabled={!agentId.trim()}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )
          }

          {/* Status Banner */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-black/5 ${isConnected
              ? "bg-white/40 text-black"
              : isConnecting
                ? "bg-white/20 text-black/70"
                : "bg-black/5 text-black/50"
              }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected
                ? "bg-black animate-pulse"
                : isConnecting
                  ? "bg-black/50 animate-pulse"
                  : "bg-black/20"
                }`} />
              <span className="text-sm font-medium">
                {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
              </span>
            </div>

            {/* Polish Feature: Interpretation UI */}
            {(isInterpreting || currentInterpretation) && (
              <div className="w-full max-w-xl interpretation-display">
                {isInterpreting ? (
                  <InterpretationLoading />
                ) : (
                  <InterpretationDisplay
                    originalText={currentInterpretation!.original}
                    interpretation={currentInterpretation!.interpreted}
                    confidence={currentInterpretation!.confidence}
                    onConfirm={handleConfirm}
                    onReject={handleReject}
                  />
                )}
              </div>
            )}
          </div>

          {/* Action Confirmation Modal */}
          {
            pendingAction && (
              <ActionConfirmation
                action={pendingAction.action}
                actionParams={pendingAction.params}
                message={pendingAction.message}
                onConfirm={handleActionConfirm}
                onCancel={handleActionCancel}
                brand={pendingAction.brand}
              />
            )
          }

          {/* Action Result Toast */}
          {
            lastActionResult && (
              <div className={`fixed bottom-8 right-8 p-4 rounded-xl border-2 shadow-2xl z-50 ${lastActionResult.success
                ? 'bg-black/90 border-black text-white'
                : 'bg-red-500/90 border-red-600 text-white'
                }`}>
                <div className="flex items-center gap-3">
                  <Check className="w-6 h-6" />
                  <p className="font-medium">{lastActionResult.message}</p>
                </div>
              </div>
            )
          }

          {/* Urgent Alert Modal */}
          {
            urgentSituation && (
              <UrgentAlert
                urgencyLevel={urgentSituation.urgencyLevel}
                message={urgentSituation.message}
                interpretation={urgentSituation.interpretation}
                emergencyContactPhone={emergencyPhone}
                emergencyContactMethod={emergencyMethod}
                userName={profile?.display_name || undefined}
                onCallHelp={handleUrgentCallHelp}
                onDismiss={handleUrgentDismiss}
              />
            )
          }

          {/* Aphasia Disambiguation Modal */}
          {
            showDisambiguation && disambiguationData && (
              <AphasiaDisambiguation
                originalMessage={disambiguationData.original}
                alternatives={disambiguationData.alternatives}
                onConfirm={handleDisambiguationConfirm}
                onCancel={handleDisambiguationCancel}
              />
            )
          }

          {/* Live Caption Display */}
          <LiveCaptionDisplay
            currentMessage={currentInterpretation?.original}
            interpretation={currentInterpretation?.interpreted}
            confidence={currentInterpretation?.confidence}
            usedGesture={currentInterpretation?.usedGesture}
            isActive={showLiveCaptions}
            onClose={() => setShowLiveCaptions(false)}
          />

          {/* Processing Indicator */}
          {
            isProcessingAphasia && (
              <div className="mb-6">
                <ProcessingIndicator stage="analyzing" />
              </div>
            )
          }

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.filter(m => m.type === 'user').map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    relative max-w-[85%] px-5 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                    ${message.type === "user"
                      ? "bg-[#4ade80] text-black rounded-2xl rounded-tr-sm font-bold"
                      : "bg-white text-black rounded-2xl rounded-tl-sm font-medium"
                    }
                  `}
                >
                  <p className="leading-snug text-lg">
                    {message.content}
                  </p>

                  {message.interpretation && (
                    <div className="mt-2 pt-2 border-t-2 border-black/10">
                      <p className="text-xs font-bold opacity-70 flex items-center gap-1.5 break-words">
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        <span className="italic">"{message.interpretation}"</span>
                        {message.confidence && (
                          <span className="ml-auto bg-black/5 px-1.5 py-0.5 rounded text-[10px] tabular-nums">
                            {message.confidence}%
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Processing stage indicator */}
            {localProcessingStage === 'interpreting' && (
              <div className="flex justify-start">
                <ProcessingIndicator
                  stage="interpreting"
                  className="max-w-[80%]"
                />
              </div>
            )}

            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="flex justify-start">
                <div className="bg-white/60 border border-white/40 rounded-2xl px-4 py-3 backdrop-blur-sm shadow-sm">
                  <p className="text-sm text-black flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ember is speaking...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Voice Visualization - Floating above controls */}
          <div className="absolute bottom-32 inset-x-0 flex justify-center pointer-events-none z-10 opacity-50">
            <VoiceVisualization isActive={browserIsListening} />
          </div>

          {/* Control Capsule */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-black/40 h-5">
              {localProcessingStage === 'interpreting'
                ? "Interpreting with Gemini..."
                : browserIsListening
                  ? "Listening..."
                  : "Tap to speak"
              }
            </p>

            <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-black/40 hover:text-black hover:bg-black/5 w-10 h-10"
              >
                <Keyboard className="w-5 h-5" />
              </Button>

              <button
                onClick={toggleListening}
                disabled={localProcessingStage === 'interpreting'}
                className={`
                  relative w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-300 focus:outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed
                  group hover:scale-105 active:scale-95
                `}
                aria-label={browserIsListening ? "Stop listening" : "Start listening"}
              >
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <GlowingEffect spread={15} glow={true} disabled={false} proximity={32} inactiveZone={0.01} />
                </div>
                <div className={`relative z-10 w-full h-full flex items-center justify-center rounded-full shadow-lg transition-all border-2 ${browserIsListening ? "bg-red-500 border-red-500 text-white animate-pulse" : "bg-black border-black text-white"} voice-button`}>
                  {localProcessingStage === 'interpreting' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : browserIsListening ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-black/40 hover:text-black hover:bg-black/5 w-10 h-10">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => simulateAphasiaSpeech("want... coffee... hot...")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Test Aphasia
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setUrgentSituation({
                      urgencyLevel: 'URGENT',
                      message: 'help... need... someone...',
                      interpretation: 'I need help, please contact someone',
                    })}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 emergency-button"
                  >
                    Alert Emergency
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link to="/setup" className="w-full cursor-default">
                    <DropdownMenuItem>
                      Re-calibrate
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </main >

        {showSidebar && (
          <aside className="hidden md:block w-[22rem] relative h-full">
            <div className={`absolute inset-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-opacity duration-300 ${showSettings ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <PersonalizationSidebar
                confidence={Math.round(confidence)}
                isCameraEnabled={isCameraEnabled}
                onCameraToggle={() => toggleCamera()}
                detectedContext={detectedContext}
                onContextUpdate={handleContextUpdate}
                className="border-0 p-0 bg-transparent"
              />

              {/* Polish Features in Sidebar */}
              <div className="space-y-4">
                <div className="demo-mode-toggle">
                  <DemoMode
                    isEnabled={demoModeEnabled}
                    onToggle={setDemoModeEnabled}
                    onPhraseClick={(phrase: DemoPhrase) => {
                      setCurrentInterpretation({
                        original: phrase.input,
                        interpreted: phrase.interpretation,
                        confidence: phrase.confidence,
                      });
                    }}
                  />
                </div>

                <div className="accuracy-metrics">
                  <AccuracyMetrics stats={stats} />
                </div>

                {/* Voice Feedback Toggle */}
                <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#4ade80] rounded-lg flex items-center justify-center border-2 border-black">
                        <Volume2 className="w-4 h-4 text-black" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-black uppercase tracking-tight">Voice Feedback</span>
                        <p className="text-xs text-black/50">Speak interpretations aloud</p>
                      </div>
                    </div>
                    <Switch
                      checked={voiceFeedbackEnabled}
                      onCheckedChange={setVoiceFeedbackEnabled}
                      className="data-[state=checked]:bg-black"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 font-black text-black uppercase tracking-tight text-sm"
                >
                  <Keyboard className="w-4 h-4" />
                  {showShortcuts ? "Hide Shortcuts" : "Keyboard Shortcuts"}
                </button>

                {showShortcuts && (
                  <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="bg-black/5 px-4 py-2 border-b-2 border-black/10">
                      <p className="text-xs font-bold text-black/50 uppercase tracking-wide">Quick Actions</p>
                    </div>
                    <div className="p-4">
                      <ShortcutHints shortcuts={shortcuts} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Overlay */}
            <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
          </aside>
        )}
      </div >


    </div >
  );
}
