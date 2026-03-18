import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { FarmMemberResType } from "@/schemaValidatation/farmMember";
import { format } from "date-fns";
import { Eye, Search, Tractor, UserCog, UserPlus, Users } from "lucide-react";
import { useState } from "react";

interface Props {
  farmId: string;
  onAddMember: () => void;
  onViewMember: (member: FarmMemberResType) => void;
}

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "manager", label: "Manager" },
  { value: "farmer", label: "Farmer" },
] as const;

const RoleIcon = ({ role }: { role: string }) =>
  role === "manager" ? (
    <UserCog className="h-4 w-4 text-blue-600" />
  ) : (
    <Tractor className="h-4 w-4 text-green-600" />
  );

const MemberListSection = ({ farmId, onAddMember, onViewMember }: Props) => {
  const [roleFilter, setRoleFilter] = useState<"all" | "farmer" | "manager">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(search, 500);

  const query = {
    page,
    limit,
    farmId,
    ...(roleFilter !== "all" ? { role: roleFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading, isError } = useOwnerListFarmMembers(query);
  const members = data?.data.data ?? [];
  const meta = data?.data.meta;

  const handleRoleChange = (value: string) => {
    setRoleFilter(value as "all" | "farmer" | "manager");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Employees</h2>
          <p className="text-sm text-muted-foreground">
            View and manage farm employees.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search email or phone..."
              className="pl-8 w-56"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onAddMember}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load employees. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No employees yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Add employees to your farm to help manage daily operations.
            </p>
            <Button
              onClick={onAddMember}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Add First Employee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Farm</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RoleIcon role={member.role} />
                        <div>
                          <p className="font-medium">{member.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="capitalize"
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {member.user.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{member.farm.name}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(member.assignedAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewMember(member)}
                          className="gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages} &bull; {meta.totalItems}{" "}
                employee
                {meta.totalItems !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemberListSection;
