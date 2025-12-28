import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Edit3, X, Volume2, Loader2, VolumeX, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { secureVoiceStorage } from "@/services/voiceEncryptionService";

interface Alternative {
  text: string;
  confidence: number;
}

interface AphasiaDisambiguationProps {
  originalMessage: string;
  alternatives: Alternative[];
  onConfirm: (confirmedText: string) => void;
  onCancel: () => void;
  autoSelectTimeout?: number;
}

export function AphasiaDisambiguation({
  originalMessage,
  alternatives,
  onConfirm,
  onCancel,
  autoSelectTimeout = 8 // Increased to give time for voice playback
}: AphasiaDisambiguationProps) {
  const [selected, setSelected] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [countdown, setCountdown] = useState(autoSelectTimeout);
  const [showCustom, setShowCustom] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Load cloned voice ID from secure encrypted storage
  useEffect(() => {
    try {
      const voiceBank = secureVoiceStorage.getVoiceBank();
      if (voiceBank?.cloned_voice_id) {
        setClonedVoiceId(voiceBank.cloned_voice_id);
        console.log("Using cloned voice from encrypted storage");
      }
    } catch (e) {
      console.error("Error loading cloned voice:", e);
    }
  }, []);

  // Auto-confirm countdown (pauses during playback)
  useEffect(() => {
    if (countdown > 0 && !showCustom && !isConfirming && playingIndex === null) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !showCustom && !isConfirming && playingIndex === null) {
      handleConfirm();
    }
  }, [countdown, showCustom, isConfirming, playingIndex]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCustom) {
        if (e.key === "Escape") {
          setShowCustom(false);
          setCountdown(autoSelectTimeout);
        }
        return;
      }

      switch (e.key) {
        case "1":
        case "2":
        case "3":
          const index = parseInt(e.key) - 1;
          if (index < alternatives.length) {
            setSelected(index);
            setCountdown(autoSelectTimeout);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelected(prev => Math.max(0, prev - 1));
          setCountdown(autoSelectTimeout);
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelected(prev => Math.min(alternatives.length - 1, prev + 1));
          setCountdown(autoSelectTimeout);
          break;
        case "Enter":
          handleConfirm();
          break;
        case "Escape":
          onCancel();
          break;
        case " ":
          e.preventDefault();
          setShowCustom(true);
          break;
        case "p":
        case "P":
          // Play selected option
          if (alternatives[selected]) {
            playVoice(alternatives[selected].text, selected);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [alternatives.length, showCustom, autoSelectTimeout, selected]);

  const playVoice = useCallback(async (text: string, index: number) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking the same one that's playing, just stop
    if (playingIndex === index) {
      setPlayingIndex(null);
      return;
    }

    setPlayingIndex(index);
    setCountdown(autoSelectTimeout); // Reset countdown while playing

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text,
            voiceId: clonedVoiceId, // Use cloned voice if available
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingIndex(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingIndex(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Could not play audio",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      console.error("Voice playback error:", error);
      setPlayingIndex(null);
      toast({
        title: "Voice Playback Failed",
        description: "Could not generate voice preview",
        variant: "destructive",
      });
    }
  }, [playingIndex, clonedVoiceId, autoSelectTimeout, toast]);

  const handleConfirm = useCallback(async () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingIndex(null);
    setIsConfirming(true);

    // Brief visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    if (showCustom && customInput.trim()) {
      onConfirm(customInput.trim());
    } else if (alternatives[selected]) {
      onConfirm(alternatives[selected].text);
    }
  }, [showCustom, customInput, alternatives, selected, onConfirm]);

  const handleOptionClick = (index: number) => {
    setSelected(index);
    setShowCustom(false);
    setCountdown(autoSelectTimeout);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return "bg-green-500/20 text-green-400";
    if (confidence >= 50) return "bg-yellow-500/20 text-yellow-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disambiguation-title"
    >
      <div className="bg-white rounded-[2rem] p-6 max-w-lg w-full border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <BookOpen className="w-24 h-24 text-black" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-2 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-primary/20 p-2 rounded-xl border border-black/10">
                <BookOpen className="w-5 h-5 text-primary-foreground" fill="currentColor" />
              </div>
              <h2 id="disambiguation-title" className="text-2xl font-black text-black tracking-tight">
                Did you mean?
              </h2>
            </div>
            {clonedVoiceId && (
              <p className="text-xs font-semibold text-gray-500 ml-1">Using your personal voice</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full w-8 h-8 -mr-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Original message context */}
        <div className="mb-4 pl-1">
          <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-0.5">You said</p>
          <p className="text-lg font-medium text-gray-900 border-l-4 border-gray-200 pl-3 py-1 italic">
            "{originalMessage}"
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-2 mb-6" role="radiogroup" aria-label="Interpretation options">
          {alternatives.map((alt, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(index)}
              className={`group flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200
                ${selected === index && !showCustom
                  ? "border-black bg-primary/5 translate-x-1"
                  : "border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200"
                }`}
            >
              {/* Selection Circle */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                ${selected === index && !showCustom
                  ? "border-black bg-black"
                  : "border-gray-300 group-hover:border-gray-400"
                }`}
              >
                {selected === index && !showCustom && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>

              {/* Text */}
              <span className={`text-base font-semibold flex-1 ${selected === index ? "text-black" : "text-gray-600"}`}>
                {alt.text}
              </span>

              {/* Confidence Badge */}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${alt.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}>
                {alt.confidence}%
              </span>

              {/* Play Button - Only shows on hover or valid selection */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  playVoice(alt.text, index);
                }}
                className={`w-8 h-8 rounded-full ml-1 ${playingIndex === index ? "text-primary bg-primary/10" : "text-gray-400 hover:text-black hover:bg-gray-200"
                  }`}
              >
                {playingIndex === index ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          ))}

          {/* Custom Input Option */}
          <div
            onClick={() => {
              setShowCustom(true);
              setCountdown(autoSelectTimeout);
            }}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200
              ${showCustom
                ? "border-black bg-white shadow-sm"
                : "border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${showCustom ? "border-black bg-black" : "border-gray-300"}`}
            >
              {showCustom && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>

            <div className="flex-1">
              {showCustom ? (
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInput.trim()) handleConfirm();
                  }}
                  placeholder="Type correction..."
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-medium placeholder:text-gray-400 text-black"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-base font-medium text-gray-500">Something else...</span>
              )}
            </div>
            {showCustom && <Edit3 className="w-4 h-4 text-black" />}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          {/* Timer / Status */}
          <div className="text-xs font-semibold text-gray-400 pl-1">
            {!showCustom && countdown > 0 && !isConfirming && playingIndex === null && (
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Auto-confirming in {countdown}s
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={(showCustom && !customInput.trim()) || isConfirming}
              className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-2 h-auto font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              {isConfirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
