import { Loader2, Brain, Sparkles, Mic, Volume2 } from "lucide-react";

interface ProcessingIndicatorProps {
  stage?: 'listening' | 'analyzing' | 'interpreting' | 'responding';
  message?: string;
  className?: string;
}

export function ProcessingIndicator({
  stage = 'analyzing',
  message,
  className = ""
}: ProcessingIndicatorProps) {
  const stageConfig = {
    listening: {
      icon: Mic,
      title: "Listening...",
      description: "Go ahead, I'm listening",
      bg: "bg-black",
      text: "text-white",
      animate: "animate-pulse"
    },
    analyzing: {
      icon: Brain,
      title: "Thinking...",
      description: "Processing your input",
      bg: "bg-[#facc15]", // Yellow
      text: "text-black",
      animate: "animate-bounce"
    },
    interpreting: {
      icon: Sparkles,
      title: "Interpreting...",
      description: "Finding the best meaning",
      bg: "bg-[#4ade80]", // Green
      text: "text-black",
      animate: "animate-spin"
    },
    responding: {
      icon: Volume2,
      title: "Speaking...",
      description: "Generating response",
      bg: "bg-blue-500",
      text: "text-white",
      animate: "animate-pulse"
    }
  };

  const config = stageConfig[stage];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${className}`}>
      <div className="relative">
        {/* Icon Box */}
        <div className={`relative w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${config.bg} ${config.text}`}>
          <Icon className={`w-7 h-7 ${stage === 'interpreting' ? 'animate-spin-slow' : ''}`} />
        </div>
      </div>
      <div className="flex-1 min-w-[180px]">
        <p className="text-black font-black text-lg leading-tight uppercase tracking-tight">{message || config.title}</p>
        <p className="text-sm text-gray-600 font-bold leading-tight mt-0.5">{config.description}</p>
      </div>

      {/* Progress dots - now square and black */}
      <div className="flex gap-1.5 self-center px-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 bg-black border border-black"
            style={{
              animation: 'bounce 1s infinite',
              animationDelay: `${i * 150}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ProcessingOverlayProps {
  isVisible: boolean;
  stage?: ProcessingIndicatorProps['stage'];
  message?: string;
}

export function ProcessingOverlay({ isVisible, stage, message }: ProcessingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full mx-4 relative overflow-hidden">

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-100 rounded-bl-[2.5rem] -z-0 border-b-4 border-l-4 border-black"></div>

        <div className="relative z-10 space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Processing</h3>
            <div className="h-1 w-20 bg-black mx-auto rounded-full"></div>
          </div>

          <ProcessingIndicator stage={stage} message={message} className="w-full !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />

          {/* Visual waveform animation */}
          <div className="flex items-center justify-center gap-1.5 h-12 bg-black/5 rounded-xl border-2 border-black/10 p-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-black rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 24 + 12}px`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
