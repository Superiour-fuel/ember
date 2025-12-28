/**
 * Voice Sample Encryption Service
 * 
 * Encrypts voice samples before storing in localStorage.
 * Uses AES-256 encryption via crypto-js.
 * 
 * SECURITY NOTE: The encryption key is derived from a combination of
 * user-specific data. For production, consider using a server-side
 * key management system.
 */

import CryptoJS from "crypto-js";

// Generate a device-specific key component
// This adds a layer of device binding to the encryption
const getDeviceFingerprint = (): string => {
    const nav = window.navigator;
    const components = [
        nav.userAgent,
        nav.language,
        screen.width,
        screen.height,
        new Date().getTimezoneOffset(),
        nav.hardwareConcurrency || 4,
    ];
    return components.join("|");
};

// Derive encryption key from user ID and device fingerprint
// For production, this should be enhanced with server-side key management
const deriveEncryptionKey = (userId?: string): string => {
    const baseKey = "ember_voice_protection_v1";
    const deviceComponent = getDeviceFingerprint();
    const userComponent = userId || "anonymous";

    // Create a hash-based key derivation
    const combined = `${baseKey}:${userComponent}:${deviceComponent}`;
    return CryptoJS.SHA256(combined).toString();
};

/**
 * Encrypt a voice sample (base64 audio data)
 */
export function encryptVoiceSample(
    audioData: string,
    userId?: string
): string {
    try {
        const key = deriveEncryptionKey(userId);
        const encrypted = CryptoJS.AES.encrypt(audioData, key).toString();

        // Add a marker to identify encrypted data
        return `ENCRYPTED:${encrypted}`;
    } catch (error) {
        console.error("Voice sample encryption failed:", error);
        // Return original data if encryption fails (graceful degradation)
        return audioData;
    }
}

/**
 * Decrypt a voice sample
 */
export function decryptVoiceSample(
    encryptedData: string,
    userId?: string
): string {
    try {
        // Check if data is encrypted
        if (!encryptedData.startsWith("ENCRYPTED:")) {
            // Data is not encrypted (legacy), return as-is
            return encryptedData;
        }

        const key = deriveEncryptionKey(userId);
        const encrypted = encryptedData.replace("ENCRYPTED:", "");
        const decrypted = CryptoJS.AES.decrypt(encrypted, key);
        const originalData = decrypted.toString(CryptoJS.enc.Utf8);

        if (!originalData) {
            throw new Error("Decryption produced empty result");
        }

        return originalData;
    } catch (error) {
        console.error("Voice sample decryption failed:", error);
        // Return original data if decryption fails
        // This handles migration from unencrypted to encrypted storage
        return encryptedData.replace("ENCRYPTED:", "");
    }
}

/**
 * Check if data is encrypted
 */
export function isEncrypted(data: string): boolean {
    return data.startsWith("ENCRYPTED:");
}

/**
 * Encrypted localStorage wrapper for voice data
 */
export const secureVoiceStorage = {
    /**
     * Store voice bank with encryption
     */
    setVoiceBank: (data: {
        audioBlob: string;
        recordedAt: string;
        clarity_score: number;
        cloned_voice_id?: string | null;
        history?: Array<{
            audioBlob: string;
            recordedAt: string;
            clarity_score: number;
            version: number;
        }>;
    }, userId?: string): void => {
        try {
            // Encrypt the audio blob
            const encryptedData = {
                ...data,
                audioBlob: encryptVoiceSample(data.audioBlob, userId),
                // Also encrypt history audio blobs if present
                history: data.history?.map(h => ({
                    ...h,
                    audioBlob: encryptVoiceSample(h.audioBlob, userId),
                })),
            };

            localStorage.setItem("ember_voice_bank", JSON.stringify(encryptedData));
        } catch (error) {
            console.error("Failed to store encrypted voice bank:", error);
            // Fallback to unencrypted storage
            localStorage.setItem("ember_voice_bank", JSON.stringify(data));
        }
    },

    /**
     * Retrieve and decrypt voice bank
     */
    getVoiceBank: (userId?: string): {
        audioBlob: string;
        recordedAt: string;
        clarity_score: number;
        cloned_voice_id?: string | null;
        history?: Array<{
            audioBlob: string;
            recordedAt: string;
            clarity_score: number;
            version: number;
        }>;
    } | null => {
        try {
            const stored = localStorage.getItem("ember_voice_bank");
            if (!stored) return null;

            const data = JSON.parse(stored);

            // Decrypt the audio blob
            return {
                ...data,
                audioBlob: decryptVoiceSample(data.audioBlob, userId),
                // Also decrypt history audio blobs if present
                history: data.history?.map((h: { audioBlob: string; recordedAt: string; clarity_score: number; version: number }) => ({
                    ...h,
                    audioBlob: decryptVoiceSample(h.audioBlob, userId),
                })),
            };
        } catch (error) {
            console.error("Failed to retrieve encrypted voice bank:", error);
            return null;
        }
    },

    /**
     * Store calibration examples with encryption
     */
    setCalibrationExamples: (data: Array<{
        phrase: string;
        audioBlob?: string;
        timestamp?: string;
    }>, userId?: string): void => {
        try {
            const encryptedData = data.map(item => ({
                ...item,
                audioBlob: item.audioBlob ? encryptVoiceSample(item.audioBlob, userId) : undefined,
            }));

            localStorage.setItem("ember_calibration_examples", JSON.stringify(encryptedData));
        } catch (error) {
            console.error("Failed to store encrypted calibration:", error);
            localStorage.setItem("ember_calibration_examples", JSON.stringify(data));
        }
    },

    /**
     * Retrieve and decrypt calibration examples
     */
    getCalibrationExamples: (userId?: string): Array<{
        phrase: string;
        audioBlob?: string;
        timestamp?: string;
    }> => {
        try {
            const stored = localStorage.getItem("ember_calibration_examples");
            if (!stored) return [];

            const data = JSON.parse(stored);

            return data.map((item: { phrase: string; audioBlob?: string; timestamp?: string }) => ({
                ...item,
                audioBlob: item.audioBlob ? decryptVoiceSample(item.audioBlob, userId) : undefined,
            }));
        } catch (error) {
            console.error("Failed to retrieve encrypted calibration:", error);
            return [];
        }
    },

    /**
     * Clear all voice data
     */
    clearAll: (): void => {
        localStorage.removeItem("ember_voice_bank");
        localStorage.removeItem("ember_calibration_examples");
    },
};
