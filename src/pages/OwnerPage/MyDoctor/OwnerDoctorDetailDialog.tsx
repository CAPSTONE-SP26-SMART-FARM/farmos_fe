import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetDoctorDetail } from "@/queries/useOwner";
import type { AssignmentWithDoctorResType } from "@/schemaValidatation/doctorAssignment";
import DoctorPublicProfile from "@/components/ticket-quality/DoctorPublicProfile";

interface Props {
  id?: string;
  setId: (id: string | undefined) => void;
}

const OwnerDoctorDetailDialog = ({ id, setId }: Props) => {
  const detailQuery = useOwnerGetDoctorDetail(id ?? "");
  const detail: AssignmentWithDoctorResType | undefined =
    detailQuery.data?.data;

  const reset = () => setId(undefined);

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(open) => {
        if (!open) reset();
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết bác sĩ</DialogTitle>
          <DialogDescription>
            Thông tin bác sĩ được phân công cho farm của bạn.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        ) : detailQuery.isError ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">
                Không thể tải dữ liệu
              </CardTitle>
              <CardDescription>Vui lòng thử lại.</CardDescription>
            </CardHeader>
          </Card>
        ) : !detail ? (
          <Card>
            <CardHeader>
              <CardTitle>Không có dữ liệu</CardTitle>
              <CardDescription>Bản ghi không được tìm thấy.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            <DoctorPublicProfile
              doctorId={detail.doctorId}
              doctorName={detail.doctor?.fullName}
              doctorEmail={detail.doctor?.email}
              avatarUrl={detail.doctor?.avatarUrl}
              layout="card"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Phân công</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Trạng thái</div>
                      <div className="font-medium capitalize">
                        {detail.status || "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Chính</div>
                      <div className="font-medium">
                        {detail.isPrimary ? "Có" : "Không"}
                      </div>
                    </div>
                  </div>

                  {detail.notes ? (
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Ghi chú</div>
                      <div className="whitespace-pre-wrap">{detail.notes}</div>
                    </div>
                  ) : null}

                  <Separator />

                  <div className="space-y-1">
                    <div className="text-muted-foreground">Phân công lúc</div>
                    <div className="font-medium">
                      {formatDateTime(detail.assignedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Đóng</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OwnerDoctorDetailDialog;
