import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ParsedReason } from "./reasonParser";

interface Props {
  parsed: ParsedReason;
}

export function ReasonSummary({ parsed }: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      <AlertTriangle
        className="h-3 w-3 text-amber-600"
        aria-hidden
      />
      <span>{parsed.typeLabel}</span>
      {parsed.toStatus && (
        <>
          <ArrowRight
            className="h-3 w-3"
            aria-hidden
          />
          <span className="font-medium">{parsed.toStatus}</span>
        </>
      )}
    </span>
  );
}
