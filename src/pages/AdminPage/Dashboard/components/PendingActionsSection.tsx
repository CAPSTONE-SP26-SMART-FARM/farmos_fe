import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RegistrationStatusName } from "@/constants/profile";
import { useAdminListDoctorRequest } from "@/queries/useAdmin";
import { ArrowRight, Clock, Stethoscope, Wallet } from "lucide-react";
import { useNavigate } from "react-router";

function DoctorApplicationsCard() {
  const navigate = useNavigate();

  const countQuery = useAdminListDoctorRequest({
    page: 1,
    limit: 1,
    status: RegistrationStatusName.Pending,
  });

  const listQuery = useAdminListDoctorRequest({
    page: 1,
    limit: 5,
    status: RegistrationStatusName.Pending,
  });

  const total = countQuery.data?.data?.meta?.totalItems ?? 0;
  const items = listQuery.data?.data?.data ?? [];
  const isLoading = listQuery.isLoading;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
            <Stethoscope className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold">
              Đơn xin làm bác sĩ
            </CardTitle>
            <CardDescription className="text-xs">
              Chờ phê duyệt từ admin
            </CardDescription>
          </div>
          {!isLoading && (
            <Badge
              variant={total > 0 ? "default" : "secondary"}
              className={
                total > 0
                  ? "bg-amber-500 hover:bg-amber-500 text-white shrink-0"
                  : "shrink-0"
              }
            >
              {total}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 pb-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 rounded-md"
            />
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Clock className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">Không có đơn nào đang chờ duyệt</p>
          </div>
        ) : (
          items.map((item) => {
            const user = (item as { user?: { name?: string; email?: string } })
              .user;
            const displayName = user?.name || user?.email || item.id;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate("/dashboard/admin/doctor-applications")}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.title}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-300 text-amber-700 bg-amber-50 shrink-0 text-xs"
                >
                  Chờ duyệt
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate("/dashboard/admin/doctor-applications")}
        >
          Xem tất cả đơn
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function WithdrawalRequestsCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
            <Wallet className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold">
              Yêu cầu rút tiền
            </CardTitle>
            <CardDescription className="text-xs">
              Bác sĩ gửi yêu cầu rút hoa hồng
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            0
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
          <Wallet className="mb-2 h-8 w-8 opacity-30" />
          <p className="text-sm">Không có yêu cầu nào đang chờ xử lý</p>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled
        >
          Xem tất cả yêu cầu
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PendingActionsSection() {
  return (
    <section
      aria-labelledby="pending-actions-heading"
      className="space-y-3"
    >
      <h2
        id="pending-actions-heading"
        className="text-sm font-semibold text-muted-foreground"
      >
        Yêu cầu cần xử lý
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <DoctorApplicationsCard />
        <WithdrawalRequestsCard />
      </div>
    </section>
  );
}
