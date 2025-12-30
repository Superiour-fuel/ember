// src/components/InterpretationDisplay.tsx

import { useState } from 'react';
import { Check, X, Loader2, Ear, Brain, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect } from 'react';

interface InterpretationDisplayProps {
    originalText: string;
    interpretation: string;
    confidence: number;
    alternatives?: string[];
    onConfirm: (selectedText: string) => void;
    onReject: () => void;
}

export function InterpretationDisplay({
    originalText,
    interpretation,
    confidence,
    alternatives = [],
    onConfirm,
    onReject
}: InterpretationDisplayProps) {
    const [selected, setSelected] = useState<string>(interpretation);

    return (
        <Card className="p-4 border-2 border-primary/20 bg-primary/5">
            <div className="space-y-3">
                {/* Original unclear speech */}
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium">You said:</span> "{originalText}"
                </div>

                {/* Gemini's interpretation */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Did you mean:</span>
                        <span className="text-xs text-muted-foreground">
                            {confidence}% confident
                        </span>
                    </div>

                    <div
                        className={`p-3 rounded-lg cursor-pointer transition-all ${selected === interpretation
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                            }`}
                        onClick={() => setSelected(interpretation)}
                    >
                        "{interpretation}"
                    </div>

                    {/* Alternative interpretations (if confidence < 80%) */}
                    {confidence < 80 && alternatives.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-xs text-muted-foreground">
                                Or did you mean:
                            </span>
                            {alternatives.map((alt, idx) => (
                                <div
                                    key={idx}
                                    className={`p-2 rounded-lg cursor-pointer text-sm transition-all ${selected === alt
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary/50 hover:bg-secondary/80'
                                        }`}
                                    onClick={() => setSelected(alt)}
                                >
                                    "{alt}"
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm/Reject buttons */}
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={() => onConfirm(selected)}
                        className="flex-1"
                        size="sm"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Yes, that's right
                    </Button>
                    <Button
                        onClick={onReject}
                        variant="outline"
                        size="sm"
                    >
                        <X className="w-4 h-4 mr-2" />
                        No, try again
                    </Button>
                </div>
            </div>
        </Card>
    );
}

const LOADING_MESSAGES = [
    { text: "Listening carefully...", icon: Ear },
    { text: "Understanding your speech...", icon: Brain },
    { text: "Interpreting what you mean...", icon: MessageCircle },
    { text: "Almost there...", icon: Loader2 }
];

export function InterpretationLoading() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = LOADING_MESSAGES[messageIndex].icon;

    return (
        <Card className="p-4 border-2 border-primary/20 bg-primary/5 interpretation-display">
            <div className="flex items-center gap-3">
                <CurrentIcon className="w-5 h-5 animate-spin text-primary" />
                <div className="space-y-1">
                    <p className="text-sm font-medium interpretation-text">
                        {LOADING_MESSAGES[messageIndex].text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Gemini is interpreting your speech
                    </p>
                </div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1 mt-3">
                {LOADING_MESSAGES.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1 flex-1 rounded-full transition-colors ${idx <= messageIndex ? 'bg-primary' : 'bg-primary/20'
                            }`}
                    />
                ))}
            </div>
        </Card>
    );
}
