import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import type { FarmResType } from "@/schemaValidatation/farmManagement";
import type { ZoneType } from "@/types/zone";
import { Building2, MapPin, Pencil, Plus, Ruler } from "lucide-react";
import { useState } from "react";
import CreateFarmForm from "./CreateFarmForm";
import CreateZonePanel from "./CreateZonePanel";
import EditZonePanel from "./EditZonePanel";
import UpdateFarmForm from "./UpdateFarmForm";
import ZoneListSection from "./ZoneListSection";

const FarmInfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="space-y-1">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="font-medium">{value ?? "—"}</div>
  </div>
);

const FarmDetailCard = ({ farm }: { farm: FarmResType }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {farm.name}
          </CardTitle>
          <CardDescription>Code: {farm.code}</CardDescription>
        </div>
        <Badge className="capitalize">{farm.farmType}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FarmInfoRow
          label="Farm Code"
          value={farm.code}
        />
        <FarmInfoRow
          label="Farm Type"
          value={farm.farmType}
        />
        <FarmInfoRow
          label="Address"
          value={farm.address}
        />
        <FarmInfoRow
          label="Area (hectares)"
          value={farm.areaHectares}
        />
        <FarmInfoRow
          label="Area (sq. meters)"
          value={farm.areaSqm}
        />
        <FarmInfoRow
          label="Created"
          value={new Date(farm.createdAt).toLocaleDateString()}
        />
      </div>
      {farm.description && (
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Description</div>
          <p className="text-sm whitespace-pre-wrap">{farm.description}</p>
        </div>
      )}
    </CardContent>
  </Card>
);

const FarmLoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="space-y-1"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const EmptyFarmState = ({ onCreate }: { onCreate: () => void }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No farm registered yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Create your farm to start managing zones, members, and crop seasons.
      </p>
      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Create Farm
      </Button>
    </CardContent>
  </Card>
);

function FarmManagement() {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneType | null>(null);
  const { data, isLoading, isError } = useOwnerGetMyFarm();
  const farm = data?.data;

  if (showCreate) {
    return <CreateFarmForm onBack={() => setShowCreate(false)} />;
  }

  if (showEdit && farm) {
    return (
      <UpdateFarmForm
        farm={farm}
        onBack={() => setShowEdit(false)}
      />
    );
  }

  if (showCreateZone && farm) {
    return (
      <CreateZonePanel
        farmCode={farm.code}
        farmId={farm.id}
        onBack={() => setShowCreateZone(false)}
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
          <h1 className="text-2xl font-bold">Farm Management</h1>
          <p className="text-muted-foreground">
            View and manage your farm information.
          </p>
        </div>
        {farm && (
          <Button onClick={() => setShowEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Farm
          </Button>
        )}
      </div>

      {isLoading ? (
        <FarmLoadingSkeleton />
      ) : isError || !farm ? (
        <EmptyFarmState onCreate={() => setShowCreate(true)} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Farm Type
                </CardDescription>
                <CardTitle className="text-2xl capitalize">
                  {farm.farmType}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Ruler className="h-4 w-4" />
                  Area
                </CardDescription>
                <CardTitle className="text-2xl">
                  {farm.areaHectares ? `${farm.areaHectares} ha` : "—"}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardDescription>
                <CardTitle className="text-lg truncate">
                  {farm.address ?? "Not set"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <FarmDetailCard farm={farm} />

          <Separator />

          <ZoneListSection
            farmId={farm.id}
            onCreateZone={() => setShowCreateZone(true)}
            onEditZone={(zone) => setEditingZone(zone)}
          />
        </>
      )}
    </div>
  );
}

export default FarmManagement;
