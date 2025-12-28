import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { VoiceVisualization } from "@/components/VoiceVisualization";
import {
  Play,
  Pause,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  Check
} from "lucide-react";

interface VoiceSample {
  audioBlob: string;
  recordedAt: string;
  clarity_score: number;
}

interface VoiceComparisonPlayerProps {
  originalSample: VoiceSample;
  currentSample: VoiceSample;
  onUpdate?: () => void;
  className?: string;
}

export function VoiceComparisonPlayer({
  originalSample,
  currentSample,
  onUpdate,
  className
}: VoiceComparisonPlayerProps) {
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [playingCurrent, setPlayingCurrent] = useState(false);
  
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const change = currentSample.clarity_score - originalSample.clarity_score;
  const changePercent = Math.abs(change);
  
  const getChangeStatus = () => {
    if (change > 5) return { type: "improved", color: "text-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" };
    if (change < -5) return { type: "declined", color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/30" };
    return { type: "stable", color: "text-muted-foreground", bgColor: "bg-secondary", borderColor: "border-border" };
  };

  const status = getChangeStatus();

  const playOriginal = () => {
    stopAll();
    originalAudioRef.current = new Audio(originalSample.audioBlob);
    originalAudioRef.current.onended = () => setPlayingOriginal(false);
    originalAudioRef.current.play();
    setPlayingOriginal(true);
  };

  const playCurrent = () => {
    stopAll();
    currentAudioRef.current = new Audio(currentSample.audioBlob);
    currentAudioRef.current.onended = () => setPlayingCurrent(false);
    currentAudioRef.current.play();
    setPlayingCurrent(true);
  };

  const stopAll = () => {
    if (originalAudioRef.current) {
      originalAudioRef.current.pause();
      originalAudioRef.current.currentTime = 0;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    setPlayingOriginal(false);
    setPlayingCurrent(false);
  };

  const getClarityColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <div className={`card-ember rounded-xl border ${status.borderColor} ${className}`}>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Voice Comparison</h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Original Voice */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Original Voice</p>
            <p className="text-xs text-center text-muted-foreground">
              {new Date(originalSample.recordedAt).toLocaleDateString()}
            </p>
            
            <div className="h-12 flex items-center justify-center">
              <VoiceVisualization isActive={playingOriginal} className="scale-75" />
            </div>
            
            <div className="text-center">
              <span className={`text-2xl font-bold ${getClarityColor(originalSample.clarity_score)}`}>
                {originalSample.clarity_score}%
              </span>
            </div>
            
            <button
              onClick={playingOriginal ? stopAll : playOriginal}
              className="w-full py-2 px-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              {playingOriginal ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-0.5" />
                  Play
                </>
              )}
            </button>
          </div>

          {/* Current Voice */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Current Voice</p>
            <p className="text-xs text-center text-muted-foreground">
              {new Date(currentSample.recordedAt).toLocaleDateString()}
            </p>
            
            <div className="h-12 flex items-center justify-center">
              <VoiceVisualization isActive={playingCurrent} className="scale-75" />
            </div>
            
            <div className="text-center">
              <span className={`text-2xl font-bold ${getClarityColor(currentSample.clarity_score)}`}>
                {currentSample.clarity_score}%
              </span>
            </div>
            
            <button
              onClick={playingCurrent ? stopAll : playCurrent}
              className="w-full py-2 px-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              {playingCurrent ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-0.5" />
                  Play
                </>
              )}
            </button>
          </div>
        </div>

        {/* Change Summary */}
        <div className={`rounded-lg p-4 ${status.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {status.type === "improved" && <TrendingUp className="w-5 h-5 text-green-500" />}
              {status.type === "declined" && <TrendingDown className="w-5 h-5 text-destructive" />}
              {status.type === "stable" && <Minus className="w-5 h-5 text-muted-foreground" />}
              <span className={`font-semibold ${status.color}`}>
                {status.type === "improved" && `+${changePercent}% improvement`}
                {status.type === "declined" && `-${changePercent}% change`}
                {status.type === "stable" && "Voice stable"}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {status.type === "improved" && "Your voice clarity has improved! Keep using Ember to track progress."}
            {status.type === "declined" && "Your voice has changed. Consider updating your voice model to maintain accuracy."}
            {status.type === "stable" && "Your voice clarity is consistent with your original recording."}
          </p>
        </div>

        {status.type === "declined" && onUpdate && (
          <Button variant="ember" className="w-full mt-4" onClick={onUpdate}>
            Update Voice Model
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}