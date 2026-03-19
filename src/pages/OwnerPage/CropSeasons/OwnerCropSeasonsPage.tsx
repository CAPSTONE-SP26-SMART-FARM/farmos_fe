import { useState } from "react";
import ZoneListView from "./components/ZoneListView";
import CropSeasonListPanel from "./components/CropSeasonListPanel";
import CropSeasonDetailPanel from "./components/CropSeasonDetailPanel";
import ProductionRequestDetailPanel from "./components/ProductionRequestDetailPanel";

type NavState =
  | { level: 1 }
  | { level: 2; zoneId: string; zoneName: string }
  | { level: 3; zoneId: string; zoneName: string; cropSeasonId: string }
  | {
      level: 4;
      zoneId: string;
      zoneName: string;
      cropSeasonId: string;
      requestId: string;
    };

export default function OwnerCropSeasonsPage() {
  const [nav, setNav] = useState<NavState>({ level: 1 });

  if (nav.level === 4) {
    return (
      <ProductionRequestDetailPanel
        requestId={nav.requestId}
        onBack={() =>
          setNav({
            level: 3,
            zoneId: nav.zoneId,
            zoneName: nav.zoneName,
            cropSeasonId: nav.cropSeasonId,
          })
        }
      />
    );
  }

  if (nav.level === 3) {
    return (
      <CropSeasonDetailPanel
        cropSeasonId={nav.cropSeasonId}
        zoneName={nav.zoneName}
        onBack={() =>
          setNav({ level: 2, zoneId: nav.zoneId, zoneName: nav.zoneName })
        }
        onViewRequest={(requestId) => setNav({ ...nav, level: 4, requestId })}
      />
    );
  }

  if (nav.level === 2) {
    return (
      <CropSeasonListPanel
        zoneId={nav.zoneId}
        zoneName={nav.zoneName}
        onBack={() => setNav({ level: 1 })}
        onViewDetail={(cropSeasonId) =>
          setNav({
            level: 3,
            zoneId: nav.zoneId,
            zoneName: nav.zoneName,
            cropSeasonId,
          })
        }
      />
    );
  }

  return (
    <ZoneListView
      onSelectZone={(zoneId, zoneName) =>
        setNav({ level: 2, zoneId, zoneName })
      }
    />
  );
}
