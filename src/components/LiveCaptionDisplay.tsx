import React, { useState, useEffect } from 'react';
import { Volume2, Maximize2, Minimize2, X, Hand, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CaptionEntry {
  id: string;
  original: string;
  interpreted: string;
  confidence: number;
  timestamp: string;
  usedGesture?: boolean;
}

interface LiveCaptionDisplayProps {
  currentMessage?: string;
  interpretation?: string;
  confidence?: number;
  usedGesture?: boolean;
  isActive: boolean;
  onClose: () => void;
}

export function LiveCaptionDisplay({
  currentMessage,
  interpretation,
  confidence = 0,
  usedGesture = false,
  isActive,
  onClose,
}: LiveCaptionDisplayProps) {
  const [history, setHistory] = useState<CaptionEntry[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (interpretation && currentMessage) {
      const entry: CaptionEntry = {
        id: Date.now().toString(),
        original: currentMessage,
        interpreted: interpretation,
        confidence,
        timestamp: new Date().toISOString(),
        usedGesture,
      };

      setHistory(prev => [entry, ...prev.slice(0, 9)]); // Keep last 10
    }
  }, [interpretation, currentMessage, confidence, usedGesture]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-green-400 bg-green-500/20 border-green-500';
    if (conf >= 60) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500';
    return 'text-orange-400 bg-orange-500/20 border-orange-500';
  };

  if (!isActive) return null;

  return (
    <div
      className={cn(
        "fixed z-50 bg-background/95 backdrop-blur-md transition-all duration-300",
        isFullscreen
          ? "inset-0"
          : "bottom-4 right-4 w-[420px] max-h-[600px] rounded-2xl border border-border shadow-2xl"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary animate-pulse" />
          <h2 className="text-lg font-semibold">Live Captions</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current Interpretation - LARGE */}
      <div className="p-6">
        {currentMessage ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Volume2 className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">Speaking now...</span>
              {usedGesture && (
                <Badge variant="outline" className="text-xs border-primary/50">
                  <Hand className="h-3 w-3 mr-1" />
                  Gesture detected
                </Badge>
              )}
            </div>

            {/* Original speech */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                They said:
              </p>
              <p className="text-xl text-muted-foreground italic">
                "{currentMessage}"
              </p>
            </div>

            {/* Interpretation */}
            {interpretation && (
              <>
                <div className="flex justify-center">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">
                    They meant:
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    "{interpretation}"
                  </p>
                </div>

                {/* Confidence badge */}
                <div className="flex items-center justify-between pt-4">
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm font-medium",
                      getConfidenceColor(confidence)
                    )}
                  >
                    {confidence}% Confidence
                  </div>

                  {confidence >= 80 && (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm">High confidence</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Waiting for speech...</p>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Recent Interpretations
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      {entry.usedGesture && (
                        <Hand className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground italic truncate">
                      "{entry.original}"
                    </p>
                    <p className="text-sm font-medium truncate">
                      → "{entry.interpreted}"
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs shrink-0", getConfidenceColor(entry.confidence))}
                  >
                    {entry.confidence}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-center text-muted-foreground">
          📱 Interpretations are being sent to registered caregivers via SMS • Press ESC to close
        </p>
      </div>
    </div>
  );
}
