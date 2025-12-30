import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TestTube, Volume2, Sparkles, AlertTriangle, Brain } from 'lucide-react';

export interface DemoPhrase {
    input: string;
    interpretation: string;
    confidence: number;
    category: 'dysarthria' | 'aphasia' | 'urgent';
}

const DEMO_PHRASES: DemoPhrase[] = [
    {
        input: "wan coff hot",
        interpretation: "I want hot coffee",
        confidence: 87,
        category: 'dysarthria'
    },
    {
        input: "nee hel",
        interpretation: "I need help",
        confidence: 92,
        category: 'aphasia'
    },
    {
        input: "too da",
        interpretation: "It's too dark",
        confidence: 85,
        category: 'dysarthria'
    },
    {
        input: "hel pai bad",
        interpretation: "Help, I'm in pain, it's bad",
        confidence: 95,
        category: 'urgent'
    },
    {
        input: "bathroom help",
        interpretation: "I need help getting to the bathroom",
        confidence: 90,
        category: 'aphasia'
    },
    {
        input: "lights on",
        interpretation: "Turn on the lights",
        confidence: 88,
        category: 'dysarthria'
    }
];

const CATEGORY_CONFIG = {
    dysarthria: {
        icon: Volume2,
        color: 'bg-blue-500',
        label: 'Speech'
    },
    aphasia: {
        icon: Brain,
        color: 'bg-purple-500',
        label: 'Language'
    },
    urgent: {
        icon: AlertTriangle,
        color: 'bg-red-500',
        label: 'Urgent'
    }
};

interface DemoModeProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
    onPhraseClick: (phrase: DemoPhrase) => void;
}

export function DemoMode({ isEnabled, onToggle, onPhraseClick }: DemoModeProps) {
    return (
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            {/* Header */}
            <div className="bg-[#4ade80] px-4 py-3 border-b-2 border-black">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                            <TestTube className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-black uppercase tracking-tight">Demo Mode</h3>
                            <p className="text-xs font-medium text-black/60">
                                Test without speaking
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={onToggle}
                        className="data-[state=checked]:bg-black"
                    />
                </div>
            </div>

            {/* Content */}
            {isEnabled && (
                <div className="p-4 space-y-2">
                    <p className="text-xs font-bold text-black/50 uppercase tracking-wide mb-3">
                        Tap to simulate speech
                    </p>
                    {DEMO_PHRASES.map((phrase, idx) => {
                        const config = CATEGORY_CONFIG[phrase.category];
                        const Icon = config.icon;

                        return (
                            <button
                                key={idx}
                                className="w-full text-left p-3 bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
                                onClick={() => onPhraseClick(phrase)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center flex-shrink-0 border border-black/20`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-black text-black text-sm">"{phrase.input}"</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.color} text-white uppercase`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <Sparkles className="w-3 h-3 text-[#4ade80]" />
                                            <span className="text-black/60 font-medium truncate">{phrase.interpretation}</span>
                                            <span className="text-black/40 font-bold ml-auto">{phrase.confidence}%</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Collapsed state hint */}
            {!isEnabled && (
                <div className="px-4 py-3 bg-black/5">
                    <p className="text-xs font-medium text-black/40 text-center">
                        Enable to try example phrases
                    </p>
                </div>
            )}
        </div>
    );
}
