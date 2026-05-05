import { Badge } from "@/components/ui/badge";
import { STATUS_MAP } from "./helpers";

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
