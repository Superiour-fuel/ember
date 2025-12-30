import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmberLogo } from "@/components/EmberLogo";
import { VoiceVisualization } from "@/components/VoiceVisualization";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from '@/integrations/supabase/client';
import { secureVoiceStorage } from "@/services/voiceEncryptionService";
import {
  ArrowRight,
  ArrowLeft,
  Mic,
  Camera,
  Check,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Shield,
  Heart,
  Brain,
  Loader2,
  PartyPopper,
  Sliders,
  Volume2
} from "lucide-react";

// Speech Recognition Types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

const VOICE_BANKING_TEXT = `The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow.`;

// VoiceBankingStep Component
const VoiceBankingStep = ({ onComplete, onVoiceBanked }: { onComplete: () => void, onVoiceBanked: (hasBanked: boolean) => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Use MP4 if supported, fallback to WebM
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Recorded audio:', {
          size: blob.size,
          type: blob.type,
          chunks: audioChunksRef.current.length
        });

        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);

      toast({ title: 'Recording started', description: 'Read the passage below.' });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ title: 'Could not access microphone', variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      toast({ title: 'Recording complete!' });
    }
  };

  const cloneVoice = async () => {
    // Mock Voice Cloning (Demo Mode)
    if (!audioBlob) {
      toast({ title: 'Please record your voice first', variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting voice cloning (DEMO MODE)...');

      // TEMPORARY: Skip actual cloning for demo
      // Use a default ElevenLabs voice instead
      const DEMO_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Adam voice (default)

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Voice "cloned" successfully (using demo voice)');

      // Get user ID for DB record
      const { data: { user } } = await supabase.auth.getUser();

      // Save demo voice to database
      const { error: dbError } = await supabase
        .from('voice_banks')
        .insert({
          user_id: user?.id,
          cloned_voice_id: DEMO_VOICE_ID,
          clarity_score: 85,
          sample_text: 'Rainbow Passage (Demo)',
          recorded_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      // Save to localStorage
      localStorage.setItem('ember_voice_bank', JSON.stringify({
        clonedVoiceId: DEMO_VOICE_ID,
        recordedAt: new Date().toISOString(),
        clarityScore: 85,
        isDemo: true  // Flag this as demo voice
      }));

      toast({ title: 'Voice preserved! (Demo mode: using default voice)', className: "bg-green-500 text-white" });

      onVoiceBanked(true);

      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (error) {
      console.error('Error in voice banking:', error);
      toast({ title: 'Failed to preserve voice', variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in px-2 max-w-3xl mx-auto w-full">
      <div className="shrink-0 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black text-white mb-2 shadow-md mx-auto">
          <Brain className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-black mb-2 flex items-center justify-center gap-2">
          Preserve Your Voice
        </h2>
        <p className="text-sm font-medium text-black/60">
          Record your voice to preserve it. Read the passage below clearly.
        </p>
      </div>

      <div className="flex-1 bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-y-auto max-h-[50vh]">
        <h3 className="font-bold text-lg mb-3 uppercase tracking-wide border-b-2 border-dashed border-gray-200 pb-2">Read this aloud:</h3>
        <p className="text-lg leading-relaxed font-serif text-gray-800 border-l-4 border-green-400 pl-4">
          {VOICE_BANKING_TEXT}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-4 pb-4">
        <VoiceVisualization isActive={isRecording} className="mb-1 opacity-80 h-8 text-black" barColor="#000000" />

        {!isRecording && !audioBlob && (
          <Button onClick={startRecording} size="lg" className="w-full md:w-auto h-14 px-8 rounded-full bg-black text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform">
            <Mic className="mr-2 h-5 w-5" /> Start Recording
          </Button>
        )}

        {isRecording && (
          <Button onClick={stopRecording} variant="destructive" size="lg" className="w-full md:w-auto h-12 px-8 rounded-full font-bold">
            <Square className="mr-2 h-5 w-5 fill-current" /> Stop Recording
          </Button>
        )}

        {audioBlob && !isProcessing && (
          <div className="w-full space-y-4 flex flex-col items-center">
            <div className="flex justify-center w-full">
              <audio src={URL.createObjectURL(audioBlob)} controls className="w-full max-w-md" />
            </div>
            <div className="flex gap-3 justify-center w-full">
              <Button variant="outline" onClick={() => { setAudioBlob(null); audioChunksRef.current = []; }} className="border-2 border-black font-bold h-12 px-6">
                Re-record
              </Button>
              <Button onClick={cloneVoice} className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 shadow-[4px_4px_0px_0px_rgba(0,100,0,0.2)]">
                Clone Voice
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
            <p className="font-bold text-sm">Cloning your voice... (30-60s)</p>
          </div>
        )}

        {!isProcessing && (
          <Button variant="ghost" onClick={onComplete} className="text-muted-foreground hover:text-black">
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
};


type Condition = "dysarthria" | "aphasia" | "als" | "exploring";

interface CalibrationPhrase {
  phrase: string;
  audioBlob?: string;
  timestamp?: string;
}

const CALIBRATION_PHRASES = [
  "Hello, my name is...",
  "I need help",
  "Thank you",
  "I want coffee",
  "Turn on the lights",
];

export default function Setup() {
  const [step, setStep] = useState(1);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [calibrationPhrases, setCalibrationPhrases] = useState<CalibrationPhrase[]>(
    CALIBRATION_PHRASES.map(phrase => ({ phrase }))
  );
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceBankAudio, setVoiceBankAudio] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Speech Verification State
  const [verificationStatus, setVerificationStatus] = useState<(null | 'correct' | 'incorrect')[]>([]);
  const verificationStatusRef = useRef<(null | 'correct' | 'incorrect')[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldSaveRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile, updateSettings, saveVoiceBank } = useUserData();

  const totalSteps = 5;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
      }
    };
  }, [audioUrl]);

  // Reset verification when phrase changes
  useEffect(() => {
    const initialStatus = new Array(CALIBRATION_PHRASES[currentPhraseIndex].split(' ').length).fill(null);
    setVerificationStatus(initialStatus);
    verificationStatusRef.current = initialStatus;
  }, [currentPhraseIndex]);

  // Check for existing profile to skip setup
  useEffect(() => {
    if (user && profile?.condition) {
      toast({
        title: "Welcome back",
        description: "Restoring your saved preferences...",
      });
      navigate('/app');
    }
  }, [user, profile, navigate, toast]);

  // Load ElevenLabs Widget Script
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed@beta"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed@beta";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    return () => {
      // Optional: don't remove script to avoid re-registration issues if component remounts quickly
      // or if other components need it.
      // document.body.removeChild(script); 
    };
  }, []);

  const toggleCondition = (condition: Condition) => {
    setConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately
      setMicPermission(true);
      toast({ title: "Microphone enabled", description: "Ready to listen to your voice." });
    } catch {
      setMicPermission(false);
      toast({
        title: "Microphone access denied",
        description: "Ember needs microphone access to understand your speech.",
        variant: "destructive"
      });
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately
      setCameraPermission(true);
      toast({ title: "Camera enabled", description: "Context awareness activated." });
    } catch {
      setCameraPermission(false);
      toast({
        title: "Camera access denied",
        description: "You can enable this later in settings.",
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (!shouldSaveRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const updatedPhrases = [...calibrationPhrases];
          updatedPhrases[currentPhraseIndex] = {
            ...updatedPhrases[currentPhraseIndex],
            audioBlob: base64,
            timestamp: new Date().toISOString()
          };
          setCalibrationPhrases(updatedPhrases);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };


      // Start Speech Recognition
      if ('webkitSpeechRecognition' in window) {
        const recognition = new window.webkitSpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('')
            .toLowerCase();

          const targetPhrase = CALIBRATION_PHRASES[currentPhraseIndex].toLowerCase();
          const targetWords = targetPhrase.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
          const spokenWords = transcript.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);

          const newStatus = targetWords.map((targetWord, index) => {
            if (index < spokenWords.length) {
              if (spokenWords[index] === targetWord) {
                return 'correct';
              } else {
                return 'incorrect';
              }
            }
            return null;
          });

          setVerificationStatus(newStatus);
          verificationStatusRef.current = newStatus;
        };

        try {
          recognition.start();
        } catch (e) {
          console.error("Speech recognition start failed", e);
        }
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 5) {
            stopRecording();
            return 5;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Validate Logic
      const errors = verificationStatusRef.current.filter(s => s !== 'correct').length;

      if (errors > 1) {
        shouldSaveRef.current = false;
        toast({
          title: "Let's try that again",
          description: "Please speak the phrase clearly.",
          variant: "destructive"
        });
      } else {
        shouldSaveRef.current = true;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const reRecord = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    const updatedPhrases = [...calibrationPhrases];
    updatedPhrases[currentPhraseIndex] = { phrase: updatedPhrases[currentPhraseIndex].phrase };
    setCalibrationPhrases(updatedPhrases);
    const initialStatus = new Array(CALIBRATION_PHRASES[currentPhraseIndex].split(' ').length).fill(null);
    setVerificationStatus(initialStatus);
    verificationStatusRef.current = initialStatus;
  };

  const nextPhrase = () => {
    if (currentPhraseIndex < CALIBRATION_PHRASES.length - 1) {
      setCurrentPhraseIndex(prev => prev + 1);
      setAudioUrl(null);
      setVerificationStatus([]);
      verificationStatusRef.current = [];
    } else {
      // All phrases recorded, go to next step
      // Also trigger Setup saving here if we want to save calibration data before Voice Banking
      saveSetupProgress();
      setStep(4);
    }
  };

  // Helper to save progress so far
  const saveSetupProgress = async () => {
    try {
      if (user) {
        const conditionString = conditions.join(',');
        await updateProfile({ condition: conditionString });
        await updateSettings({ context_preferences: conditions });
      } else {
        // Guest/Hackathon user: Save to localStorage
        const existingProfileJson = localStorage.getItem('ember_user_profile');
        const existingProfile = existingProfileJson ? JSON.parse(existingProfileJson) : {};

        const updatedProfile = {
          ...existingProfile,
          conditions: conditions, // Save selected conditions
          updated_at: new Date().toISOString()
        };

        localStorage.setItem('ember_user_profile', JSON.stringify(updatedProfile));
        console.log("Saved guest profile to localStorage:", updatedProfile);
      }

      const calibrationData = calibrationPhrases.filter(p => p.audioBlob);
      await secureVoiceStorage.setCalibrationExamples(calibrationData, user?.id);
    } catch (e) {
      console.error("Error saving progress", e);
    }
  };

  // Main final completion (Step 5 -> Finish)
  const completeSetup = () => {
    localStorage.setItem('ember_setup_complete', 'true');
    navigate('/app');
  };

  const recordedCount = calibrationPhrases.filter(p => p.audioBlob).length;

  return (
    <div className="h-screen overflow-hidden bg-[#FFFDD0] flex flex-col text-black selection:bg-black selection:text-[#FFFDD0]">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* Header */}
      <header className="relative z-10 border-b border-black/10 shrink-0">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-black transform scale-90 origin-left hover:opacity-70 transition-opacity">
            <EmberLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2 font-bold text-black/60">
            <span className="text-xs uppercase tracking-widest">
              Step {step} / {totalSteps}
            </span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-black/5 w-full shrink-0">
        <div
          className="h-full bg-black transition-all duration-500 ease-out"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Main content - Flex centered, no scroll */}
      <main className="relative z-10 flex-1 container mx-auto px-6 flex flex-col items-center justify-center h-full overflow-hidden pb-8">
        {/* Step 1: Welcome & Condition Selection */}
        {step === 1 && (
          <div className="max-w-4xl w-full animate-fade-up flex flex-col h-full justify-center">
            <div className="text-center mb-6 shrink-0">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white mb-3 shadow-lg">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight leading-none">Welcome to Ember</h1>
              <p className="text-base font-medium text-black/60 leading-relaxed max-w-lg mx-auto">
                Tell us about yourself so we can personalize your experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 shrink-0">
              {[
                { id: "dysarthria", label: "I have dysarthria", desc: "Slurred or unclear speech" },
                { id: "aphasia", label: "I have aphasia", desc: "Word-finding difficulties" },
                { id: "als", label: "I have ALS / Progressive", desc: "Voice may change over time" },
                { id: "exploring", label: "I'm exploring", desc: "Caregiver or family member" },
              ].map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() => toggleCondition(id as Condition)}
                  className={`text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden group h-full flex items-center ${conditions.includes(id as Condition)
                    ? "bg-black text-white border-black shadow-md"
                    : "bg-white text-black border-black hover:bg-gray-50 hover:shadow-md"
                    }`}
                >
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <div className={`w-5 h-5 rounded border-2 flex shrink-0 items-center justify-center transition-colors ${conditions.includes(id as Condition)
                      ? "border-white bg-[#4ade80]"
                      : "border-black/30 group-hover:border-black"
                      }`}>
                      {conditions.includes(id as Condition) && (
                        <Check className="w-3 h-3 text-black stroke-[3]" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-base mb-0 leading-tight">{label}</p>
                      <p className={`text-xs font-medium ${conditions.includes(id as Condition) ? "text-gray-300" : "text-black/50"}`}>{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="shrink-0 mt-auto md:mt-0">
              <Button
                size="lg"
                className="w-full h-12 bg-black hover:bg-black/90 text-white rounded-full text-base font-bold shadow-lg hover:scale-[1.01] transition-all"
                onClick={() => setStep(2)}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Permissions */}
        {step === 2 && (
          <div className="max-w-2xl w-full animate-fade-up flex flex-col h-full justify-center">
            <div className="text-center mb-6 shrink-0">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white mb-3 shadow-lg">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-black mb-2 tracking-tight">Grant Permissions</h1>
              <p className="text-base font-medium text-black/60 leading-relaxed">
                Ember needs access to understand and help you.
              </p>
            </div>

            <div className="grid gap-4 mb-8 shrink-0">
              {/* Microphone */}
              <div className={`relative rounded-2xl p-5 border-2 border-black transition-all ${micPermission === true ? "bg-[#f0fdf4]" : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                }`}>
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-black shrink-0 ${micPermission === true ? "bg-[#4ade80]" : "bg-gray-100"
                    }`}>
                    <Mic className={`w-5 h-5 ${micPermission === true ? "text-black" : "text-black/40"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-lg font-bold">Microphone Access</h3>
                      {micPermission === true ? (
                        <div className="flex items-center gap-1.5 text-black font-bold text-xs bg-[#4ade80]/20 px-2 py-1 rounded-md">
                          <Check className="w-3 h-3" />
                          <span>Enabled</span>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 border-2 border-black text-black font-bold hover:bg-black hover:text-white rounded-lg text-xs" onClick={requestMicPermission}>
                          Enable
                        </Button>
                      )}
                    </div>
                    <p className="text-sm font-medium text-black/60 leading-tight">
                      Required to understand speech.
                    </p>
                  </div>
                </div>
              </div>

              {/* Camera */}
              <div className={`relative rounded-2xl p-5 border-2 border-black transition-all ${cameraPermission === true ? "bg-[#f0fdf4]" : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                }`}>
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-black shrink-0 ${cameraPermission === true ? "bg-[#4ade80]" : "bg-gray-100"
                    }`}>
                    <Camera className={`w-5 h-5 ${cameraPermission === true ? "text-black" : "text-black/40"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-lg font-bold">Camera Access <span className="text-black/40 text-xs font-normal ml-1">(Optional)</span></h3>
                      {cameraPermission === true ? (
                        <div className="flex items-center gap-1.5 text-black font-bold text-xs bg-[#4ade80]/20 px-2 py-1 rounded-md">
                          <Check className="w-3 h-3" />
                          <span>Enabled</span>
                        </div>
                      ) : cameraPermission === false ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 border-2 border-black text-black font-bold hover:bg-black hover:text-white rounded-lg text-xs" onClick={requestCameraPermission}>
                            Enable
                          </Button>
                          <span className="text-xs font-bold text-black/40 bg-black/5 px-2 py-1 rounded-md flex items-center">Skipped</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 border-2 border-black text-black font-bold hover:bg-black hover:text-white rounded-lg text-xs" onClick={requestCameraPermission}>
                            Enable
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-black/60 hover:text-black font-semibold text-xs px-2" onClick={() => setCameraPermission(false)}>
                            Skip
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-black/60 leading-tight">
                      Helps understand context (e.g. location).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-auto md:mt-0">
              <Button variant="outline" size="lg" className="h-12 px-6 rounded-full border-2 border-black text-black font-bold hover:bg-black/5" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="default"
                size="lg"
                className="flex-1 h-12 bg-black text-white rounded-full font-bold hover:bg-black/80 hover:scale-[1.01] transition-all shadow-lg"
                onClick={() => setStep(3)}
                disabled={!micPermission}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Calibration Phrases */}
        {step === 3 && (
          <div className="max-w-2xl w-full animate-fade-up flex flex-col h-full justify-center">
            <div className="text-center mb-6 shrink-0">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black text-white mb-2 shadow-md">
                <Sliders className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-black mb-1">Calibration</h1>
              <p className="text-sm font-medium text-black/60">
                Record 5 phrases to learn your speech.
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between mb-4 px-1 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wide text-black/50">
                Phrase {currentPhraseIndex + 1} / {CALIBRATION_PHRASES.length}
              </span>
              <div className="flex gap-1.5">
                {CALIBRATION_PHRASES.map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-1 rounded-full transition-colors ${calibrationPhrases[i].audioBlob
                      ? "bg-[#4ade80]"
                      : i === currentPhraseIndex
                        ? "bg-black"
                        : "bg-black/10"
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Phrase display */}
            <div className="relative rounded-2xl p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 text-center grow flex flex-col justify-center max-h-48">
              <div className="relative z-10">
                <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Read Aloud</p>
                <p className="text-xl md:text-2xl font-black leading-tight flex flex-wrap justify-center gap-x-2">
                  {CALIBRATION_PHRASES[currentPhraseIndex].split(' ').map((word, index) => {
                    const status = verificationStatus[index];
                    let colorClass = "text-black";
                    if (status === 'correct') colorClass = "text-[#4ade80]";
                    else if (status === 'incorrect') colorClass = "text-red-500";

                    return (
                      <span key={index} className={`transition-colors duration-200 ${colorClass}`}>
                        {word}
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>

            {/* Recording UI */}
            <div className="flex flex-col items-center gap-4 mb-4 shrink-0">
              <VoiceVisualization isActive={isRecording} className="mb-1 opacity-70 h-8" barColor="#000000" />

              {!calibrationPhrases[currentPhraseIndex].audioBlob ? (
                <>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${isRecording
                      ? "bg-red-500 animate-pulse scale-110"
                      : "bg-black hover:scale-105 hover:bg-gray-900"
                      }`}
                  >
                    {isRecording ? (
                      <Square className="w-6 h-6 text-white fill-current" />
                    ) : (
                      <Mic className="w-7 h-7 text-white" />
                    )}
                  </button>
                  <p className="text-sm font-bold text-black/60">
                    {isRecording ? `Recording... ${recordingTime}s` : "Tap to record"}
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const audio = new Audio(audioUrl || calibrationPhrases[currentPhraseIndex].audioBlob);
                        audio.play();
                      }}
                      className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center hover:bg-gray-50 shadow-md"
                    >
                      <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                    </button>
                    <button
                      onClick={reRecord}
                      className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center hover:bg-gray-50 shadow-md"
                    >
                      <RotateCcw className="w-5 h-5 text-black" />
                    </button>
                    <div className="bg-[#4ade80]/20 text-[#1a5d35] px-3 py-1 rounded-full font-bold flex items-center gap-1.5 text-xs h-8">
                      <Check className="w-3 h-3" />
                      Success
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={nextPhrase}
                    className="w-full h-12 bg-black text-white hover:bg-black/90 rounded-full text-base font-bold shadow-lg hover:scale-[1.01] transition-all"
                  >
                    {currentPhraseIndex < CALIBRATION_PHRASES.length - 1 ? (
                      <>
                        Next Phrase
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {!calibrationPhrases[currentPhraseIndex].audioBlob && (
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="mx-auto flex items-center text-black/50 hover:text-black font-semibold text-xs">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back
              </Button>
            )}
          </div>
        )}

        {/* Step 4: Voice Banking (Modified) */}
        {step === 4 && (
          <VoiceBankingStep
            onComplete={() => setStep(5)}
            onVoiceBanked={(success) => setVoiceBankAudio(success ? "banked" : null)}
          />
        )}

        {/* Step 5: Complete */}
        {step === 5 && (
          <div className="max-w-xl w-full animate-fade-up text-center flex flex-col h-full justify-center">
            <div className="shrink-0">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#4ade80] text-black mb-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <PartyPopper className="w-8 h-8" />
              </div>

              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter text-black">You're All Set!</h1>
              <p className="text-lg md:text-xl font-medium text-black/70 mb-8">
                Ember is now personalized to your voice.
              </p>
            </div>

            <div className="rounded-2xl p-6 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 text-left shrink-0">
              <h3 className="text-sm font-black uppercase tracking-wider mb-4 border-b border-black/10 pb-2">Setup Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#4ade80] flex items-center justify-center border border-black">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-base font-bold text-black">{recordedCount}/5 calibration phrases recorded</span>
                </div>
                {voiceBankAudio && (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#4ade80] flex items-center justify-center border border-black">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-base font-bold text-black">Voice banked</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#4ade80] flex items-center justify-center border border-black">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                  <span className="text-base font-bold text-black">Microphone enabled</span>
                </div>
                {cameraPermission && (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#4ade80] flex items-center justify-center border border-black">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-base font-bold text-black">Camera context enabled</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <Button
                size="xl"
                onClick={completeSetup}
                className="h-16 px-10 bg-black text-white hover:bg-black/90 rounded-full text-xl font-black shadow-xl hover:scale-[1.02] transition-all group w-full"
              >
                <Mic className="w-6 h-6 mr-2" />
                Start Speaking
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ElevenLabs Conversational AI Widget */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 text-right">
        <elevenlabs-convai agent-id="agent_5901kdgw48dgeg797zq619xzcmed"></elevenlabs-convai>
      </div>
    </div>
  );
}
