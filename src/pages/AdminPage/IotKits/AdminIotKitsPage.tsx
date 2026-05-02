import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import AdminIotKitListSection from "./AdminIotKitListSection";
import AdminIotKitFormPanel from "./AdminIotKitFormPanel";
import type { IotDeviceKitResType } from "@/schemaValidatation/iotKit";

type PanelState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; kit: IotDeviceKitResType };

export default function AdminIotKitsPage() {
  const [panel, setPanel] = useState<PanelState>({ mode: "list" });

  if (panel.mode !== "list") {
    return (
      <AdminIotKitFormPanel
        kit={panel.mode === "edit" ? panel.kit : undefined}
        onBack={() => setPanel({ mode: "list" })}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge className="mb-2">Cổng quản trị</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Bộ Kit IoT
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Quản lý danh mục bộ Kit IoT bán lẻ. Mỗi bộ gồm 1 board chính + module
              truyền dẫn + 4 cảm biến cố định.
            </p>
          </div>
          <Button onClick={() => setPanel({ mode: "create" })}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo bộ Kit
          </Button>
        </div>
      </section>

      <AdminIotKitListSection
        onEdit={(kit) => setPanel({ mode: "edit", kit })}
      />
    </div>
  );
}
