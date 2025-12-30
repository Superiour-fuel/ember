import { useState, useEffect } from 'react';

export interface InterpretationRecord {
    timestamp: Date;
    input: string;
    interpretation: string;
    confidence: number;
    wasCorrect: boolean;
}

export function useAccuracyStats() {
    const [records, setRecords] = useState<InterpretationRecord[]>([]);

    const addRecord = (record: Omit<InterpretationRecord, 'timestamp'>) => {
        setRecords(prev => [...prev, { ...record, timestamp: new Date() }]);
    };

    const stats = {
        totalInterpretations: records.length,
        correctInterpretations: records.filter(r => r.wasCorrect).length,
        accuracy: records.length > 0
            ? (records.filter(r => r.wasCorrect).length / records.length) * 100
            : 0,
        averageConfidence: records.length > 0
            ? records.reduce((sum, r) => sum + r.confidence, 0) / records.length
            : 0,
        mostCommonPhrases: getMostCommonPhrases(records)
    };

    return { stats, addRecord };
}

function getMostCommonPhrases(records: InterpretationRecord[]): string[] {
    const counts = records.reduce((acc, r) => {
        acc[r.interpretation] = (acc[r.interpretation] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([phrase]) => phrase);
}
