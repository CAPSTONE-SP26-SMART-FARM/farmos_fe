import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import AdminCommissionRuleFormPanel from "./AdminCommissionRuleFormPanel";
import AdminCommissionRuleListSection from "./AdminCommissionRuleListSection";
import type { CommissionRuleType } from "@/schemaValidatation/commissionRule";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "detail"; rule: CommissionRuleType };

export default function AdminCommissionRulesPage() {
  const [state, setState] = useState<DialogState>({ mode: "closed" });
  const close = () => setState({ mode: "closed" });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge className="mb-2">Cổng quản trị</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Quy Tắc Hoa Hồng
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Mapping % hoa hồng theo phạm vi áp dụng. Độ ưu tiên: Bác sĩ cụ thể
              → Cấp bậc → Mặc định danh mục.
            </p>
          </div>
          <Button onClick={() => setState({ mode: "create" })}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm quy tắc
          </Button>
        </div>
      </section>

      <AdminCommissionRuleListSection
        onViewDetail={(rule) => setState({ mode: "detail", rule })}
        onEdit={(rule) => setState({ mode: "detail", rule })}
      />

      <Dialog
        open={state.mode !== "closed"}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {state.mode === "create"
                ? "Thêm quy tắc hoa hồng"
                : "Chi tiết quy tắc hoa hồng"}
            </DialogTitle>
            <DialogDescription>
              {state.mode === "create"
                ? "Định nghĩa % hoa hồng bác sĩ nhận theo phạm vi (danh mục / cấp bậc / cá nhân)."
                : "Xem và chỉnh sửa quy tắc. Phạm vi không thể thay đổi sau khi tạo."}
            </DialogDescription>
          </DialogHeader>
          {state.mode === "create" && (
            <AdminCommissionRuleFormPanel onBack={close} />
          )}
          {state.mode === "detail" && (
            <AdminCommissionRuleFormPanel rule={state.rule} onBack={close} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
