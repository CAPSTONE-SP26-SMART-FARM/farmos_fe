import { useState } from "react";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import IotDeviceList from "./IotDeviceList";
import IotDeviceDetail from "./IotDeviceDetail";

// ── Navigation state ───────────────────────────────────────────────────

type NavState = { level: 1 } | { level: 2; device: IotDeviceResType };

export default function OwnerIotDevicesPage() {
  const [nav, setNav] = useState<NavState>({ level: 1 });

  // Level 2 – device detail
  if (nav.level === 2) {
    return (
      <IotDeviceDetail
        deviceId={nav.device.id}
        farmId=""
        actor="owner"
        onBack={() => setNav({ level: 1 })}
      />
    );
  }

  // Level 1 – device list
  return (
    <IotDeviceList
      farmId=""
      farmName=""
      actor="owner"
      onDetail={(device) => setNav({ level: 2, device })}
    />
  );
}
