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
import AdminIotKitListSection from "./AdminIotKitListSection";
import AdminIotKitFormPanel from "./AdminIotKitFormPanel";
import type { IotDeviceKitResType } from "@/schemaValidatation/iotKit";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "detail"; kit: IotDeviceKitResType };

export default function AdminIotKitsPage() {
  const [state, setState] = useState<DialogState>({ mode: "closed" });
  const close = () => setState({ mode: "closed" });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge className="mb-2">Cổng quản trị</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Quản Lý Gói Kit IoT
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Quản lý danh mục các gói bán lẻ bộ Kit IoT
            </p>
          </div>
          <Button onClick={() => setState({ mode: "create" })}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo gói Iot Kit
          </Button>
        </div>
      </section>

      <AdminIotKitListSection
        onViewDetail={(kit) => setState({ mode: "detail", kit })}
      />

      <Dialog
        open={state.mode !== "closed"}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {state.mode === "create" ? "Tạo gói Iot Kit" : "Chi tiết gói Iot Kit"}
            </DialogTitle>
            <DialogDescription>
              {state.mode === "create"
                ? "Tạo gói bán lẻ bộ Kit IoT mới."
                : "Xem và chỉnh sửa cấu hình gói Kit IoT."}
            </DialogDescription>
          </DialogHeader>
          {state.mode === "create" && <AdminIotKitFormPanel onBack={close} />}
          {state.mode === "detail" && (
            <AdminIotKitFormPanel kit={state.kit} onBack={close} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
