import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAdminFarmDetail } from "@/queries/useAdmin";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

interface FarmDetailPanelProps {
  id: string;
  onBack: () => void;
}

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="space-y-1">
    <div className="text-muted-foreground">{label}</div>
    <div className="font-medium">{value ?? "—"}</div>
  </div>
);

const DetailSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2">
    {[0, 1].map((i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const FarmDetailPanel = ({ id, onBack }: FarmDetailPanelProps) => {
  const [show, setShow] = useState(false);
  const detailQuery = useAdminFarmDetail(id, true);
  const farm = detailQuery.data?.data;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Farm List
          </Button>
          <h2 className="text-2xl font-bold">Farm Detail</h2>
          <p className="text-muted-foreground">
            View farm information and owner details.
          </p>
        </div>

        {detailQuery.isLoading ? (
          <DetailSkeleton />
        ) : !farm ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className="text-lg font-semibold mb-1">No data found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The requested farm could not be loaded.
              </p>
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Farm Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Code"
                    value={farm.code}
                  />
                  <InfoRow
                    label="Name"
                    value={farm.name}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Type</div>
                    <div className="font-medium capitalize">
                      {farm.farmType}
                    </div>
                  </div>
                  <InfoRow
                    label="Address"
                    value={farm.address}
                  />
                </div>

                {farm.description && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Description</div>
                    <div className="whitespace-pre-wrap">
                      {farm.description}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Latitude"
                    value={farm.latitude}
                  />
                  <InfoRow
                    label="Longitude"
                    value={farm.longitude}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Area (hectares)"
                    value={farm.areaHectares}
                  />
                  <InfoRow
                    label="Area (sqm)"
                    value={farm.areaSqm}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Created"
                    value={new Date(farm.createdAt).toLocaleString()}
                  />
                  <InfoRow
                    label="Updated"
                    value={new Date(farm.updatedAt).toLocaleString()}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Owner Information</CardTitle>
                  <Badge
                    variant={farm.owner.isActive ? "default" : "secondary"}
                  >
                    {farm.owner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow
                  label="Email"
                  value={farm.owner.email}
                />
                <InfoRow
                  label="Full Name"
                  value={farm.owner.fullName}
                />
                <InfoRow
                  label="Phone"
                  value={farm.owner.phone}
                />
                <div className="space-y-1">
                  <div className="text-muted-foreground">Role</div>
                  <div className="font-medium capitalize">
                    {farm.owner.role}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmDetailPanel;
