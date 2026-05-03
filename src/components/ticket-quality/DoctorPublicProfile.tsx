import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useDoctorPublicProfile } from "@/queries/useDoctorPublic";
import { Star, UserRound } from "lucide-react";
import StarRating from "./StarRating";

interface DoctorPublicProfileProps {
  doctorId: string;
  layout?: "compact" | "card";
  doctorName?: string | null;
  doctorEmail?: string | null;
  avatarUrl?: string | null;
}

function getInitials(name?: string | null) {
  if (!name) return "BS";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function DoctorPublicProfile({
  doctorId,
  layout = "card",
  doctorName,
  doctorEmail,
  avatarUrl,
}: DoctorPublicProfileProps) {
  const { data, isLoading, isError, error } = useDoctorPublicProfile(doctorId);
  const profile = data?.data ?? null;
  const avgRating = profile?.avgRating ?? null;
  const ratingValue = avgRating ? Math.round(avgRating * 10) / 10 : 0;

  if (layout === "compact") {
    return (
      <div className="flex items-center gap-3 min-w-55">
        <Avatar size="sm">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback>{getInitials(doctorName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div
            className="font-medium truncate"
            title={doctorName ?? undefined}
          >
            {doctorName ?? "Bác sĩ"}
          </div>
          {doctorEmail && (
            <div
              className="text-xs text-muted-foreground truncate"
              title={doctorEmail}
            >
              {doctorEmail}
            </div>
          )}
          {profile?.specialization && (
            <div
              className="text-xs text-muted-foreground truncate"
              title={profile.specialization}
            >
              {profile.specialization}
            </div>
          )}
        </div>
        <div className="text-right">
          {isLoading ? (
            <Skeleton className="h-4 w-16" />
          ) : isError ? (
            <div className="text-xs text-destructive">
              {getApiErrorMessageVi(error)}
            </div>
          ) : avgRating ? (
            <StarRating
              value={ratingValue}
              readOnly
              size="sm"
              ariaLabel="Đánh giá bác sĩ"
            />
          ) : (
            <div className="text-xs text-muted-foreground">Chưa đánh giá</div>
          )}
          <div className="text-xs text-muted-foreground">
            Đã xử lý {profile?.totalResolvedTickets ?? 0}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="h-4 w-4" />
          Thông tin bác sĩ
        </CardTitle>
        <CardDescription>
          Thông tin tóm tắt bác sĩ hỗ trợ — đánh giá trung bình, số ticket đã xử
          lý và chuyên môn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : isError ? (
          <div className="text-sm text-destructive">
            {getApiErrorMessageVi(error)}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(doctorName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">
                {doctorName ?? "Bác sĩ"}
              </div>
              {doctorEmail && (
                <div
                  className="text-sm text-muted-foreground truncate"
                  title={doctorEmail}
                >
                  {doctorEmail}
                </div>
              )}
              <div
                className="text-sm text-muted-foreground truncate"
                title={profile?.specialization ?? undefined}
              >
                {profile?.specialization ?? "Chưa cập nhật chuyên môn"}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {avgRating ? (
                  <StarRating
                    value={ratingValue}
                    readOnly
                    size="sm"
                    ariaLabel="Đánh giá bác sĩ"
                  />
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5" />
                    Chưa đánh giá
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  Đã xử lý {profile?.totalResolvedTickets ?? 0} ticket
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
