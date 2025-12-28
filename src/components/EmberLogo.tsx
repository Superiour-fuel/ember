interface EmberLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const textSizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

export function EmberLogo({ className = "", size = "md" }: EmberLogoProps) {
  return (
    <span className={`font-display font-bold tracking-tight select-none ${textSizeClasses[size]} ${className}`}>
      ember.
    </span>
  );
}
