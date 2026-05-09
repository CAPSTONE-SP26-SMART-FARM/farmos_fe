import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDoctorRequestDetail } from "@/queries/useDoctor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { DoctorRequestWithProfileResType } from "@/schemaValidatation/doctorProfile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { statusIcon } from "@/constants/registrationStatusIcon";

interface Props {
  id?: string;
  setId: (id: string | undefined) => void;
  onSubmitSuccess?: () => void;
}

const DetailRequest = ({ id, setId }: Props) => {
  const detailRequest = useDoctorRequestDetail(id!, Boolean(id));
  const request: DoctorRequestWithProfileResType | undefined =
    detailRequest.data?.data;

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const reset = () => {
    setId(undefined);
  };
  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) {
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request details</DialogTitle>
          <DialogDescription>
            View your doctor registration request and linked doctor profile.
          </DialogDescription>
        </DialogHeader>

        {detailRequest.isLoading ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        ) : detailRequest.isError ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Failed to load</CardTitle>
              <CardDescription>
                Please try again, or reopen this dialog.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : !request ? (
          <Card>
            <CardHeader>
              <CardTitle>No data</CardTitle>
              <CardDescription>Request was not found.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>Request</span>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background text-foreground"
                          aria-label={`Status: ${request.registrationStatus}`}
                        >
                          {(() => {
                            const Icon = statusIcon[request.registrationStatus];
                            return <Icon className="h-4 w-4" />;
                          })()}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        sideOffset={6}
                      >
                        Status:{" "}
                        <span className="font-medium capitalize">
                          {request.registrationStatus}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Title</div>
                    <div className="font-medium">{request.title}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium capitalize">
                      {request.registrationStatus}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-muted-foreground">Description</div>
                  <div className="whitespace-pre-wrap">
                    {request.description}
                  </div>
                </div>

                {request.reason ? (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Reason</div>
                    <div className="whitespace-pre-wrap">{request.reason}</div>
                  </div>
                ) : null}
                <Separator />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hồ sơ Bác sĩ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Loại Bác sĩ</div>
                    <div className="font-medium capitalize">
                      {request.doctorProfile.doctorType}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Specialization</div>
                    <div className="font-medium">
                      {request.doctorProfile.specialization}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">License number</div>
                    <div className="font-medium">
                      {request.doctorProfile.licenseNumber}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">License expiry</div>
                    <div className="font-medium">
                      {request.doctorProfile.licenseExpiryDate}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">
                      Years of experience
                    </div>
                    <div className="font-medium">
                      {request.doctorProfile.yearsOfExperience ?? "—"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Approved at</div>
                    <div className="font-medium">
                      {formatDateTime(request.doctorProfile.approvedAt)}
                    </div>
                  </div>
                </div>

                {request.doctorProfile.bio ? (
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Bio</div>
                    <div className="whitespace-pre-wrap">
                      {request.doctorProfile.bio}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetailRequest;
