import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { TicketStatusBadge } from "@/components/common/TicketStatusBadge";
import { Separator } from "@/components/ui/separator";
import type {
  IncidentSeverityType,
  TicketStatusType,
} from "@/schemaValidatation/ticket";
import { ArrowLeft } from "lucide-react";

interface TicketDetailHeaderProps {
  ticketNumber: string;
  title: string;
  status: TicketStatusType;
  severity: IncidentSeverityType;
  onBack: () => void;
}

export function TicketDetailHeader({
  ticketNumber,
  title,
  status,
  severity,
  onBack,
}: TicketDetailHeaderProps) {
  return (
    <>
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Quay lại danh sách"
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {ticketNumber}
            </span>
            <TicketStatusBadge status={status} />
            <SeverityBadge
              severity={severity}
              withPrefix
            />
          </div>
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        </div>
      </div>
      <Separator />
    </>
  );
}
