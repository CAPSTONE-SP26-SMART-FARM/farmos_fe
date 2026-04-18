import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAdminFarmDetail } from "@/queries/useAdmin";

interface FarmDetailDialogProps {
  id: string | undefined;
  onClose: () => void;
}

const FarmDetailDialog = ({ id, onClose }: FarmDetailDialogProps) => {
  const detailQuery = useAdminFarmDetail(id!, !!id);
  const farm = id ? detailQuery.data?.data : undefined;

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Farm Detail</DialogTitle>
          <DialogDescription>
            View farm information and owner details.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          </div>
        ) : !farm ? (
          <Card>
            <CardHeader>
              <CardTitle>No data</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Farm Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Code</div>
                    <div className="font-medium">{farm.code}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-medium">{farm.name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Type</div>
                    <div className="font-medium capitalize">
                      {farm.farmType}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Address</div>
                    <div className="font-medium">{farm.address ?? "—"}</div>
                  </div>
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
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Latitude</div>
                    <div className="font-medium">{farm.latitude ?? "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Longitude</div>
                    <div className="font-medium">{farm.longitude ?? "—"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Area (sqm)</div>
                    <div className="font-medium">{farm.areaSqm ?? "—"}</div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Created</div>
                    <div className="font-medium">
                      {new Date(farm.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Updated</div>
                    <div className="font-medium">
                      {new Date(farm.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{farm.owner.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Full Name</div>
                  <div className="font-medium">
                    {farm.owner.fullName ?? "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{farm.owner.phone ?? "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Role</div>
                  <div className="font-medium capitalize">
                    {farm.owner.role}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-medium">
                    {farm.owner.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FarmDetailDialog;
