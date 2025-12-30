
// src/utils/speechDetection.ts

/**
 * Detects if transcribed speech is unclear and needs Gemini interpretation
 */
export function isUnclearSpeech(text: string): boolean {
    if (!text || text.trim().length === 0) return false;

    const cleanText = text.toLowerCase().trim();

    // Pattern 1: Very short fragments (1-2 letter words)
    const shortWords = cleanText.split(/\s+/).filter(word => word.length <= 2);
    const shortWordRatio = shortWords.length / cleanText.split(/\s+/).length;
    if (shortWordRatio > 0.3) return true; // More than 30% are fragments

    // Pattern 2: Excessive pauses indicated by multiple spaces or periods
    if (/\s{3,}|\.{2,}/.test(cleanText)) return true;

    // Pattern 3: Very short overall message (likely incomplete)
    if (cleanText.split(/\s+/).length <= 3 && cleanText.length < 15) {
        // But exclude common complete short phrases
        const completeShortPhrases = [
            'hello', 'hi', 'yes', 'no', 'okay', 'thanks', 'thank you',
            'help me', 'call help', 'lights on', 'lights off'
        ];
        if (!completeShortPhrases.some(phrase => cleanText.includes(phrase))) {
            return true;
        }
    }

    // Pattern 4: Dysarthria indicators (common slurred patterns)
    const dysarthriaPatterns = [
        /wan\s+coff/i,  // "wan coff" -> "want coffee"
        /nee\s+hel/i,   // "nee hel" -> "need help"
        /ca\s+yo/i,     // "ca yo" -> "call you"
        /too\s+da/i,    // "too da" -> "too dark"
        /tur\s+on/i,    // "tur on" -> "turn on"
        /\b[a-z]{1,2}\s+[a-z]{1,2}\s+[a-z]{1,2}\b/i // Three short words in a row
    ];
    if (dysarthriaPatterns.some(pattern => pattern.test(cleanText))) return true;

    // Pattern 5: Aphasia indicators (missing articles, prepositions)
    const words = cleanText.split(/\s+/);
    const hasArticles = /\b(the|a|an)\b/i.test(cleanText);
    const hasPrepositions = /\b(to|for|with|in|on|at)\b/i.test(cleanText);

    if (words.length >= 4 && !hasArticles && !hasPrepositions) {
        return true; // Likely aphasia (missing function words)
    }

    return false;
}

/**
 * Calculate confidence that speech needs interpretation
 * Returns 0-100 score
 */
export function getUnclearConfidence(text: string): number {
    if (!isUnclearSpeech(text)) return 0;

    const cleanText = text.toLowerCase().trim();
    let confidence = 0;

    // More indicators = higher confidence it's unclear
    if (/wan\s+coff|nee\s+hel|too\s+da/i.test(cleanText)) confidence += 40;
    if (cleanText.split(/\s+/).length <= 3) confidence += 20;
    if (/\s{3,}|\.{2,}/.test(cleanText)) confidence += 20;

    const shortWords = cleanText.split(/\s+/).filter(word => word.length <= 2);
    confidence += Math.min(20, shortWords.length * 10);

    return Math.min(100, confidence);
}

/**
 * Get category of speech disability indicated
 */
export function getSpeechCategory(text: string): 'dysarthria' | 'aphasia' | 'stutter' | 'clear' {
    const cleanText = text.toLowerCase().trim();

    // Dysarthria: slurred, shortened words
    if (/wan\s+coff|nee\s+hel|too\s+da|tur\s+on/i.test(cleanText)) {
        return 'dysarthria';
    }

    // Aphasia: missing function words, fragmented
    const words = cleanText.split(/\s+/);
    const hasArticles = /\b(the|a|an)\b/i.test(cleanText);
    if (words.length >= 4 && !hasArticles) {
        return 'aphasia';
    }

    // Stutter: repeated sounds or pauses
    if (/\s{3,}|\.{2,}/.test(cleanText)) {
        return 'stutter';
    }

    return 'clear';
}
