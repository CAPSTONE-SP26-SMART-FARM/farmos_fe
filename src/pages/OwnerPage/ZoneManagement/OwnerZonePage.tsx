import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import type { ZoneType } from "@/schemaValidatation/zone";
import { Building2, Layers, Sprout, Beef, MapPin } from "lucide-react";
import { useState } from "react";
import AssignBulkManagerPanel from "./components/AssignBulkManagerPanel";
import AssignManagerPanel from "./components/AssignManagerPanel";
import CreateZonePanel from "./components/CreateZonePanel";
import EditZonePanel from "./components/EditZonePanel";
import ZoneDetailPanel from "./components/ZoneDetailPanel";
import ZoneListSection from "./components/ZoneListSection";

const ZONE_SUMMARY_CARDS = [
  { title: "Total Zones", value: "--", icon: Layers },
  { title: "Cultivation", value: "--", icon: Sprout },
  { title: "Livestock", value: "--", icon: Beef },
  { title: "Total Area", value: "--", icon: MapPin },
] as const;

function OwnerZonePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [viewingZone, setViewingZone] = useState<ZoneType | null>(null);
  const [editingZone, setEditingZone] = useState<ZoneType | null>(null);
  const [assigningZone, setAssigningZone] = useState<ZoneType | null>(null);
  const [bulkAssigningZone, setBulkAssigningZone] = useState<ZoneType | null>(
    null,
  );

  const { data, isLoading, isError } = useOwnerGetMyFarm();
  const farm = data?.data;

  if (showCreate && farm) {
    return (
      <CreateZonePanel
        farmCode={farm.code}
        farmId={farm.id}
        onBack={() => setShowCreate(false)}
      />
    );
  }

  if (assigningZone && farm) {
    return (
      <AssignManagerPanel
        zoneId={assigningZone.id}
        farmId={farm.id}
        zoneName={assigningZone.name}
        onBack={() => {
          const zone = assigningZone;
          setAssigningZone(null);
          setViewingZone(zone);
        }}
      />
    );
  }

  if (bulkAssigningZone && farm) {
    return (
      <AssignBulkManagerPanel
        zoneId={bulkAssigningZone.id}
        farmId={farm.id}
        zoneName={bulkAssigningZone.name}
        onBack={() => {
          const zone = bulkAssigningZone;
          setBulkAssigningZone(null);
          setViewingZone(zone);
        }}
      />
    );
  }

  if (viewingZone && farm) {
    return (
      <ZoneDetailPanel
        zone={viewingZone}
        onBack={() => setViewingZone(null)}
        onEdit={(zone) => {
          setViewingZone(null);
          setEditingZone(zone);
        }}
        onAssignManager={(zone) => {
          setViewingZone(null);
          setAssigningZone(zone);
        }}
        onAssignBulk={(zone) => {
          setViewingZone(null);
          setBulkAssigningZone(zone);
        }}
      />
    );
  }

  if (editingZone && farm) {
    return (
      <EditZonePanel
        zone={editingZone}
        farmId={farm.id}
        onBack={() => setEditingZone(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Owner Portal</Badge>
          <h1 className="text-2xl font-bold">Zone Management</h1>
          <p className="text-muted-foreground">
            Create and manage zones within your farm.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ZONE_SUMMARY_CARDS.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <card.icon className="h-3.5 w-3.5" />
                {card.title}
              </CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                UI placeholder for zone metrics.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-10 w-full"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : isError || !farm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No farm found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You need to create a farm first before managing zones. Go to Farm
              Management to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ZoneListSection
          farmId={farm.id}
          onCreateZone={() => setShowCreate(true)}
          onViewZone={(zone) => setViewingZone(zone)}
          onEditZone={(zone) => setEditingZone(zone)}
        />
      )}
    </div>
  );
}

export default OwnerZonePage;
