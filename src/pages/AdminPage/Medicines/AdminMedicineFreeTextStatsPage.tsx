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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/common/EmptyState";
import { useMedicineFreetextStats } from "@/queries/useMedicine";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import AdminMedicineFormSheet from "./AdminMedicineFormSheet";

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
          {listQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Chưa có thuốc tự nhập"
              description="Khi bác sĩ kê thuốc không có trong danh mục, dữ liệu sẽ tổng hợp ở đây."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên thuốc bác sĩ nhập</TableHead>
                    <TableHead className="text-right">Số lần xuất hiện</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((row) => (
                    <TableRow key={row.customMedicineName}>
                      <TableCell className="font-medium">
                        {row.customMedicineName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <Badge variant="secondary">{row.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPrefillName(row.customMedicineName)}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Tạo thuốc
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reuse Form Sheet A1 với prefill name */}
      <Sheet
        open={Boolean(prefillName)}
        onOpenChange={(open) => !open && setPrefillName(null)}
      >
        <SheetContent
          className="sm:max-w-lg p-0 flex flex-col"
          showCloseButton
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Tạo Thuốc Từ Tên Tự Nhập</SheetTitle>
            <SheetDescription>
              Bổ sung thuốc bác sĩ đã tự nhập vào danh mục chuẩn để dùng lại
              cho các đơn thuốc sau. Vui lòng điền mã, dạng và đơn vị.
            </SheetDescription>
          </SheetHeader>
          <AdminMedicineFormSheet
            mode="create"
            initialData={null}
            prefillName={prefillName}
            onSuccess={() => setPrefillName(null)}
            onCancel={() => setPrefillName(null)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
