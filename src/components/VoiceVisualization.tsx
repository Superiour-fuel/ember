interface VoiceVisualizationProps {
  isActive?: boolean;
  className?: string;
  barColor?: string;
}

export function VoiceVisualization({ isActive = false, className = "", barColor }: VoiceVisualizationProps) {
  const bars = [1, 2, 3, 4, 5];

  return (
    <div
      className={`flex items-center justify-center gap-1 h-12 ${className}`}
      role="img"
      aria-label={isActive ? "Voice input active" : "Voice input inactive"}
    >
      {bars.map((bar) => (
        <div
          key={bar}
          className={`
            w-1 rounded-full transition-all duration-300
            ${isActive ? 'voice-bar' : 'h-2'}
            ${!barColor ? 'bg-primary' : ''}
          `}
          style={{
            height: isActive ? `${Math.random() * 24 + 12}px` : '8px',
            opacity: isActive ? 1 : 0.4,
            backgroundColor: barColor || undefined,
          }}
        />
      ))}
    </div>
  );
}

