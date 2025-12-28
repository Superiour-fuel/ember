// Correction Storage Utility
// Stores user corrections to improve future predictions

const STORAGE_KEY = 'ember_aphasia_corrections';
const MAX_CORRECTIONS = 50;

export interface CorrectionEntry {
  original: string;
  corrected: string;
  timestamp: string;
  pattern: CorrectionPattern;
}

export interface CorrectionPattern {
  missingWords: string[];
  addedWords: string[];
  substitutions: Array<{ from: string; to: string }>;
}

/**
 * Stores a correction for future learning
 */
export const storeCorrection = (original: string, corrected: string): void => {
  const corrections = getCorrections();
  
  corrections.push({
    original,
    corrected,
    timestamp: new Date().toISOString(),
    pattern: detectPattern(original, corrected)
  });

  // Keep only the last N corrections
  while (corrections.length > MAX_CORRECTIONS) {
    corrections.shift();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
};

/**
 * Gets all stored corrections
 */
export const getCorrections = (): CorrectionEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Finds a similar past correction
 */
export const findSimilarCorrection = (message: string): string | null => {
  const corrections = getCorrections();
  
  const similar = corrections.find(c => 
    calculateSimilarity(c.original, message) > 0.7
  );
  
  return similar?.corrected || null;
};

/**
 * Gets learned patterns for a user
 */
export const getLearnedPatterns = (): CorrectionPattern[] => {
  const corrections = getCorrections();
  return corrections.map(c => c.pattern);
};

/**
 * Detects the pattern of correction made
 */
const detectPattern = (original: string, corrected: string): CorrectionPattern => {
  const originalWords = original.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const correctedWords = corrected.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  // Find missing words (in corrected but not in original)
  const missingWords = correctedWords.filter(w => 
    !originalWords.includes(w) && !['i', 'the', 'a', 'an', 'to', 'is', 'was', 'are', 'were'].includes(w)
  );
  
  // Find added words (in original but not in corrected - these might be errors)
  const addedWords = originalWords.filter(w => 
    !correctedWords.includes(w) && w.length > 2
  );
  
  // Find substitutions (words that might be similar but different)
  const substitutions: Array<{ from: string; to: string }> = [];
  
  for (const origWord of originalWords) {
    for (const corrWord of correctedWords) {
      if (origWord !== corrWord && areSimilarWords(origWord, corrWord)) {
        substitutions.push({ from: origWord, to: corrWord });
      }
    }
  }
  
  return { missingWords, addedWords, substitutions };
};

/**
 * Calculates word-level similarity between two strings
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  return commonWords.length / Math.max(words1.length, words2.length);
};

/**
 * Checks if two words are similar (possible substitutions)
 */
const areSimilarWords = (word1: string, word2: string): boolean => {
  if (Math.abs(word1.length - word2.length) > 2) return false;
  
  // Count matching characters
  let matches = 0;
  const shorter = word1.length < word2.length ? word1 : word2;
  const longer = word1.length >= word2.length ? word1 : word2;
  
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  
  return matches / longer.length > 0.6;
};

/**
 * Applies learned patterns to improve interpretation
 */
export const applyLearnedPatterns = (
  interpretation: string, 
  patterns: CorrectionPattern[]
): string => {
  let improved = interpretation;
  
  // Apply common substitutions
  for (const pattern of patterns) {
    for (const sub of pattern.substitutions) {
      const regex = new RegExp(`\\b${sub.from}\\b`, 'gi');
      improved = improved.replace(regex, sub.to);
    }
  }
  
  return improved;
};

/**
 * Clears all stored corrections
 */
export const clearCorrections = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Gets correction statistics
 */
export const getCorrectionStats = (): {
  totalCorrections: number;
  commonMissingWords: string[];
  commonSubstitutions: Array<{ from: string; to: string; count: number }>;
} => {
  const corrections = getCorrections();
  const patterns = corrections.map(c => c.pattern);
  
  // Count missing words
  const missingWordCounts: Record<string, number> = {};
  for (const pattern of patterns) {
    for (const word of pattern.missingWords) {
      missingWordCounts[word] = (missingWordCounts[word] || 0) + 1;
    }
  }
  
  // Count substitutions
  const subCounts: Record<string, number> = {};
  for (const pattern of patterns) {
    for (const sub of pattern.substitutions) {
      const key = `${sub.from}→${sub.to}`;
      subCounts[key] = (subCounts[key] || 0) + 1;
    }
  }
  
  // Sort by frequency
  const commonMissing = Object.entries(missingWordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  const commonSubs = Object.entries(subCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [from, to] = key.split('→');
      return { from, to, count };
    });
  
  return {
    totalCorrections: corrections.length,
    commonMissingWords: commonMissing,
    commonSubstitutions: commonSubs
  };
};
