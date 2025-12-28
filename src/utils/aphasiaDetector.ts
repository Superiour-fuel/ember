// Aphasia Pattern Detection Utility
// Detects fragmented speech patterns common in aphasia

export interface AphasiaIndicators {
  hasMultiplePauses: boolean;
  hasShortFragments: boolean;
  missingArticles: boolean;
  hasActionVerbOnly: boolean;
  lowWordCount: boolean;
  hasFillerWords: boolean;
  hasWordRepetition: boolean;
}

export interface AphasiaDetectionResult {
  isLikelyAphasia: boolean;
  confidence: number; // 0-100 scale
  indicators: AphasiaIndicators;
  patternType: 'fluent' | 'non-fluent' | 'anomic' | 'global' | 'normal';
  suggestedApproach: string;
}

/**
 * Detects aphasia patterns in user speech
 * @param message - The transcribed speech text
 * @returns Detection result with confidence and indicators
 */
export const detectAphasiaPattern = (message: string): AphasiaDetectionResult => {
  const normalizedMessage = message.trim().toLowerCase();
  const words = normalizedMessage.split(/\s+/).filter(w => w.length > 0);
  
  const indicators: AphasiaIndicators = {
    // Multiple pauses indicated by ellipsis or repeated periods
    hasMultiplePauses: /\.{2,}|…/.test(message),
    
    // Many short words (3 or fewer characters)
    hasShortFragments: words.filter(w => w.replace(/[^a-z]/gi, '').length <= 3).length >= 3,
    
    // Missing common articles (the, a, an)
    missingArticles: words.length > 2 && !/(^|\s)(the|a|an)\s/i.test(message),
    
    // Starts with action verb without subject
    hasActionVerbOnly: /^(want|need|get|go|help|give|take|make|put|see|find|come|bring|eat|drink|open|close|call|turn|stop|start)\b/i.test(normalizedMessage),
    
    // Very few words
    lowWordCount: words.length > 0 && words.length < 5,
    
    // Contains filler words or hesitation markers
    hasFillerWords: /\b(um|uh|er|ah|like|you know|well|so)\b/i.test(message),
    
    // Word repetition
    hasWordRepetition: hasRepeatedWords(words)
  };

  const indicatorCount = Object.values(indicators).filter(Boolean).length;
  const confidence = Math.min(100, indicatorCount * 15);
  
  // Determine pattern type
  const patternType = determinePatternType(indicators, words);
  
  return {
    isLikelyAphasia: indicatorCount >= 2,
    confidence,
    indicators,
    patternType,
    suggestedApproach: getSuggestedApproach(patternType)
  };
};

/**
 * Checks for repeated words in sequence
 */
const hasRepeatedWords = (words: string[]): boolean => {
  for (let i = 0; i < words.length - 1; i++) {
    const cleanWord = words[i].replace(/[^a-z]/gi, '');
    const nextCleanWord = words[i + 1].replace(/[^a-z]/gi, '');
    if (cleanWord.length > 2 && cleanWord === nextCleanWord) {
      return true;
    }
  }
  return false;
};

/**
 * Determines the type of aphasia pattern detected
 */
const determinePatternType = (
  indicators: AphasiaIndicators, 
  words: string[]
): AphasiaDetectionResult['patternType'] => {
  const indicatorCount = Object.values(indicators).filter(Boolean).length;
  
  if (indicatorCount < 2) {
    return 'normal';
  }
  
  // Non-fluent (Broca's): Short, effortful speech, missing function words
  if (indicators.missingArticles && indicators.lowWordCount && !indicators.hasFillerWords) {
    return 'non-fluent';
  }
  
  // Fluent (Wernicke's): Normal-length but often nonsensical, may have filler words
  if (indicators.hasFillerWords && !indicators.lowWordCount) {
    return 'fluent';
  }
  
  // Anomic: Word-finding difficulty, may use circumlocution
  if (indicators.hasMultiplePauses && indicators.hasFillerWords) {
    return 'anomic';
  }
  
  // Global: Severe, very limited output
  if (indicators.lowWordCount && words.length <= 2) {
    return 'global';
  }
  
  return 'non-fluent'; // Default to non-fluent if unclear
};

/**
 * Returns a suggested approach based on pattern type
 */
const getSuggestedApproach = (patternType: AphasiaDetectionResult['patternType']): string => {
  switch (patternType) {
    case 'non-fluent':
      return 'Fill in missing words and offer complete sentence options';
    case 'fluent':
      return 'Focus on extracting key meaning from longer speech';
    case 'anomic':
      return 'Help identify the missing word they are searching for';
    case 'global':
      return 'Offer multiple interpretations with visual support';
    default:
      return 'Standard interpretation';
  }
};

/**
 * Extracts key concepts from fragmented speech
 */
export const extractKeyConcepts = (message: string): string[] => {
  const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  // Remove common filler words and articles
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'um', 'uh', 'er', 'ah', 'like', 'well', 'so', 'to', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with'];
  
  const concepts = words
    .map(w => w.replace(/[^a-z]/gi, ''))
    .filter(w => w.length > 2 && !stopWords.includes(w));
  
  // Remove duplicates while preserving order
  return [...new Set(concepts)];
};

/**
 * Generates possible complete sentences from fragmented input
 */
export const generatePossibleInterpretations = (
  message: string,
  context?: { room?: string; objects?: string[] }
): string[] => {
  const concepts = extractKeyConcepts(message);
  const interpretations: string[] = [];
  
  if (concepts.length === 0) {
    return ['Could you please repeat that?'];
  }
  
  // Common patterns for reconstruction
  const hasWant = concepts.includes('want') || concepts.includes('need');
  const hasGo = concepts.includes('go') || concepts.includes('going');
  const hasHelp = concepts.includes('help');
  
  if (hasWant && concepts.length > 1) {
    const object = concepts.find(c => !['want', 'need'].includes(c)) || '';
    interpretations.push(`I want ${object}`);
    interpretations.push(`I need ${object}`);
  }
  
  if (hasGo && concepts.length > 1) {
    const place = concepts.find(c => !['go', 'going'].includes(c)) || '';
    interpretations.push(`I want to go to the ${place}`);
  }
  
  if (hasHelp) {
    interpretations.push('I need help');
    interpretations.push('Can you help me?');
  }
  
  // If context available, use it
  if (context?.objects && context.objects.length > 0) {
    const matchingObject = context.objects.find(obj => 
      concepts.some(c => obj.toLowerCase().includes(c))
    );
    if (matchingObject) {
      interpretations.push(`I want the ${matchingObject}`);
    }
  }
  
  // Fallback: join concepts into a sentence
  if (interpretations.length === 0) {
    interpretations.push(`I ${concepts.join(' ')}`);
  }
  
  return interpretations.slice(0, 3);
};
