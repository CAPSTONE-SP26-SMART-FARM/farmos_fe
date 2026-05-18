interface Props {
  label: string;
  value: React.ReactNode;
}

export function LogDetailRow({ label, value }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}
