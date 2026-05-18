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
import AdminCropCategoryFormPanel from "./AdminCropCategoryFormPanel";
import AdminCropCategoryListSection from "./AdminCropCategoryListSection";
import type { CropCategoryType } from "@/schemaValidatation/cropCategory";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "detail"; category: CropCategoryType };

export default function AdminCropCategoriesPage() {
  const [state, setState] = useState<DialogState>({ mode: "closed" });
  const close = () => setState({ mode: "closed" });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge className="mb-2">Cổng quản trị</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Loại Cây Trồng
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Quản lý danh sách các loại cây trồng có thể canh tác trên hệ
              thống. Với mỗi loại cây, bạn có thể thiết lập số cây cho phép
              trồng trên một mét vuông đất và thời gian sinh trưởng thông
              thường — hệ thống sẽ dựa vào đây để cảnh báo khi quản lý vùng
              nhập thông số bất hợp lý lúc tạo vụ mùa.
            </p>
          </div>
          <Button onClick={() => setState({ mode: "create" })}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo loại cây
          </Button>
        </div>
      </section>

      <AdminCropCategoryListSection
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
                ? "Tạo loại cây trồng"
                : "Chi tiết loại cây trồng"}
            </DialogTitle>
            <DialogDescription>
              {state.mode === "create"
                ? "Định nghĩa mật độ chuẩn, chu kỳ vụ và các tham số khác."
                : "Xem và chỉnh sửa thông tin loại cây. Mã không thể đổi sau khi tạo."}
            </DialogDescription>
          </DialogHeader>
          {state.mode === "create" && (
            <AdminCropCategoryFormPanel
              key="create"
              onBack={close}
            />
          )}
          {state.mode === "detail" && (
            <AdminCropCategoryFormPanel
              key={state.category.id}
              category={state.category}
              onBack={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
