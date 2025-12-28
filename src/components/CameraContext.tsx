import React, { useRef, useState, useEffect, useCallback, forwardRef } from 'react';
import { Camera, CameraOff, Eye, EyeOff, MapPin, Users, Package, Hand, Target } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SceneAnalysis {
  room: string;
  objects: string[];
  people_count: number;
  context_hint: string;
  gesture?: string | null;
  pointing_target?: string | null;
  pointing_direction?: string | null;
  suggested_phrases?: string[];
}

interface CameraContextProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onContextUpdate?: (context: SceneAnalysis | null) => void;
}

const CameraContext = forwardRef<HTMLDivElement, CameraContextProps>(
  function CameraContext({ enabled, onToggle, onContextUpdate }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [sceneContext, setSceneContext] = useState<SceneAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Track enabled state to prevent race conditions during async camera start
    const enabledRef = useRef(enabled);

    useEffect(() => {
      enabledRef.current = enabled;
    }, [enabled]);

    const startCamera = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 }
        });

        // Check if we should still be running (fix for race condition)
        if (!enabledRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      } catch (err) {
        console.error('Camera error:', err);
        setError('Camera access denied');
        toast({
          title: "Camera Error",
          description: "Could not access camera. Please check permissions.",
          variant: "destructive"
        });
      }
    }, [toast]);

    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setSceneContext(null);
      onContextUpdate?.(null);
    }, [onContextUpdate]);

    const captureAndAnalyze = useCallback(async () => {
      if (!videoRef.current || !streamRef.current || isAnalyzing) return;

      const video = videoRef.current;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      setIsAnalyzing(true);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.7);

        const { data, error: fnError } = await supabase.functions.invoke('gemini-vision', {
          body: { imageData, analyzeGestures: true }
        });

        if (fnError) {
          console.error('Vision API error:', fnError);
          return;
        }

        if (data && !data.error) {
          setSceneContext(data);
          onContextUpdate?.(data);
        }
      } catch (err) {
        console.error('Analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, [isAnalyzing, onContextUpdate]);

    // Start/stop camera based on enabled state
    useEffect(() => {
      if (enabled) {
        startCamera();
      } else {
        stopCamera();
      }

      return () => stopCamera();
    }, [enabled, startCamera, stopCamera]);

    // Capture frame every 3 seconds when enabled
    useEffect(() => {
      if (!enabled) return;

      const interval = setInterval(captureAndAnalyze, 3000);
      return () => clearInterval(interval);
    }, [enabled, captureAndAnalyze]);

    const handleToggle = (checked: boolean) => {
      onToggle(checked);
    };

    return (
      <Card ref={ref} className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {enabled ? <Camera className="h-4 w-4 text-primary" /> : <CameraOff className="h-4 w-4 text-muted-foreground" />}
              Context Awareness
            </CardTitle>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              aria-label="Toggle camera"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {enabled ? (
            <>
              {/* Camera Preview */}
              <div className="relative rounded-lg overflow-hidden bg-background/50 aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Gesture overlay */}
                {sceneContext?.gesture && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-primary/80 text-primary-foreground rounded-full text-xs">
                    <Hand className="h-3 w-3" />
                    {sceneContext.gesture === 'pointing_at_object' ? 'Pointing detected' : sceneContext.gesture}
                  </div>
                )}

                {/* Pointing target overlay */}
                {sceneContext?.pointing_target && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/90 text-white rounded-lg text-sm">
                      <Target className="h-4 w-4" />
                      <span>Pointing at: <strong>{sceneContext.pointing_target}</strong></span>
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3 animate-pulse" />
                      Analyzing...
                    </div>
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}
              </div>

              {/* Detected Context */}
              {sceneContext && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium capitalize">{sceneContext.room}</span>
                    {sceneContext.people_count > 0 && (
                      <Badge variant="secondary" className="text-xs py-0">
                        <Users className="h-3 w-3 mr-1" />
                        {sceneContext.people_count}
                      </Badge>
                    )}
                    {sceneContext.gesture && (
                      <Badge variant="default" className="text-xs py-0 bg-primary">
                        <Hand className="h-3 w-3 mr-1" />
                        Gesture
                      </Badge>
                    )}
                  </div>

                  {sceneContext.objects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sceneContext.objects.slice(0, 4).map((obj, i) => (
                        <Badge
                          key={i}
                          variant={obj === sceneContext.pointing_target ? "default" : "outline"}
                          className={`text-xs py-0 ${obj === sceneContext.pointing_target ? 'bg-green-500' : ''}`}
                        >
                          {obj === sceneContext.pointing_target && <Target className="h-2 w-2 mr-1" />}
                          <Package className="h-2 w-2 mr-1" />
                          {obj}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground italic">
                    {sceneContext.context_hint}
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                Processed locally, never stored
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Camera disabled - Using conversation history only
            </p>
          )}
        </CardContent>
      </Card>
    );
  });

export default CameraContext;
