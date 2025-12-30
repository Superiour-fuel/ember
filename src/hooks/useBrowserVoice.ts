// ═══════════════════════════════════════════════════════════════════════════
// TEMPORARY: Browser-based voice for stable demo
// Uses Web Speech API (SpeechRecognition + SpeechSynthesis)
// DELETE THIS FILE before final GitHub submission
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseBrowserVoiceReturn {
  isListening: boolean;
  transcript: string;
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSupported: boolean;
}

export function useBrowserVoice(): UseBrowserVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const onResultCallbackRef = useRef<((text: string) => void) | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const hasSynthesis = 'speechSynthesis' in window;

    if (!SpeechRecognition || !hasSynthesis) {
      setIsSupported(false);
      console.warn('Speech APIs not fully supported in this browser');
    }
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one phrase
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    return recognition;
  }, []);

  // Start listening
  const startListening = useCallback((onResult: (text: string) => void) => {
    // Store callback in ref
    onResultCallbackRef.current = onResult;

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Please use Google Chrome.');
      return;
    }

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      console.log('🎤 Browser listening started...');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      console.log('🗣️ User said:', result);
      setTranscript(result);

      // Call the callback with the result
      if (onResultCallbackRef.current) {
        onResultCallbackRef.current(result);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      }
    };

    recognition.onend = () => {
      console.log('🎤 Browser listening stopped');
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
    }
  }, [initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
    setIsListening(false);
  }, []);

  // Speak text using browser TTS with natural female voice
  const speak = useCallback((text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Natural speaking pace
    utterance.pitch = 1.1; // Slightly higher for female voice
    utterance.volume = 1.0;

    // Get available voices
    const voices = window.speechSynthesis.getVoices();

    // Priority order for natural female voices
    const femaleVoicePreferences = [
      // Google voices (most natural)
      'Google UK English Female',
      'Google US English Female',
      'Google US English',
      // Microsoft voices (Windows)
      'Microsoft Zira',
      'Microsoft Aria',
      'Microsoft Jenny',
      'Zira',
      'Aria',
      // Apple voices (Mac/iOS)
      'Samantha',
      'Karen',
      'Moira',
      'Tessa',
      // Generic female indicators
      'Female',
      'Woman',
    ];

    // Find the best matching female voice
    let selectedVoice = null;

    for (const pref of femaleVoicePreferences) {
      selectedVoice = voices.find(voice =>
        voice.name.includes(pref) && voice.lang.startsWith('en')
      );
      if (selectedVoice) break;
    }

    // Fallback: any English female-sounding voice (often have higher default pitch)
    if (!selectedVoice) {
      selectedVoice = voices.find(voice =>
        voice.lang.startsWith('en') &&
        (voice.name.toLowerCase().includes('female') ||
         voice.name.includes('Zira') ||
         voice.name.includes('Samantha') ||
         voice.name.includes('Karen'))
      );
    }

    // Last fallback: any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🔊 Using voice:', selectedVoice.name);
    }

    console.log('🔊 Speaking:', text);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported,
  };
}
