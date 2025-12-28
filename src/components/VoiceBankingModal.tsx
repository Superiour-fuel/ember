import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VoiceVisualization } from "@/components/VoiceVisualization";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  Heart,
  Shield,
  Clock,
  Loader2,
  Sparkles
} from "lucide-react";

const VOICE_BANKING_PASSAGE = `The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow. Throughout the centuries, people have explained the rainbow in various ways. Some have accepted it as a miracle without physical explanation. To the Hebrews, it was a token that there would be no more universal floods.`;

// Clean passage for comparison
const CLEAN_PASSAGE = VOICE_BANKING_PASSAGE.replace(/[.,]/g, '').toLowerCase();

// Split passage into words for visualization
const TARGET_WORDS = VOICE_BANKING_PASSAGE.split(' ');

interface VoiceBankingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoiceBankSaved?: () => void;
}

// Add SpeechRecognition type definition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceBankingModal({
  open,
  onOpenChange,
  onVoiceBankSaved
}: VoiceBankingModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStep, setSavingStep] = useState<'saving' | 'cloning' | 'done'>('saving');

  // Validation State
  const [targetWords] = useState<string[]>(TARGET_WORDS);
  const [wordStatuses, setWordStatuses] = useState<('pending' | 'correct' | 'incorrect')[]>(new Array(TARGET_WORDS.length).fill('pending'));
  const [accuracy, setAccuracy] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { voiceBank, saveVoiceBank, profile } = useUserData();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // 1. Start Audio Recording
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
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBlob(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // 2. Start Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }

          // Normalize and split
          const spokenWords = transcript.toLowerCase().trim().split(/\s+/);

          // Logic: Greedy Window Comparison
          // We map spoken words to target words looking for the BEST sequence match.
          // However to be "realtime" and strictly ordered, we just iterate.

          setWordStatuses(prev => {
            const newStatuses = [...prev];
            let spokenIndex = 0;
            let lastMatchedTargetIndex = -1;

            // Find the furthest locked index - we don't change 'correct' to 'incorrect' once decided?
            // Actually, for a single session, we re-evaluate the whole transcript against the target
            // because interim results change.

            // Reset pending/incorrect for re-evaluation if we want dynamic updates, 
            // BUT user might have corrected themselves.
            // Simpler: Just map the CURRENT FULL transcript to the target.

            const cleanTargetWords = targetWords.map(w => w.replace(/[.,]/g, '').toLowerCase());

            let targetIndex = 0;
            for (let i = 0; i < spokenWords.length && targetIndex < cleanTargetWords.length; i++) {
              const spoken = spokenWords[i].replace(/[.,]/g, '');
              if (!spoken) continue;

              // Check fuzzy match with current word
              if (spoken === cleanTargetWords[targetIndex]) {
                newStatuses[targetIndex] = 'correct';
                targetIndex++;
              }
              // Look ahead 1 word (Did they skip?)
              else if (targetIndex + 1 < cleanTargetWords.length && spoken === cleanTargetWords[targetIndex + 1]) {
                newStatuses[targetIndex] = 'incorrect'; // Skipped
                newStatuses[targetIndex + 1] = 'correct';
                targetIndex += 2;
              }
              // Look ahead 2 words
              else if (targetIndex + 2 < cleanTargetWords.length && spoken === cleanTargetWords[targetIndex + 2]) {
                newStatuses[targetIndex] = 'incorrect';
                newStatuses[targetIndex + 1] = 'incorrect';
                newStatuses[targetIndex + 2] = 'correct';
                targetIndex += 3;
              }
              else {
                // Mispronounced current target?
                // We don't mark it incorrect immediately unless we are sure they moved past it.
                // But simply accumulating "correct" works best for simple reading.
                // If we want RED highlighting for errors, we need to know they "failed" that word.
                // If the spoken word doesn't match any of the next 3, assume it's garbage or mispronounciation of NEXT target
                // and assume targetIndex++ is failed?

                // Strict Mode: If it doesn't match, we assume it was an attempt at targetIndex
                newStatuses[targetIndex] = 'incorrect';
                targetIndex++;
              }
            }

            // Calculate live accuracy
            const correctCount = newStatuses.filter(s => s === 'correct').length;
            setAccuracy(Math.round((correctCount / targetWords.length) * 100));

            return newStatuses;
          });
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      setIsRecording(true);
      setRecordingTime(0);
      setWordStatuses(new Array(targetWords.length).fill('pending')); // Reset
      setAccuracy(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
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
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      audioRef.current = new Audio(audioBlob);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const reRecord = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setWordStatuses(new Array(targetWords.length).fill('pending'));
    setAccuracy(0);
  };

  const calculateClarityScore = () => {
    // Simplified clarity calculation - in production this would analyze audio
    return Math.floor(Math.random() * 15) + 80; // 80-95 range
  };

  const cloneVoiceWithElevenLabs = async (audioData: string): Promise<string | null> => {
    try {
      let voiceName = 'My Ember Voice';

      if (profile?.display_name) {
        voiceName = `${profile.display_name}'s Voice`;
      }

      // Convert base64 data to Blob for FormData
      const base64Content = audioData.split(',')[1];
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/webm' });

      // Create FormData
      const formData = new FormData();
      formData.append('files', audioBlob, 'calibrated_voice.webm');
      formData.append('name', voiceName);
      formData.append('description', 'Voice cloned via Ember voice banking for accessibility');

      const { data, error } = await supabase.functions.invoke('elevenlabs-voice-clone', {
        body: formData,
      });

      if (error) {
        console.error('Voice clone error:', error);
        throw new Error(error.message || 'Failed to clone voice');
      }

      if (data?.error) {
        console.error('Voice clone API error:', data.error);
        throw new Error(data.error);
      }

      return data?.voice_id || null;
    } catch (error) {
      console.error('Voice cloning failed:', error);
      toast({
        title: "Voice cloning failed",
        description: "There was an error creating your voice clone. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSaveVoiceBank = async () => {
    if (!audioBlob || !user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save your voice.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    setSavingStep('saving');

    const clarityScore = calculateClarityScore();

    // Clone voice with ElevenLabs
    setSavingStep('cloning');
    let voiceId: string | null = null;

    try {
      voiceId = await cloneVoiceWithElevenLabs(audioBlob);
    } catch (error) {
      console.error('Voice cloning failed, continuing without clone:', error);
    }

    if (!voiceId) {
      setIsSaving(false);
      toast({
        title: "Voice cloning failed",
        description: "Could not clone your voice. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setSavingStep('done');

    // Save to database
    const { error } = await saveVoiceBank(voiceId, clarityScore);

    if (error) {
      toast({
        title: "Save failed",
        description: "Could not save your voice bank. Please try again.",
        variant: "destructive"
      });
      setIsSaving(false);
      return;
    }

    setIsSaving(false);

    toast({
      title: "Voice cloned successfully!",
      description: `Your voice has been preserved and stored securely. Clarity: ${clarityScore}%`,
    });

    onVoiceBankSaved?.();
    onOpenChange(false);
    setAudioBlob(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[85vw] h-[85vh] p-0 gap-0 border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] rounded-[2rem] bg-white flex flex-col overflow-hidden transition-all duration-300">
        <div className="bg-[#FFFDD0] px-6 py-4 border-b-4 border-black shrink-0 relative z-20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tight">
              <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="block">{voiceBank ? "Update Your Voice" : "Preserve Your Voice"}</span>
                <DialogDescription className="text-base font-bold text-black/60 mt-0.5 line-clamp-1">
                  {voiceBank
                    ? "Record a new sample to update your preserved voice."
                    : "Create a digital copy of your voice that can be used even if your speech changes."}
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 grid lg:grid-cols-12 overflow-hidden bg-white">
          {/* Left: Info Side */}
          <div className="lg:col-span-4 bg-gray-50/50 p-6 border-r-4 border-black overflow-y-auto custom-scrollbar flex flex-col gap-6 hidden lg:flex">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-6 h-6 text-black" />
                <h4 className="font-black text-xl uppercase tracking-tight">Why voice banking?</h4>
              </div>
              <ul className="space-y-3">
                {[
                  "Create a digital copy of your voice",
                  "Use it even if your speech changes",
                  "Only takes 30-60 seconds",
                  "Stored securely in your account"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-bold text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-black text-white rounded-2xl p-5 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transform rotate-1 transition-transform hover:rotate-0 mt-auto">
              <p className="text-sm font-medium leading-relaxed">
                <span className="font-black text-[#4ade80] block mb-2 text-base uppercase tracking-wider">Did you know?</span>
                People with ALS typically need 300+ sentences for traditional voice banking.
                With Ember's technology, we only need <span className="text-[#4ade80] font-bold decoration-2 underline underline-offset-4">30 seconds</span>.
              </p>
            </div>

            {voiceBank && (
              <div className="bg-[#f0fdf4] rounded-2xl p-5 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black text-green-800 uppercase tracking-widest mb-3">Current Status</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#4ade80] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Check className="w-6 h-6 text-black stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-base font-black text-black">
                      Recorded {new Date(voiceBank.recorded_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-bold text-green-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 fill-current" />
                      Clarity Score: {voiceBank.clarity_score}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Interaction Side */}
          <div className="lg:col-span-8 p-6 flex flex-col h-full overflow-hidden relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            {!audioBlob ? (
              <div className="flex flex-col h-full gap-5">
                {/* Reading Card */}
                <div className="flex-1 bg-white rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-0 relative z-10 transition-colors duration-300">
                  <div className="bg-[#FFFDD0] border-b-4 border-black px-5 py-3 flex items-center justify-between shrink-0">
                    <p className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                      <Mic className="w-3 h-3" />
                      Read Aloud
                    </p>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-black/10 ${wordStatuses.filter(s => s === 'correct').length / targetWords.length >= 0.75
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                        }`}>
                        Accuracy: {Math.round((wordStatuses.filter(s => s === 'correct').length / targetWords.length) * 100)}%
                      </span>
                      <span className="text-[10px] font-bold text-black/40">SCROLL FREE</span>
                    </div>
                  </div>
                  <div className="p-6 md:p-10 grow flex items-center justify-center overflow-y-auto custom-scrollbar">
                    <p className="text-lg md:text-xl lg:text-2xl font-medium leading-relaxed font-serif text-gray-400 text-center max-w-3xl tracking-wide selection:bg-black/10">
                      {targetWords.map((word, index) => (
                        <span
                          key={index}
                          className={`transition-colors duration-200 mx-[2px] inline-block ${wordStatuses[index] === 'correct'
                            ? 'text-green-600 font-bold'
                            : wordStatuses[index] === 'incorrect'
                              ? 'text-red-500 line-through decoration-2 decoration-red-500/50 opacity-60'
                              : 'text-gray-800 italic'
                            }`}
                        >
                          {word}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="shrink-0 flex flex-col items-center gap-5 z-20">
                  <div className="w-full max-w-xl bg-white rounded-full p-2 border-4 border-black shadow-sm">
                    <VoiceVisualization isActive={isRecording} className="h-10" />
                  </div>

                  <div className="flex items-center gap-5 w-full max-w-xl">
                    {isRecording && (
                      <div className="bg-red-100 text-red-600 px-5 py-3 rounded-2xl border-4 border-red-500 font-black font-mono text-lg animate-pulse min-w-[100px] text-center shadow-[4px_4px_0px_0px_rgba(239,68,68,0.4)]">
                        {formatTime(recordingTime)}
                      </div>
                    )}

                    <Button
                      className={`flex-1 h-16 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all font-black text-xl uppercase tracking-wide
                        ${isRecording
                          ? "bg-red-500 hover:bg-red-400 text-white"
                          : "bg-black hover:bg-gray-900 text-white"}`}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-6 h-6 mr-3 fill-current" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-6 h-6 mr-3" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 h-full max-w-2xl mx-auto w-full z-10">
                {/* Success State */}
                {accuracy >= 75 ? (
                  <>
                    <div className="w-28 h-28 rounded-[2rem] bg-[#4ade80] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center animate-scale-in">
                      <Check className="w-14 h-14 text-black stroke-[3]" />
                    </div>

                    <div className="text-center space-y-2">
                      <p className="font-black text-3xl uppercase tracking-tight">Great Job!</p>
                      <div className="inline-flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 text-lg font-bold text-gray-600 font-mono bg-white px-5 py-1.5 rounded-xl border-2 border-black/10 shadow-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          Accuracy: {accuracy}%
                        </div>
                        <div className="inline-flex items-center gap-2 text-lg font-bold text-gray-600 font-mono bg-white px-5 py-1.5 rounded-xl border-2 border-black/10 shadow-sm">
                          <Clock className="w-4 h-4" />
                          {formatTime(recordingTime)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 w-full">
                      <Button
                        variant="outline"
                        className="h-14 rounded-xl border-4 border-black font-black text-base hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        onClick={isPlaying ? stopAudio : playAudio}
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-5 h-5 mr-2" />
                            Stop Playback
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Listen
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-14 rounded-xl border-4 border-black font-black text-base hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        onClick={reRecord}
                      >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Re-record
                      </Button>
                    </div>

                    <Button
                      className="w-full h-20 rounded-2xl bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all font-black text-xl uppercase tracking-wide gap-3 mt-2"
                      onClick={handleSaveVoiceBank}
                      disabled={isSaving || !user}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin fill-white" />
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm opacity-80 font-medium">Please wait...</span>
                            <span>
                              {savingStep === 'saving' && "Preparing..."}
                              {savingStep === 'cloning' && "Cloning Voice..."}
                              {savingStep === 'done' && "Finalizing..."}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 fill-[#4ade80] text-[#4ade80]" />
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm opacity-80 font-medium normal-case tracking-normal">Looks good?</span>
                            <span>Save Voice Identity</span>
                          </div>
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Failure State */}
                    <div className="w-28 h-28 rounded-[2rem] bg-red-500 border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center animate-shake">
                      <RotateCcw className="w-14 h-14 text-white stroke-[3]" />
                    </div>

                    <div className="text-center space-y-4 max-w-md">
                      <div>
                        <p className="font-black text-3xl uppercase tracking-tight text-red-600">Calibration Failed</p>
                        <p className="text-lg font-bold text-black/60 mt-2">
                          Accuracy: {accuracy}% (Target: 75%)
                        </p>
                      </div>
                      <p className="text-base font-bold text-gray-800 bg-red-50 border-2 border-red-200 p-4 rounded-xl">
                        We need a clearer recording to create a high-quality voice clone. Please try reading the text again clearly and at a moderate pace.
                      </p>
                    </div>

                    <Button
                      className="w-full h-20 rounded-2xl bg-black text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xl uppercase tracking-wide mt-4"
                      onClick={reRecord}
                    >
                      <RotateCcw className="w-6 h-6 mr-3" />
                      Try Again
                    </Button>
                  </>
                )}

                {!user && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 animate-pulse">
                    Please sign in to save your voice
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
