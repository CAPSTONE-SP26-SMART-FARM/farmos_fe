import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useOwnerListFarmMembers } from "@/queries/useOwner";
import { useOwnerAssignBulkManagers } from "@/queries/useZone";
import { isApiErrorResponse } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  Loader2,
  Search,
  UserCog,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  zoneId: string;
  farmId: string;
  zoneName: string;
  onBack: () => void;
}

export default function AssignBulkManagerPanel({
  zoneId,
  farmId,
  zoneName,
  onBack,
}: Props) {
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      page: 1,
      limit: 100,
      role: "manager",
      farmId,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    });

  const managers = membersData?.data.data ?? [];

  const bulkMutation = useOwnerAssignBulkManagers(zoneId);

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === managers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(managers.map((m) => m.user.id)));
    }
  };

  const handleAssignBulk = () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one manager.");
      return;
    }
    bulkMutation.mutate(
      { managerIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          toast.success(
            `${selectedIds.size} manager${selectedIds.size > 1 ? "s" : ""} assigned successfully.`,
          );
          handleBack();
        },
        onError: (error) => {
          if (isApiErrorResponse(error)) {
            toast.error(
              error.response?.data.message ?? "Failed to assign managers.",
            );
          } else {
            toast.error("An unexpected error occurred.");
          }
        },
      },
    );
  };

  const allSelected =
    managers.length > 0 && selectedIds.size === managers.length;

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
          <Badge className="mb-1">Bulk Assign</Badge>
          <h1 className="text-2xl font-bold">Assign Managers to {zoneName}</h1>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Managers
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search managers..."
                className="pl-8 w-56"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                Add managers to your farm in the Employee Management section
                first.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Button
                        variant={allSelected ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={toggleAll}
                      >
                        {allSelected && <Check className="h-3 w-3" />}
                      </Button>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((m) => {
                    const isSelected = selectedIds.has(m.user.id);
                    return (
                      <TableRow
                        key={m.user.id}
                        className={`cursor-pointer ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                        onClick={() => toggleSelect(m.user.id)}
                      >
                        <TableCell>
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(m.user.id);
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {m.user.fullName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.user.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.user.phone ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {selectedIds.size > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size} manager
                  {selectedIds.size > 1 ? "s" : ""} selected
                </p>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Bulk-assigned managers are added as regular members (not primary).
            Already assigned managers are automatically skipped.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignBulk}
              disabled={selectedIds.size === 0 || bulkMutation.isPending}
              className="gap-1.5"
            >
              {bulkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Assign {selectedIds.size > 0 ? selectedIds.size : ""} Manager
                  {selectedIds.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
