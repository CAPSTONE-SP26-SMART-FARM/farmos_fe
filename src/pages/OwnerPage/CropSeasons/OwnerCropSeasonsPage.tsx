import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
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

function getNavFromSearchParams(searchParams: URLSearchParams): NavState {
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";
  const zoneName = searchParams.get("zoneName")?.trim() ?? "";
  const cropSeasonId = searchParams.get("cropSeasonId")?.trim() ?? "";
  const requestId = searchParams.get("requestId")?.trim() ?? "";

  if (zoneId && zoneName && cropSeasonId && requestId) {
    return { level: 4, zoneId, zoneName, cropSeasonId, requestId };
  }

  if (zoneId && zoneName && cropSeasonId) {
    return { level: 3, zoneId, zoneName, cropSeasonId };
  }

  if (zoneId && zoneName) {
    return { level: 2, zoneId, zoneName };
  }

  return { level: 1 };
}

export default function OwnerCropSeasonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [nav, setNav] = useState<NavState>(() =>
    getNavFromSearchParams(searchParams),
  );

  useEffect(() => {
    const next = new URLSearchParams();

    switch (nav.level) {
      case 4:
        next.set("zoneId", nav.zoneId);
        next.set("zoneName", nav.zoneName);
        next.set("cropSeasonId", nav.cropSeasonId);
        next.set("requestId", nav.requestId);
        break;
      case 3:
        next.set("zoneId", nav.zoneId);
        next.set("zoneName", nav.zoneName);
        next.set("cropSeasonId", nav.cropSeasonId);
        break;
      case 2:
        next.set("zoneId", nav.zoneId);
        next.set("zoneName", nav.zoneName);
        break;
      default:
        break;
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [nav, searchParams, setSearchParams]);

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
