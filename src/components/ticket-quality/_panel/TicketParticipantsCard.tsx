import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TicketUserBriefType } from "@/schemaValidatation/ticket";
import {
  Eye,
  Stethoscope,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { DoctorDetailDialog } from "./DoctorDetailDialog";

interface TicketParticipantsCardProps {
  creator: TicketUserBriefType;
  assignee: TicketUserBriefType | null;
}

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function PersonRow({
  user,
  role,
  fallbackIcon: FallbackIcon,
  action,
}: {
  user: TicketUserBriefType;
  role: string;
  fallbackIcon: typeof User;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="lg">
        {user.avatarUrl ? (
          <AvatarImage
            src={user.avatarUrl}
            alt={user.fullName}
          />
        ) : null}
        <AvatarFallback>
          {user.fullName ? (
            initialsFromName(user.fullName)
          ) : (
            <FallbackIcon className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{role}</p>
        <p className="text-sm font-medium truncate">{user.fullName}</p>
        {user.phone && (
          <p className="text-xs text-muted-foreground">{user.phone}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function TicketParticipantsCard({
  creator,
  assignee,
}: TicketParticipantsCardProps) {
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Người tham gia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PersonRow
            user={creator}
            role="Người báo sự cố"
            fallbackIcon={UserCheck}
          />
          <Separator />
          {assignee ? (
            <PersonRow
              user={assignee}
              role="Bác sĩ phụ trách"
              fallbackIcon={Stethoscope}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDoctorDialogOpen(true)}
                  aria-label="Xem hồ sơ bác sĩ"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Xem hồ sơ
                </Button>
              }
            />
          ) : (
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bác sĩ phụ trách</p>
                <p className="text-sm text-muted-foreground italic">
                  Chưa có bác sĩ nhận
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DoctorDetailDialog
        doctorId={assignee?.id ?? null}
        doctorName={assignee?.fullName}
        doctorEmail={assignee?.email}
        avatarUrl={assignee?.avatarUrl}
        open={doctorDialogOpen}
        onOpenChange={setDoctorDialogOpen}
      />
    </>
  );
}
