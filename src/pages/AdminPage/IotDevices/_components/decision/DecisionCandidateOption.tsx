import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SwapCandidateType } from "@/schemaValidatation/iotDeviceAdminOps";

interface Props {
  candidate: SwapCandidateType;
  selected: boolean;
  onSelect: () => void;
}

export function DecisionCandidateOption({
  candidate,
  selected,
  onSelect,
}: Props) {
  const disabled = !candidate.isEligible;
  const label = candidate.label ?? "Thiết bị (chưa có mã)";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected ? "true" : "false"}
      aria-label={`Chọn thiết bị ${label}`}
      className={cn(
        "h-auto flex-col items-stretch gap-1 p-3 text-left font-normal whitespace-normal",
        selected &&
          !disabled &&
          "border-primary ring-2 ring-primary/30 bg-primary/5",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-semibold">{label}</span>
        {selected && !disabled && (
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-primary"
            aria-hidden
          />
        )}
        {disabled && (
          <Clock
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
      </span>
      {disabled ? (
        <span className="space-y-0.5 text-xs">
          <span className="block font-medium text-amber-700 dark:text-amber-400">
            Chưa đủ điều kiện
          </span>
          {candidate.missingRequirements.length > 0 && (
            <ul className="ml-3 list-disc text-muted-foreground">
              {candidate.missingRequirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2
            className="h-3 w-3"
            aria-hidden
          />
          Đủ điều kiện thay thế
        </span>
      )}
    </Button>
  );
}
