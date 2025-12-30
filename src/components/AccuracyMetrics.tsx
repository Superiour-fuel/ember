import { TrendingUp, CheckCircle2, Target, Zap, BarChart3 } from 'lucide-react';

export interface InterpretationStats {
    totalInterpretations: number;
    correctInterpretations: number;
    accuracy: number;
    averageConfidence: number;
    mostCommonPhrases: string[];
}

interface AccuracyMetricsProps {
    stats: InterpretationStats;
}

export function AccuracyMetrics({ stats }: AccuracyMetricsProps) {
    return (
        <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            {/* Header */}
            <div className="bg-black px-4 py-3 border-b-2 border-black">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#4ade80] rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                        <BarChart3 className="w-4 h-4 text-black" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Performance</h3>
                        <p className="text-xs font-medium text-white/60">
                            Interpretation stats
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                    {/* Accuracy - Featured */}
                    <div className="col-span-2 p-4 bg-[#4ade80] rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-black/60 uppercase tracking-wide">Accuracy</p>
                                <p className="text-4xl font-black text-black">
                                    {stats.accuracy.toFixed(0)}%
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                                <Target className="w-6 h-6 text-[#4ade80]" />
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-2 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-black rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(stats.accuracy, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Total */}
                    <div className="p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-bold text-black/50 uppercase">Total</span>
                        </div>
                        <p className="text-2xl font-black text-black">
                            {stats.totalInterpretations}
                        </p>
                    </div>

                    {/* Correct */}
                    <div className="p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                            <span className="text-xs font-bold text-black/50 uppercase">Correct</span>
                        </div>
                        <p className="text-2xl font-black text-[#4ade80]">
                            {stats.correctInterpretations}
                        </p>
                    </div>

                    {/* Avg Confidence */}
                    <div className="col-span-2 p-3 bg-black/5 rounded-xl border-2 border-black/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-black/50 uppercase">Avg Confidence</p>
                                <p className="text-xl font-black text-black">
                                    {stats.averageConfidence.toFixed(1)}%
                                </p>
                            </div>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-6 rounded-sm ${
                                            i <= Math.round(stats.averageConfidence / 20)
                                                ? 'bg-black'
                                                : 'bg-black/20'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Most Common Phrases */}
                {stats.mostCommonPhrases.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-black/10">
                        <p className="text-xs font-bold text-black/50 uppercase tracking-wide mb-2">
                            Top Phrases
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {stats.mostCommonPhrases.slice(0, 3).map((phrase, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg"
                                >
                                    {phrase}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
