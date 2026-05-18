import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/common/EmptyState";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useMedicineFreetextStats } from "@/queries/useMedicine";
import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import AdminMedicineFormPanel from "./AdminMedicineFormPanel";

// ── Page Admin — Thuốc tự nhập của bác sĩ (B13) ──────────────────────────
// BE endpoint: GET /admin/medicines/freetext-stats — KHÔNG pagination/sort,
// trả flat array {customMedicineName, count}. Aggregate
// PrescriptionItem.customMedicineName để Admin biết thuốc nào hay được kê
// tự do mà chưa có trong danh mục → bổ sung vào danh mục chuẩn.

export default function AdminMedicineFreeTextStatsPage() {
  const [prefillName, setPrefillName] = useState<string | null>(null);

  const listQuery = useMedicineFreetextStats();
  const items = listQuery.data?.data?.data ?? [];

  // Sort client-side theo count desc (BE không sort).
  const sorted = [...items].sort((a, b) => b.count - a.count);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Thuốc Tự Nhập Của Bác Sĩ
          </CardTitle>
          <CardDescription>
            Tổng hợp các thuốc bác sĩ tự nhập (chưa có trong danh mục) — hỗ
            trợ quyết định bổ sung vào danh mục chuẩn. Sắp xếp theo số lần kê
            giảm dần.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!listQuery.isLoading && sorted.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Chưa có thuốc tự nhập"
              description="Khi bác sĩ kê thuốc không có trong danh mục, dữ liệu sẽ tổng hợp ở đây."
            />
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={
                  [
                    {
                      accessorKey: "customMedicineName",
                      header: "Tên thuốc bác sĩ nhập",
                      cell: ({ row }) => (
                        <span className="font-medium">
                          {row.original.customMedicineName}
                        </span>
                      ),
                    },
                    {
                      accessorKey: "count",
                      header: () => (
                        <div className="text-right">Số lần xuất hiện</div>
                      ),
                      cell: ({ row }) => (
                        <div className="text-right tabular-nums">
                          <Badge variant="secondary">
                            {row.original.count}
                          </Badge>
                        </div>
                      ),
                    },
                  ] as ColumnDef<(typeof sorted)[number]>[]
                }
                data={sorted}
                isLoading={listQuery.isLoading}
                actions={[
                  {
                    key: "create",
                    label: "Tạo thuốc",
                    icon: Plus,
                    onSelect: (row) =>
                      setPrefillName(row.customMedicineName),
                  },
                ]}
                emptyText="Chưa có thuốc tự nhập."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(prefillName)}
        onOpenChange={(open) => !open && setPrefillName(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo thuốc từ tên tự nhập</DialogTitle>
            <DialogDescription>
              Bổ sung thuốc bác sĩ đã tự nhập vào danh mục chuẩn để dùng lại cho
              các đơn thuốc sau. Vui lòng điền mã, dạng và đơn vị.
            </DialogDescription>
          </DialogHeader>
          <AdminMedicineFormPanel
            mode="create"
            initialData={null}
            prefillName={prefillName}
            onSuccess={() => setPrefillName(null)}
            onCancel={() => setPrefillName(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
