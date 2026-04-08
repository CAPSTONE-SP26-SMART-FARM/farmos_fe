import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronRight, Cpu, Radar } from "lucide-react";
import type {
  IotDeviceTemplateResType,
  SensorTemplateResType,
} from "@/schemaValidatation/iotTemplate";
import DeviceTemplateList from "./DeviceTemplateList";
import DeviceTemplateForm from "./DeviceTemplateForm";
import SensorTemplateList from "./SensorTemplateList";
import SensorTemplateForm from "./SensorTemplateForm";

type ViewState =
  | { view: "list" }
  | { view: "device-create" }
  | { view: "device-edit"; template: IotDeviceTemplateResType }
  | { view: "sensor-create" }
  | { view: "sensor-edit"; template: SensorTemplateResType };

type TabKey = "device" | "sensor";

const TAB_META: Record<
  TabKey,
  { title: string; description: string; icon: typeof Cpu }
> = {
  device: {
    title: "Thiết bị IoT",
    description: "Board, WiFi, LoRa modules",
    icon: Cpu,
  },
  sensor: {
    title: "Cảm biến",
    description: "Ngưỡng đo và cấu hình cảnh báo",
    icon: Radar,
  },
};

function AdminIotTemplatesPage() {
  const [state, setState] = useState<ViewState>({ view: "list" });
  const [activeTab, setActiveTab] = useState<TabKey>("device");
  const activeMeta = TAB_META[activeTab];

  // Form views
  if (state.view === "device-create") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <DeviceTemplateForm onBack={() => setState({ view: "list" })} />
      </div>
    );
  }
  if (state.view === "device-edit") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <DeviceTemplateForm
          template={state.template}
          onBack={() => setState({ view: "list" })}
        />
      </div>
    );
  }
  if (state.view === "sensor-create") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SensorTemplateForm onBack={() => setState({ view: "list" })} />
      </div>
    );
  }
  if (state.view === "sensor-edit") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <SensorTemplateForm
          template={state.template}
          onBack={() => setState({ view: "list" })}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-muted/20" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-2">Admin Portal</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              IoT Template Studio
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Quản lý vòng đời template thiết bị và cảm biến, chuẩn hóa cấu hình
              cho toàn bộ hệ thống nông trại.
            </p>
          </div>

          <div className="rounded-xl border bg-background/80 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Nhóm đang xem
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium">
              <activeMeta.icon className="h-4 w-4 text-primary" />
              {activeMeta.title}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronRight className="h-3 w-3" />
              {activeMeta.description}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-2 md:grid-cols-2">
        {(Object.keys(TAB_META) as TabKey[]).map((key) => {
          const meta = TAB_META[key];
          const Icon = meta.icon;
          const isActive = activeTab === key;
          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              className={`h-auto justify-start rounded-xl px-4 py-3 text-left ${
                isActive
                  ? "border-primary shadow-sm"
                  : "border-border/70 hover:border-primary/40"
              }`}
              onClick={() => setActiveTab(key)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    isActive
                      ? "bg-primary-foreground/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold leading-none">{meta.title}</p>
                  <p
                    className={`mt-1 text-xs ${
                      isActive
                        ? "text-primary-foreground/85"
                        : "text-muted-foreground"
                    }`}
                  >
                    {meta.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {activeTab === "device" && (
        <DeviceTemplateList
          onCreate={() => setState({ view: "device-create" })}
          onEdit={(template) => setState({ view: "device-edit", template })}
        />
      )}

      {activeTab === "sensor" && (
        <SensorTemplateList
          onCreate={() => setState({ view: "sensor-create" })}
          onEdit={(template) => setState({ view: "sensor-edit", template })}
        />
      )}
    </div>
  );
}

export default AdminIotTemplatesPage;
