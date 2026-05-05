import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmptyState from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import type { OwnerDoctor as DoctorMock } from "@/types/dashboard";
import { Stethoscope } from "lucide-react";
import { Link } from "react-router";

const STATUS_META: Record<DoctorMock["status"], { label: string; tone: string }> =
  {
    active: {
      label: "Sẵn sàng",
      tone: "bg-emerald-500/10 text-emerald-700 border-transparent",
    },
    busy: {
      label: "Đang bận",
      tone: "bg-amber-500/10 text-amber-700 border-transparent",
    },
  };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface MyDoctorsCardProps {
  doctors: DoctorMock[];
  className?: string;
}

function MyDoctorsCard({ doctors, className }: MyDoctorsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Bác sĩ phụ trách</CardTitle>
            <CardDescription>
              {doctors.length > 0
                ? `${doctors.length} bác sĩ đang hỗ trợ trang trại.`
                : "Chưa có bác sĩ nào."}
            </CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link to="/dashboard/owner/my-doctor">Xem tất cả</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {doctors.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="Chưa có bác sĩ"
            description="Yêu cầu phân công bác sĩ để bắt đầu nhận tư vấn."
          />
        ) : (
          <ul className="space-y-3">
            {doctors.map((doctor) => {
              const meta = STATUS_META[doctor.status];
              return (
                <li
                  key={doctor.id}
                  className="flex items-center gap-3"
                >
                  <Avatar size="default">
                    {doctor.avatarUrl && (
                      <AvatarImage
                        src={doctor.avatarUrl}
                        alt={doctor.fullName}
                      />
                    )}
                    <AvatarFallback>
                      {getInitials(doctor.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {doctor.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doctor.specialty ?? "—"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(meta.tone)}
                  >
                    {meta.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default MyDoctorsCard;
