import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ZoneCrewPresence } from "../_mocks/managerDashboard.mock";

function pctTone(pct: number): string {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

interface CrewPresenceCardProps {
  zones: ZoneCrewPresence[];
  className?: string;
}

function CrewPresenceCard({ zones, className }: CrewPresenceCardProps) {
  // Sort lowest compliance first so manager sees laggards on top.
  const sorted = [...zones].sort((a, b) => {
    const ratioA = a.assignedToday > 0 ? a.loggedToday / a.assignedToday : 1;
    const ratioB = b.assignedToday > 0 ? b.loggedToday / b.assignedToday : 1;
    return ratioA - ratioB;
  });

  const totalLogged = zones.reduce((acc, z) => acc + z.loggedToday, 0);
  const totalAssigned = zones.reduce((acc, z) => acc + z.assignedToday, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Crew presence hôm nay</CardTitle>
        <CardDescription>
          {totalLogged}/{totalAssigned} nông dân đã ghi nhật ký
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có khu vực nào được phân công.
          </p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((zone) => {
              const pct =
                zone.assignedToday > 0
                  ? Math.round((zone.loggedToday / zone.assignedToday) * 100)
                  : 0;
              const isLagging = pct < 80;
              return (
                <li
                  key={zone.zoneId}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {zone.zoneName}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "tabular-nums",
                        isLagging
                          ? "bg-amber-500/10 text-amber-700 border-transparent"
                          : "bg-emerald-500/10 text-emerald-700 border-transparent",
                      )}
                    >
                      {zone.loggedToday}/{zone.assignedToday}
                    </Badge>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tỉ lệ ghi nhật ký ${zone.zoneName}`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        pctTone(pct),
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default CrewPresenceCard;
