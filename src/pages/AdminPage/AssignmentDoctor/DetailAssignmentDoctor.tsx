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
import { useAdminDoctorAssginmentDetail } from "@/queries/useAdmin";
import type { AssignmentDetailAdminResType } from "@/schemaValidatation/doctorAssignment";

interface Props {
  id?: string;
  setId: (id: string | undefined) => void;
}

const DetailAssignmentDoctor = ({ id, setId }: Props) => {
  const detailQuery = useAdminDoctorAssginmentDetail(id ?? "");
  const detail: AssignmentDetailAdminResType | undefined =
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
          <DialogTitle>Chi tiết phân công</DialogTitle>
          <DialogDescription>
            Thông tin phân công bác sĩ và chủ trang trại dành cho quản trị.
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
              <CardDescription>Không tìm thấy phân công.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
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
                    <div className="text-muted-foreground">Phân công chính</div>
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Ngày phân công</div>
                    <div className="font-medium">
                      {formatDateTime(detail.assignedAt)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Người phân công</div>
                    <div className="font-medium">
                      {detail.assigner?.email ?? "—"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bác sĩ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">
                      {detail.doctor?.email ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Họ tên</div>
                    <div className="font-medium">
                      {detail.doctor?.fullName ?? "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chủ trang trại</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">
                      {detail.owner?.email ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Họ tên</div>
                    <div className="font-medium">
                      {detail.owner?.fullName ?? "—"}
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

export default DetailAssignmentDoctor;
