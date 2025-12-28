interface StatCardProps {
  value: string;
  label: string;
  description?: string;
}

export function StatCard({ value, label, description }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-gradient-ember mb-2">{value}</div>
      <div className="text-foreground font-medium mb-1">{label}</div>
      {description && (
        <div className="text-muted-foreground text-sm">{description}</div>
      )}
    </div>
  );
}
