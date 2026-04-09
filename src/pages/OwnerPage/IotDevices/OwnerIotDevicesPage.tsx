import { useState } from "react";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { Loader2 } from "lucide-react";
import IotDeviceList from "./IotDeviceList";
import IotDeviceDetail from "./IotDeviceDetail";
import IotDeviceForm from "./IotDeviceForm";

// ── Navigation state ───────────────────────────────────────────────────

type NavState =
  | { level: 1 }
  | { level: 2; device: IotDeviceResType }
  | { level: 3 }
  | { level: 4; device: IotDeviceResType };

// L1 = device list, L2 = device detail, L3 = batch create, L4 = edit

export default function OwnerIotDevicesPage() {
  const [nav, setNav] = useState<NavState>({ level: 1 });
  const farmQuery = useOwnerGetMyFarm();
  const farm = farmQuery.data?.data;

  if (farmQuery.isLoading || !farm) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const farmId = farm.id;

  // Level 4 – edit single device
  if (nav.level === 4) {
    return (
      <IotDeviceForm
        farmId={farmId}
        device={nav.device}
        onBack={() => setNav({ level: 1 })}
      />
    );
  }

  // Level 3 – batch create
  if (nav.level === 3) {
    return (
      <IotDeviceForm
        farmId={farmId}
        onBack={() => setNav({ level: 1 })}
      />
    );
  }

  // Level 2 – device detail
  if (nav.level === 2) {
    return (
      <IotDeviceDetail
        deviceId={nav.device.id}
        farmId={farmId}
        onBack={() => setNav({ level: 1 })}
        onEdit={(device) => setNav({ level: 4, device })}
      />
    );
  }

  // Level 1 – device list
  return (
    <IotDeviceList
      farmId={farmId}
      farmName={farm.name}
      onCreate={() => setNav({ level: 3 })}
      onDetail={(device) => setNav({ level: 2, device })}
      onEdit={(device) => setNav({ level: 4, device })}
      onBack={() => setNav({ level: 1 })}
    />
  );
}
