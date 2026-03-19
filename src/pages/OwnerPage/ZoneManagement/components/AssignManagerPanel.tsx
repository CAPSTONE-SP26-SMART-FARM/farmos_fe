import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import { useOwnerListFarmMembers } from "@/queries/useOwner";
import { useOwnerAssignManager } from "@/queries/useZone";
import { ArrowLeft, Loader2, Search, UserCog, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  zoneId: string;
  farmId: string;
  zoneName: string;
  onBack: () => void;
}

export default function AssignManagerPanel({
  zoneId,
  farmId,
  zoneName,
  onBack,
}: Props) {
  const [show, setShow] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const { data: membersData, isLoading: membersLoading } =
    useOwnerListFarmMembers({
      page,
      limit,
      role: "manager",
      farmId,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    });

  const managers = membersData?.data.data ?? [];
  const meta = membersData?.data.meta;

  const assignMutation = useOwnerAssignManager(zoneId);

  const handleAssign = () => {
    if (!selectedManagerId) {
      toast.error("Please select a manager.");
      return;
    }
    assignMutation.mutate(
      { managerId: selectedManagerId, isPrimary },
      {
        onSuccess: () => {
          toast.success("Manager assigned to zone successfully.");
          handleBack();
        },
        onError: (error) => {
          if (isApiErrorResponse(error)) {
            toast.error(
              error.response?.data.message ?? "Failed to assign manager.",
            );
          } else {
            toast.error("An unexpected error occurred.");
          }
        },
      },
    );
  };

  const selectedManager = managers.find((m) => m.user.id === selectedManagerId);

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Badge className="mb-1">Assign Manager</Badge>
          <h1 className="text-2xl font-bold">Assign Manager to {zoneName}</h1>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Select a Manager
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                className="pl-8 w-56"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {membersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-12 w-full"
                />
              ))}
            </div>
          ) : managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <UserCog className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                No managers available
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {debouncedSearch
                  ? "No managers match your search. Try a different keyword."
                  : "Add managers to your farm in the Employee Management section first."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((m) => {
                    const isSelected = selectedManagerId === m.user.id;
                    return (
                      <TableRow
                        key={m.user.id}
                        className={`cursor-pointer ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => setSelectedManagerId(m.user.id)}
                      >
                        <TableCell className="font-medium">
                          {m.user.fullName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.user.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.user.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          {isSelected ? (
                            <Badge>Selected</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedManagerId(m.user.id);
                              }}
                            >
                              Select
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages} &bull;{" "}
                    {meta.totalItems} manager
                    {meta.totalItems !== 1 ? "s" : ""}
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

          {/* Primary toggle */}
          {selectedManager && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="primary-select">Primary Manager</Label>
                <Select
                  value={isPrimary ? "yes" : "no"}
                  onValueChange={(v) => setIsPrimary(v === "yes")}
                >
                  <SelectTrigger id="primary-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes — set as primary</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  A zone can only have one primary manager. Setting this will
                  replace the current primary.
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedManagerId || assignMutation.isPending}
              className="gap-1.5"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Assign Manager
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
