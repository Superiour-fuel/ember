// src/services/geminiService.ts

import { supabase } from '@/integrations/supabase/client';

export interface GeminiInterpretation {
    interpretation: string;
    confidence: number;
    alternatives?: string[];
    category?: 'dysarthria' | 'aphasia' | 'stutter' | 'urgent';
    action?: {
        type: 'lights_on' | 'lights_off' | 'temp_up' | 'temp_down' | 'emergency_call';
        params?: any;
    };
    response?: string;
}

/**
 * Call Gemini to interpret unclear speech
 */
export async function interpretUnclearSpeech(
    message: string,
    userProfile?: any,
    conversationHistory?: any[]
): Promise<GeminiInterpretation | null> {
    try {
        console.log('🧠 Calling Gemini to interpret:', message);

        const { data, error } = await supabase.functions.invoke('gemini-disambiguate', {
            body: {
                transcript: message,  // Edge function expects 'transcript'
                userProfile: userProfile || {
                    name: 'User',
                    conditions: ['dysarthria', 'aphasia'],
                    preferences: {}
                },
                conversationHistory: conversationHistory || []
            }
        });

        if (error) {
            console.error('❌ Gemini interpretation error:', error);
            return null;
        }

        console.log('✅ Gemini interpretation:', data);

        return {
            interpretation: data.interpretation || message,
            confidence: data.confidence || 0,
            alternatives: data.alternatives || [],
            category: data.category,
            action: data.action,
            response: data.response
        };
    } catch (err) {
        console.error('❌ Error calling Gemini:', err);
        return null;
    }
}

/**
 * Quick interpretation check (used for live feedback)
 */
export async function quickInterpret(message: string): Promise<string> {
    const result = await interpretUnclearSpeech(message);
    return result?.interpretation || message;
}
