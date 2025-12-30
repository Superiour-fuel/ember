export class VoiceFeedback {
    private synth: SpeechSynthesis;
    private enabled: boolean = true;

    constructor() {
        this.synth = window.speechSynthesis;
    }

    speak(text: string, options: { rate?: number; pitch?: number } = {}) {
        if (!this.enabled) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 0.9; // Slightly slower for clarity
        utterance.pitch = options.pitch || 1.1; // Friendly tone
        utterance.volume = 0.8;

        this.synth.speak(utterance);
    }

    speakInterpretation(interpretation: string) {
        this.speak(`Did you mean: ${interpretation}?`);
    }

    speakConfirmation(text: string) {
        this.speak(`I understand: ${text}`, { rate: 1.0 });
    }

    speakEmergency(message: string) {
        this.speak(message, { rate: 0.85, pitch: 1.0 });
    }

    toggle(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            this.synth.cancel();
        }
    }

    cancel() {
        this.synth.cancel();
    }
}

// Export singleton instance
export const voiceFeedback = new VoiceFeedback();
