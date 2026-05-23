import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OwnerSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
}

interface OwnerSummaryCardProps {
  owner: OwnerSummary;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function OwnerSummaryCard({ owner }: OwnerSummaryCardProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">
        Chủ sở hữu đăng ký
      </p>
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          {owner.avatarUrl && (
            <AvatarImage src={owner.avatarUrl} alt={owner.fullName} />
          )}
          <AvatarFallback>{getInitials(owner.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-semibold">{owner.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {owner.email}
          </p>
          {owner.phone && (
            <p className="truncate text-xs text-muted-foreground">
              {owner.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerSummaryCard;
