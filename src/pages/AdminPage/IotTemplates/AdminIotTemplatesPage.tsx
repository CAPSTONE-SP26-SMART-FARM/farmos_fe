import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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

function AdminIotTemplatesPage() {
  const [state, setState] = useState<ViewState>({ view: "list" });
  const [activeTab, setActiveTab] = useState<TabKey>("device");

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Admin Portal</Badge>
          <h1 className="text-2xl font-bold">IoT Templates</h1>
          <p className="text-muted-foreground">
            Quản lý template thiết bị IoT và cảm biến cho hệ thống nông trại.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "device" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("device")}
        >
          Thiết bị IoT
        </Button>
        <Button
          variant={activeTab === "sensor" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("sensor")}
        >
          Cảm biến
        </Button>
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
