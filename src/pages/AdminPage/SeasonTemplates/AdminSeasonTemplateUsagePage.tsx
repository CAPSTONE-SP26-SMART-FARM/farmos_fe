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
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useAdminSeasonTemplateDetail,
  useAdminSeasonTemplateUsage,
} from "@/queries/useSeasonTemplate";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useNavigate, useParams } from "react-router";

type UsageRow = {
  productionRequestId: string;
  cropName?: string | null;
  appliedTemplateVersion?: number | null;
  capturedAt: string;
  cropSeasonId: string;
};

export default function AdminSeasonTemplateUsagePage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const usageQuery = useAdminSeasonTemplateUsage(id);
  const detailQuery = useAdminSeasonTemplateDetail(id);

  const usage = usageQuery.data?.data;
  const detail = detailQuery.data?.data;

  const columns: ColumnDef<UsageRow>[] = [
    {
      accessorKey: "cropName",
      header: "Tên vụ",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.cropName ?? "(không tên)"}
        </span>
      ),
    },
    {
      accessorKey: "appliedTemplateVersion",
      header: "Phiên bản mẫu",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          v{row.original.appliedTemplateVersion ?? "?"}
        </span>
      ),
    },
    {
      accessorKey: "capturedAt",
      header: "Thời điểm",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.capturedAt).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      accessorKey: "cropSeasonId",
      header: "CropSeason ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.cropSeasonId.slice(0, 8)}…
        </span>
      ),
    },
  ];

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
          {!usageQuery.isLoading && (!usage || usage.totalUsage === 0) ? (
            <EmptyState
              icon={BarChart3}
              title="Chưa có vụ nào áp dụng mẫu này"
              description="Khi Manager/Owner duyệt một vụ tạo từ mẫu này, vụ đó sẽ xuất hiện ở đây."
            />
          ) : (
            <>
              {usage && (
                <div className="text-sm text-muted-foreground">
                  Tổng cộng:{" "}
                  <span className="font-semibold text-foreground">
                    {usage.totalUsage}
                  </span>{" "}
                  vụ đã áp dụng.
                </div>
              )}
              <div className="overflow-x-auto rounded-md border">
                <DataTable
                  columns={columns}
                  data={(usage?.data ?? []) as UsageRow[]}
                  isLoading={usageQuery.isLoading}
                  emptyText="Chưa có dữ liệu."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
