import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import AdminTicketCategoryFormPanel from "./AdminTicketCategoryFormPanel";
import AdminTicketCategoryListSection from "./AdminTicketCategoryListSection";
import type { TicketCategoryType } from "@/schemaValidatation/ticketCategory";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "detail"; category: TicketCategoryType };

export default function AdminTicketCategoriesPage() {
  const [state, setState] = useState<DialogState>({ mode: "closed" });
  const close = () => setState({ mode: "closed" });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-2">
          <Badge className="mb-2">Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Danh Mục Ticket
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Quản lý danh mục dịch vụ ticket — đơn giá, hoa hồng và quyền truy
            cập (gói đăng ký / mua lẻ).
          </p>
        </div>
      </section>

      <AdminTicketCategoryListSection
        onCreate={() => setState({ mode: "create" })}
        onViewDetail={(category) => setState({ mode: "detail", category })}
        onEdit={(category) => setState({ mode: "detail", category })}
      />

      <Dialog
        open={state.mode !== "closed"}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {state.mode === "create"
                ? "Tạo danh mục ticket"
                : "Chi tiết danh mục ticket"}
            </DialogTitle>
            <DialogDescription>
              {state.mode === "create"
                ? "Định nghĩa loại dịch vụ ticket, đơn giá và tỷ lệ hoa hồng mặc định."
                : "Xem và chỉnh sửa thông tin danh mục. Mã và tiền tệ không thể thay đổi."}
            </DialogDescription>
          </DialogHeader>
          {state.mode === "create" && (
            <AdminTicketCategoryFormPanel onBack={close} />
          )}
          {state.mode === "detail" && (
            <AdminTicketCategoryFormPanel
              category={state.category}
              onBack={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
