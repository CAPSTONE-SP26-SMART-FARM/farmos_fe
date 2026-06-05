import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import { FileText, MapPin, Tractor } from "lucide-react";

interface TicketDescriptionCardProps {
  ticket: TicketIncidentResType;
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon
        aria-hidden="true"
        className="h-4 w-4 text-muted-foreground shrink-0"
      />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

export function TicketDescriptionCard({ ticket }: TicketDescriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Mô tả sự cố
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <MetaRow
            icon={Tractor}
            label="Nông trại"
            value={ticket.farm?.name ?? "—"}
          />
          <MetaRow
            icon={MapPin}
            label="Khu vực"
            value={ticket.zone?.name ?? "—"}
          />
        </div>

        <Separator />

        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Chi tiết</p>
          <p className="whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
