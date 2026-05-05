import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminSeasonTemplateDetail,
  useAdminSeasonTemplateUsage,
} from "@/queries/useSeasonTemplate";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";

export default function AdminSeasonTemplateUsagePage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const usageQuery = useAdminSeasonTemplateUsage(id);
  const detailQuery = useAdminSeasonTemplateDetail(id);

  const usage = usageQuery.data?.data;
  const detail = detailQuery.data?.data;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/admin/season-templates")}
          size="sm"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Danh sách mẫu
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboard/admin/season-templates/${id}`)}
        >
          Xem mẫu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Lịch sử sử dụng
            {detail && (
              <Badge variant="outline">
                {detail.name} · v{detail.version ?? 1}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Danh sách vụ mùa đã apply mẫu này (chỉ tính các vụ đã được duyệt qua
            ProductionRequest — BR-115).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !usage || usage.totalUsage === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Chưa có vụ nào áp dụng mẫu này"
              description="Khi Manager/Owner duyệt một vụ tạo từ mẫu này, vụ đó sẽ xuất hiện ở đây."
            />
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Tổng cộng:{" "}
                <span className="font-semibold text-foreground">
                  {usage.totalUsage}
                </span>{" "}
                vụ đã áp dụng.
              </div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên vụ</TableHead>
                      <TableHead>Phiên bản mẫu</TableHead>
                      <TableHead>Thời điểm</TableHead>
                      <TableHead className="text-xs">CropSeason ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage.data.map((u) => (
                      <TableRow key={u.productionRequestId}>
                        <TableCell className="font-medium">
                          {u.cropName ?? "(không tên)"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          v{u.appliedTemplateVersion ?? "?"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.capturedAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {u.cropSeasonId.slice(0, 8)}…
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
