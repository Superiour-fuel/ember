/**
 * QuickPhrases Component
 * 
 * One-tap TTS for common phrases - critical AAC feature for users with speech disabilities.
 * Categorized phrases with TTS playback via ElevenLabs.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import {
    AlertTriangle,
    Heart,
    Coffee,
    MessageCircle,
    Volume2,
    Loader2,
    Plus,
    X,
    Sparkles
} from "lucide-react";
import geminiIcon from "@/assets/gemini-icon.png";

// Phrase categories with emojis and icons
interface PhraseCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    phrases: string[];
}

const DEFAULT_CATEGORIES: PhraseCategory[] = [
    {
        id: "urgent",
        name: "Urgent",
        icon: <AlertTriangle className="w-4 h-4" />,
        color: "bg-red-100 border-red-300 hover:bg-red-200",
        phrases: ["I need help", "Call my family", "I'm in pain", "Emergency"]
    },
    {
        id: "needs",
        name: "Needs",
        icon: <Coffee className="w-4 h-4" />,
        color: "bg-amber-100 border-amber-300 hover:bg-amber-200",
        phrases: ["I'm hungry", "I'm thirsty", "I need to rest", "Bathroom please"]
    },
    {
        id: "emotional",
        name: "Feelings",
        icon: <Heart className="w-4 h-4" />,
        color: "bg-pink-100 border-pink-300 hover:bg-pink-200",
        phrases: ["I love you", "Thank you", "I'm happy", "I'm sad", "I'm tired"]
    },
    {
        id: "communication",
        name: "Responses",
        icon: <MessageCircle className="w-4 h-4" />,
        color: "bg-blue-100 border-blue-300 hover:bg-blue-200",
        phrases: ["Yes", "No", "Wait please", "Say that again", "I don't understand"]
    }
];

interface QuickPhrasesProps {
    className?: string;
    voiceId?: string; // Optional cloned voice ID
    onPhraseSpoken?: (phrase: string) => void;
}

export function QuickPhrases({ className = "", voiceId, onPhraseSpoken }: QuickPhrasesProps) {
    const { voiceSpeed, audioQuality } = useAccessibility();
    const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);
    const [customPhrases, setCustomPhrases] = useState<string[]>(() => {
        const saved = localStorage.getItem("ember_custom_phrases");
        return saved ? JSON.parse(saved) : [];
    });
    const [newPhrase, setNewPhrase] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);


    // Play phrase via TTS
    const speakPhrase = useCallback(async (phrase: string) => {
        if (playingPhrase) return; // Prevent double-tap

        setPlayingPhrase(phrase);

        try {
            // Use browser's built-in speech synthesis
            const utterance = new SpeechSynthesisUtterance(phrase);

            // Configure voice settings (same as TextToSpeechInput)
            utterance.rate = voiceSpeed;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Get available voices
            const voices = window.speechSynthesis.getVoices();

            // Select voice based on audio quality preference
            let preferredVoice;

            if (audioQuality === "high") {
                preferredVoice = voices.find(voice =>
                    (voice.name.includes('Google') || voice.name.includes('Microsoft')) &&
                    voice.lang.startsWith('en-')
                );
            } else {
                preferredVoice = voices.find(voice =>
                    voice.default && voice.lang.startsWith('en-')
                );
            }

            if (!preferredVoice) {
                preferredVoice = voices.find(voice => voice.lang.startsWith('en-'));
            }

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.onend = () => {
                setPlayingPhrase(null);
                onPhraseSpoken?.(phrase);
            };

            utterance.onerror = (error) => {
                console.error("TTS error:", error);
                setPlayingPhrase(null);
                toast.error("Could not play audio");
            };

            window.speechSynthesis.speak(utterance);

        } catch (error) {
            console.error("TTS error:", error);
            setPlayingPhrase(null);
            toast.error("Could not generate speech");
        }
    }, [playingPhrase, onPhraseSpoken]);

    // Add custom phrase
    const addCustomPhrase = () => {
        if (!newPhrase.trim()) return;

        const updated = [...customPhrases, newPhrase.trim()];
        setCustomPhrases(updated);
        localStorage.setItem("ember_custom_phrases", JSON.stringify(updated));
        setNewPhrase("");
        setShowAddForm(false);

        toast.success(`"${newPhrase.trim()}" saved to your custom phrases.`);
    };

    // Remove custom phrase
    const removeCustomPhrase = (phrase: string) => {
        const updated = customPhrases.filter(p => p !== phrase);
        setCustomPhrases(updated);
        localStorage.setItem("ember_custom_phrases", JSON.stringify(updated));
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={geminiIcon} alt="Gemini" className="w-5 h-5 object-contain" />
                    <h3 className="text-lg font-black text-black">Quick Phrases</h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="h-8 border-2 border-black text-black font-bold hover:bg-black hover:text-white rounded-lg text-xs"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                </Button>
            </div>

            {/* Add custom phrase form */}
            {showAddForm && (
                <div className="flex gap-2 p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <input
                        type="text"
                        value={newPhrase}
                        onChange={(e) => setNewPhrase(e.target.value)}
                        placeholder="Type your phrase..."
                        className="flex-1 px-3 py-2 text-sm border-2 border-black/20 rounded-lg focus:border-black focus:outline-none"
                        onKeyDown={(e) => e.key === "Enter" && addCustomPhrase()}
                    />
                    <Button
                        size="sm"
                        onClick={addCustomPhrase}
                        disabled={!newPhrase.trim()}
                        className="h-9 bg-black text-white hover:bg-black/80"
                    >
                        Save
                    </Button>
                </div>
            )}

            {/* Categories */}
            {DEFAULT_CATEGORIES.map((category) => (
                <div key={category.id} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-black/50">
                        {category.icon}
                        <span>{category.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {category.phrases.map((phrase) => (
                            <button
                                key={phrase}
                                onClick={() => speakPhrase(phrase)}
                                disabled={!!playingPhrase}
                                className={`
                  px-3 py-2 text-sm font-semibold rounded-xl border-2 border-black
                  shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
                  ${category.color}
                  ${playingPhrase === phrase ? "scale-95 shadow-none translate-x-[2px] translate-y-[2px]" : ""}
                  ${playingPhrase && playingPhrase !== phrase ? "opacity-50" : ""}
                  active:scale-95 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                `}
                            >
                                {playingPhrase === phrase ? (
                                    <span className="flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Speaking...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <Volume2 className="w-3 h-3" />
                                        {phrase}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Custom Phrases */}
            {customPhrases.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-black/50">
                        <Sparkles className="w-4 h-4" />
                        <span>My Phrases</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {customPhrases.map((phrase) => (
                            <div key={phrase} className="relative group">
                                <button
                                    onClick={() => speakPhrase(phrase)}
                                    disabled={!!playingPhrase}
                                    className={`
                    px-3 py-2 text-sm font-semibold rounded-xl border-2 border-black
                    bg-[#4ade80]/20 hover:bg-[#4ade80]/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    transition-all
                    ${playingPhrase === phrase ? "scale-95 shadow-none" : ""}
                  `}
                                >
                                    {playingPhrase === phrase ? (
                                        <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                                    ) : (
                                        <Volume2 className="w-3 h-3 inline mr-1" />
                                    )}
                                    {phrase}
                                </button>
                                <button
                                    onClick={() => removeCustomPhrase(phrase)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state hint */}
            {customPhrases.length === 0 && !showAddForm && (
                <p className="text-xs text-black/40 italic">
                    Tap "Add" to create your own custom phrases.
                </p>
            )}
        </div>
    );
}
