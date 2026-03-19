import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useDebounce from "@/hooks/useDebounce";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useOwnerListZoneManagers,
  useOwnerRemoveZoneManager,
  useOwnerUpdatePrimaryManager,
} from "@/queries/useZone";
import type { ZoneManagerWithUserResType } from "@/schemaValidatation/zoneMember";
import { format } from "date-fns";
import {
  Crown,
  Loader2,
  MoreVertical,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  zoneId: string;
  onAssignSingle: () => void;
  onAssignBulk: () => void;
}

export default function ZoneManagersSection({
  zoneId,
  onAssignSingle,
  onAssignBulk,
}: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(search, 500);

  const query = {
    page,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading, isError } = useOwnerListZoneManagers(zoneId, query);
  const managers = data?.data.data ?? [];
  const meta = data?.data.meta;

  const removeMutation = useOwnerRemoveZoneManager(zoneId);
  const primaryMutation = useOwnerUpdatePrimaryManager(zoneId);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (isApiErrorResponse(error)) {
      return error.response?.data.message ?? fallback;
    }
    return fallback;
  };

  const handleRemove = (manager: ZoneManagerWithUserResType) => {
    if (manager.isPrimary) {
      toast.error(
        "Cannot remove the primary manager. Transfer primary role first.",
      );
      return;
    }
    removeMutation.mutate(manager.managerId, {
      onSuccess: () => toast.success("Manager removed from zone."),
      onError: (error) =>
        toast.error(getErrorMessage(error, "Failed to remove manager.")),
    });
  };

  const handleSetPrimary = (manager: ZoneManagerWithUserResType) => {
    if (manager.isPrimary) return;
    primaryMutation.mutate(
      { managerId: manager.managerId, isPrimary: true },
      {
        onSuccess: () => toast.success("Primary manager updated."),
        onError: (error) =>
          toast.error(
            getErrorMessage(error, "Failed to update primary manager."),
          ),
      },
    );
  };

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assigned Managers
          </h3>
          <p className="text-sm text-muted-foreground">
            Managers responsible for this zone.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              className="pl-8 w-52"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="outline"
            onClick={onAssignBulk}
            className="gap-1.5"
          >
            <Users className="h-4 w-4" />
            Bulk Assign
          </Button>
          <Button
            onClick={onAssignSingle}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Assign
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="w-12.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : isError ? (
          <CardContent className="flex items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load managers. Please try again.
            </p>
          </CardContent>
        ) : managers.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No managers assigned</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Assign managers to this zone so they can oversee operations.
            </p>
            <Button
              onClick={onAssignSingle}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Assign First Manager
            </Button>
          </CardContent>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {m.isPrimary && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{m.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.user.status === "ACTIVE" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {m.user.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {m.isPrimary ? (
                          <Badge className="gap-1">
                            <Crown className="h-3 w-3" />
                            Primary
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Member</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(m.assignedAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!m.isPrimary && (
                            <DropdownMenuItem
                              disabled={primaryMutation.isPending}
                              onClick={() => handleSetPrimary(m)}
                            >
                              {primaryMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Crown className="h-4 w-4 mr-2" />
                              )}
                              Set Primary
                            </DropdownMenuItem>
                          )}
                          {!m.isPrimary && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={removeMutation.isPending}
                              onClick={() => handleRemove(m)}
                            >
                              {removeMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Remove
                            </DropdownMenuItem>
                          )}
                          {m.isPrimary && (
                            <DropdownMenuItem disabled>
                              <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                              Primary — cannot remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages} &bull; {meta.totalItems}{" "}
                  manager{meta.totalItems !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
