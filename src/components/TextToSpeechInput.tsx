import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Volume2, Loader2, Sparkles, Zap, Mic } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export interface TextToSpeechInputHandle {
    speak: (text?: string) => void;
    setText: (text: string) => void;
}

type Emotion = 'neutral' | 'happy' | 'urgent' | 'calm';
type Tone = 'polite' | 'professional' | 'witty' | 'concise';

// Mapped to Browser TTS parameters (rate: 0.1-2.0, pitch: 0-2.0)
const EMOTION_PRESETS: Record<Emotion, { rate: number; pitch: number; label: string; icon: any }> = {
    neutral: { rate: 1.0, pitch: 1.0, label: "Natural", icon: Mic },
    happy: { rate: 1.1, pitch: 1.2, label: "Expressive", icon: Sparkles },
    urgent: { rate: 1.25, pitch: 1.1, label: "Clear/Urgent", icon: Zap },
    calm: { rate: 0.9, pitch: 0.9, label: "Calm", icon: Volume2 }
};

const TONE_PRESETS: Record<Tone, { label: string; icon: string }> = {
    polite: { label: "Polite", icon: "✨" },
    professional: { label: "Pro", icon: "👔" },
    witty: { label: "Witty", icon: "🎭" },
    concise: { label: "Short", icon: "⚡" }
};

export const TextToSpeechInput = forwardRef<TextToSpeechInputHandle, { onSpeak?: (text: string) => void }>(({ onSpeak }, ref) => {
    const { voiceSpeed, audioQuality } = useAccessibility(); // Keep accessibility base settings
    const [text, setText] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRephrasing, setIsRephrasing] = useState<Tone | null>(null);
    const [activeEmotion, setActiveEmotion] = useState<Emotion>('neutral');

    // We don't need audioRef for browser TTS, but we need to track the utterance to cancel if needed
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        speak: (textOverride?: string) => {
            const textToSpeak = textOverride || text;
            if (textOverride) setText(textOverride);
            speakText(textToSpeak);
        },
        setText: (newText: string) => setText(newText)
    }));

    const speakText = async (textToSpeak: string = text) => {
        if (!textToSpeak.trim()) {
            toast.error('Please enter some text');
            return;
        }

        // Cancel current speech
        window.speechSynthesis.cancel();
        setIsPlaying(true);

        try {
            console.log(`Speaking with Browser TTS. Emotion: ${activeEmotion}`);

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            const settings = EMOTION_PRESETS[activeEmotion];

            // Combine accessibility settings with emotion modifiers
            // Base speed * emotion modifier
            utterance.rate = Math.min(Math.max(voiceSpeed * settings.rate, 0.1), 10);
            utterance.pitch = Math.min(Math.max(settings.pitch, 0), 2);
            utterance.volume = 1.0;

            // Voice selection logic
            const voices = window.speechSynthesis.getVoices();
            let preferredVoice;

            if (audioQuality === "high") {
                preferredVoice = voices.find(voice =>
                    (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Samantha')) &&
                    voice.lang.startsWith('en-')
                );
            }

            if (!preferredVoice) {
                preferredVoice = voices.find(voice => voice.lang.startsWith('en-'));
            }

            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onend = () => {
                setIsPlaying(false);
                onSpeak?.(textToSpeak);
            };

            utterance.onerror = (e) => {
                console.error("Browser TTS Error", e);
                setIsPlaying(false);
                toast.error("Speech error");
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('Error in TTS:', error);
            toast.error('Failed to speak text');
            setIsPlaying(false);
        }
    };

    const handleRephrase = async (tone: Tone) => {
        if (!text.trim()) {
            toast.error('Please enter some text to rephrase');
            return;
        }

        setIsRephrasing(tone);

        try {
            const { data, error } = await supabase.functions.invoke('gemini-rephrase', {
                body: { text, tone }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            if (data?.rephrased) {
                setText(data.rephrased);

                // Auto-select emotion based on tone
                if (tone === 'witty') setActiveEmotion('happy');
                if (tone === 'polite') setActiveEmotion('calm');
                if (tone === 'concise') setActiveEmotion('urgent');
            }

        } catch (error: any) {
            console.error('Rephrase error:', error);
            // Show the actual error message to help debugging
            toast.error(`🚨 Debug: ${error.message || 'Unknown error'}`);
        } finally {
            setIsRephrasing(null);
        }
    };

    return (
        <div className="space-y-4">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type what you want to say..."
                className="min-h-[100px] bg-white border-2 border-black rounded-xl p-4 text-lg font-medium resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
            />

            {/* Smart Rephrasing Bar */}
            <div className="flex gap-2">
                {(Object.keys(TONE_PRESETS) as Tone[]).map((tone) => {
                    const preset = TONE_PRESETS[tone];
                    const isLoading = isRephrasing === tone;

                    return (
                        <button
                            key={tone}
                            onClick={() => handleRephrase(tone)}
                            disabled={!!isRephrasing || !text.trim()}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-black/10 hover:border-black/30 bg-gray-50 hover:bg-white text-xs font-bold transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>{preset.icon}</span>}
                            {preset.label}
                        </button>
                    );
                })}
            </div>

            {/* Emotion Selector */}
            <div
                ref={scrollContainerRef}
                onWheel={(e) => {
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollLeft += e.deltaY;
                    }
                }}
                className="flex gap-2 overflow-x-auto no-scrollbar"
            >
                {(Object.keys(EMOTION_PRESETS) as Emotion[]).map((emotion) => {
                    const preset = EMOTION_PRESETS[emotion];
                    const Icon = preset.icon;
                    const isActive = activeEmotion === emotion;

                    return (
                        <button
                            key={emotion}
                            onClick={() => setActiveEmotion(emotion)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all whitespace-nowrap
                                ${isActive
                                    ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-black/30'}`}
                        >
                            <Icon className={`w-3 h-3 ${isActive ? 'text-[#4ade80]' : 'text-gray-400'}`} />
                            {preset.label}
                        </button>
                    );
                })}
            </div>

            <Button
                onClick={() => speakText()}
                disabled={isPlaying || !text.trim()}
                className="w-full h-14 bg-black hover:bg-black/90 text-white rounded-xl font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
            >
                {isPlaying ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#4ade80]" />
                        Generating...
                    </>
                ) : (
                    <>
                        {activeEmotion === 'neutral' && <Mic className="mr-2 h-5 w-5" />}
                        {activeEmotion === 'happy' && <Sparkles className="mr-2 h-5 w-5 text-[#4ade80]" />}
                        {activeEmotion === 'urgent' && <Zap className="mr-2 h-5 w-5 text-yellow-400" />}
                        {activeEmotion === 'calm' && <Volume2 className="mr-2 h-5 w-5 text-blue-300" />}
                        Speak ({EMOTION_PRESETS[activeEmotion].label})
                    </>
                )}
            </Button>
        </div>
    );
});

TextToSpeechInput.displayName = 'TextToSpeechInput';


