import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Profile {
  id: string;
  display_name: string | null;
  condition: string | null;
  created_at: string;
  updated_at: string;
}

interface VoiceBank {
  id: string;
  user_id: string;
  cloned_voice_id: string;
  clarity_score: number;
  recorded_at: string;
  created_at: string;
}

interface UserSettings {
  id: string;
  user_id: string;
  enable_disambiguation: boolean;
  enable_corrections: boolean;
  context_home: string[];
  context_needs: string[];
  context_preferences: string[];
  speech_speed: number;
  voice_pitch: number;
  emergency_contact_phone: string | null;
  emergency_contact_method: 'call' | 'whatsapp' | 'sms';
  created_at: string;
  updated_at: string;
}

interface Correction {
  id: string;
  user_id: string;
  original_text: string;
  corrected_text: string;
  created_at: string;
}

export function useUserData() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [voiceBank, setVoiceBank] = useState<VoiceBank | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all user data
  const fetchUserData = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setVoiceBank(null);
      setSettings(null);
      setCorrections([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Fetch voice bank
      const { data: voiceBankData } = await supabase
        .from('voice_banks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setVoiceBank(voiceBankData);

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsData) {
        setSettings({
          ...settingsData,
          context_home: Array.isArray(settingsData.context_home) ? settingsData.context_home : [],
          context_needs: Array.isArray(settingsData.context_needs) ? settingsData.context_needs : [],
          context_preferences: Array.isArray(settingsData.context_preferences) ? settingsData.context_preferences : [],
        } as UserSettings);
      }

      // Fetch corrections
      const { data: correctionsData } = await supabase
        .from('corrections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      setCorrections((correctionsData as Correction[]) || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Update profile
  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'condition'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  // Save voice bank
  const saveVoiceBank = async (clonedVoiceId: string, clarityScore: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Upsert - insert or update if exists
    const { data, error } = await supabase
      .from('voice_banks')
      .upsert({
        user_id: user.id,
        cloned_voice_id: clonedVoiceId,
        clarity_score: clarityScore,
        recorded_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (!error && data) {
      setVoiceBank(data);
      toast({
        title: "Voice saved",
        description: "Your cloned voice has been stored securely.",
      });
    }

    return { data, error };
  };

  // Update settings
  const updateSettings = async (updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setSettings(prev => prev ? { ...prev, ...updates } as UserSettings : null);
    }

    return { error };
  };

  // Add correction
  const addCorrection = async (originalText: string, correctedText: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('corrections')
      .insert({
        user_id: user.id,
        original_text: originalText,
        corrected_text: correctedText,
      })
      .select()
      .single();

    if (!error && data) {
      setCorrections(prev => [data as Correction, ...prev]);
    }

    return { data, error };
  };

  // Find similar correction
  const findSimilarCorrection = (text: string): string | null => {
    const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    for (const correction of corrections) {
      const normalizedOriginal = correction.original_text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

      // Check for exact match or high similarity
      if (normalizedOriginal === normalizedText) {
        return correction.corrected_text;
      }

      // Check word overlap
      const textWords = new Set(normalizedText.split(/\s+/));
      const correctionWords = normalizedOriginal.split(/\s+/);
      const matchingWords = correctionWords.filter(w => textWords.has(w));

      if (correctionWords.length > 0 && matchingWords.length / correctionWords.length >= 0.8) {
        return correction.corrected_text;
      }
    }

    return null;
  };

  // Delete voice bank
  const deleteVoiceBank = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('voice_banks')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setVoiceBank(null);
    }

    return { error };
  };

  return {
    profile,
    voiceBank,
    settings,
    corrections,
    isLoading,
    updateProfile,
    saveVoiceBank,
    updateSettings,
    addCorrection,
    findSimilarCorrection,
    deleteVoiceBank,
    refetch: fetchUserData,
  };
}
