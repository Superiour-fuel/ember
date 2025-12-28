
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { VoiceBankingCard } from "./VoiceBankingCard";
import { TextToSpeechInput, TextToSpeechInputHandle } from "./TextToSpeechInput";
import { QuickPhrases } from "./QuickPhrases";
import {
  Zap,
  AlertTriangle,
  Camera,
  CameraOff,
  ChevronRight,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Sparkles,
  Eye,
  Hand,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRef, useCallback } from "react";
import { SceneAnalysis } from "@/components/CameraContext";
import geminiIcon from "@/assets/gemini-icon.png";

interface PersonalizationSidebarProps {
  confidence: number;
  isCameraEnabled: boolean;
  onCameraToggle: () => void;
  detectedContext?: string;
  className?: string;
}

export function PersonalizationSidebar({
  confidence,
  isCameraEnabled,
  onCameraToggle,
  detectedContext,
  onContextUpdate,
  className
}: PersonalizationSidebarProps & { onContextUpdate?: (context: SceneAnalysis | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sceneContext, setSceneContext] = useState<SceneAnalysis | null>(null);
  const ttsInputRef = useRef<TextToSpeechInputHandle>(null);
  const { toast } = useToast();

  // Track enabled state to prevent race conditions during async camera start
  const enabledRef = useRef(isCameraEnabled);

  useEffect(() => {
    enabledRef.current = isCameraEnabled;
  }, [isCameraEnabled]);

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
    } catch (err) {
      console.error('Camera error:', err);
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

  useEffect(() => {
    if (isCameraEnabled) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraEnabled, startCamera, stopCamera]);

  useEffect(() => {
    if (!isCameraEnabled) return;
    const interval = setInterval(captureAndAnalyze, 3000);
    return () => clearInterval(interval);
  }, [isCameraEnabled, captureAndAnalyze]);
  const [calibrationCount, setCalibrationCount] = useState(0);
  const [lastRecordedDate, setLastRecordedDate] = useState<string | null>(null);
  const [conversationsToday, setConversationsToday] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);
  const [trend, setTrend] = useState<"improving" | "stable" | "declining">("stable");

  useEffect(() => {
    // Load calibration data from localStorage
    const calibrationData = localStorage.getItem('ember_calibration_examples');
    if (calibrationData) {
      const phrases = JSON.parse(calibrationData);
      setCalibrationCount(phrases.length);
      if (phrases.length > 0 && phrases[phrases.length - 1].timestamp) {
        setLastRecordedDate(new Date(phrases[phrases.length - 1].timestamp).toLocaleDateString());
      }
    }

    // Simulated stats (in real app, these would come from a database)
    setConversationsToday(Math.floor(Math.random() * 10) + 1);
    setAvgConfidence(Math.floor(Math.random() * 20) + 75);
    setTrend(["improving", "stable", "declining"][Math.floor(Math.random() * 3)] as any);
  }, []);

  const getConfidenceColor = () => {
    if (confidence < 60) return "text-red-500";
    if (confidence < 80) return "text-yellow-500";
    return "text-green-500";
  };

  const getConfidenceMessage = () => {
    if (confidence < 60) return "Low confidence - I might not understand correctly";
    if (confidence < 80) return "Moderate confidence";
    return "High confidence - I understand you clearly";
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "improving": return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "declining": return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case "improving": return "Improving";
      case "declining": return "Declining";
      default: return "Stable";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Personalization Status - Green Card */}
      <div className="bg-[#f0fdf4] rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] duration-200">
        <div className="flex items-center gap-2 mb-3">
          {calibrationCount >= 5 ? (
            <Zap className="w-5 h-5 text-black" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          )}
          <h3 className="font-bold text-lg text-black">Personalization</h3>
        </div>

        <p className={`text-sm font-medium mb-2 ${calibrationCount >= 5 ? "text-green-700" : "text-yellow-700"}`}>
          {calibrationCount}/5 examples recorded {calibrationCount >= 5 && "✓"}
        </p>

        {lastRecordedDate && (
          <p className="text-xs text-gray-600 mb-4 font-medium">
            Last recorded: {lastRecordedDate}
          </p>
        )}

        <Link to="/setup">
          <Button className="w-full bg-black text-white rounded-xl border-2 border-transparent hover:bg-black/80 hover:scale-[1.02] transition-all font-bold text-xs h-9 shadow-sm">
            {calibrationCount >= 5 ? "Add More Examples" : "Record Now"}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Voice Banking Status */}
      <VoiceBankingCard />

      {/* Text To Speech with Cloned Voice */}
      <TextToSpeechInput ref={ttsInputRef} />

      {/* Confidence Indicator - Black Card */}
      <div className="bg-black text-white rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] p-5 overflow-hidden transition-transform hover:-translate-y-1 duration-200 relative">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-[#4ade80]" />
          <h3 className="font-bold text-lg">Confidence</h3>
        </div>

        <img
          src={geminiIcon}
          alt="Gemini"
          className="absolute top-4 right-4 w-6 h-6 object-contain"
        />

        <div className={`text-5xl font-black mb-2 tracking-tighter ${getConfidenceColor()}`}>
          {confidence}%
        </div>

        <p className="text-xs font-medium text-gray-400">
          {getConfidenceMessage()}
        </p>
      </div>

      {/* Context Awareness - Cream Card */}
      <div className="bg-[#fffbeb] rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 overflow-hidden transition-transform hover:-translate-y-1 duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isCameraEnabled ? (
              <Camera className="w-5 h-5 text-black" />
            ) : (
              <CameraOff className="w-5 h-5 text-gray-500" />
            )}
            <h3 className="font-bold text-lg text-black">Context</h3>
          </div>

          <button
            onClick={onCameraToggle}
            className={`w-12 h-7 rounded-full transition-colors border-2 border-black relative ${isCameraEnabled ? "bg-[#4ade80]" : "bg-gray-200"
              }`}
          >
            <div className={`w-4 h-4 rounded-full bg-black border border-black absolute top-1 transition-all ${isCameraEnabled ? "left-[calc(100%-1.25rem)]" : "left-1"
              }`} />
          </button>
        </div>

        {isCameraEnabled ? (
          <>
            <div className="relative aspect-video bg-black rounded-xl border-2 border-black/10 mb-3 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Overlays */}
              {isAnalyzing && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <Eye className="w-3 h-3 animate-pulse" />
                  Analyzing
                </div>
              )}
              {sceneContext?.gesture && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-black font-bold text-[10px] rounded-md flex items-center gap-1 shadow-sm">
                  <Hand className="w-3 h-3" />
                  {sceneContext.gesture === 'pointing_at_object' ? 'Pointing detected' : sceneContext.gesture}
                </div>
              )}
              {/* Pointing target overlay */}
              {sceneContext?.pointing_target && (
                <div className="absolute bottom-2 right-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-black font-bold text-[10px] rounded-md shadow-sm">
                    <Target className="h-3 w-3" />
                    <span>Target: {sceneContext.pointing_target}</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm font-bold text-black flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4ade80]" fill="black" />
              {sceneContext?.context_hint || detectedContext || "Detecting context..."}
            </p>

            {/* Smart Suggested Phrases */}
            {sceneContext?.suggested_phrases && sceneContext.suggested_phrases.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-bold text-black/50 uppercase tracking-widest">Smart Suggestions</p>
                <div className="grid grid-cols-1 gap-2">
                  {sceneContext.suggested_phrases.map((phrase: string, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs font-medium justify-start h-auto py-2.5 px-3 whitespace-normal text-left bg-white border-2 border-black/10 hover:border-black hover:bg-white text-black shadow-sm transition-all"
                      onClick={() => {
                        if (ttsInputRef.current) {
                          ttsInputRef.current.speak(phrase);
                        }
                      }}
                    >
                      <img src={geminiIcon} alt="Gemini" className="w-3 h-3 mr-2 object-contain shrink-0" />
                      {phrase}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs font-medium text-gray-600">
            Camera disabled. Using conversation history only.
          </p>
        )}

        <p className="text-[10px] font-bold text-black/30 mt-3 uppercase tracking-wider">
          Processed locally • Never stored
        </p>
      </div>

      {/* Quick Stats - White Card */}
      <div className="bg-white rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 overflow-hidden transition-transform hover:-translate-y-1 duration-200">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-black" />
          <h3 className="font-bold text-lg text-black">Today's Stats</h3>
        </div>

        <div className="space-y-3 text-sm font-medium">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-gray-600">Conversations</span>
            <span className="font-bold text-black">{conversationsToday}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-gray-600">Avg Confidence</span>
            <span className="font-bold text-black">{avgConfidence}%</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
            <span className="text-gray-600">Voice Clarity</span>
            <span className="flex items-center gap-1 font-bold text-black">
              {getTrendIcon()}
              {getTrendLabel()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Phrases Card */}
      <div className="bg-white rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 overflow-hidden transition-transform hover:-translate-y-1 duration-200">
        <QuickPhrases />
      </div>

      {/* Timeline Link */}
      <Link to="/timeline" className="block mt-4">
        <div className="group flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
          <span className="font-bold text-sm text-black">View Voice Timeline</span>
          <ChevronRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    </div>
  );
}
