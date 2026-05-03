import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useAdminOwnersWithAvailableKits } from "@/queries/useIotKit";
import { ChevronRight, PackageOpen, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

const PAGE_SIZE = 10;

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminKitAssignmentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
    }),
    [page, debouncedSearch],
  );

  const ownersQuery = useAdminOwnersWithAvailableKits(query);
  const result = ownersQuery.data?.data;
  const items = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader className="gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PackageOpen className="h-4 w-4 text-primary" />
              Quản lý gán bộ kit IoT
            </CardTitle>
            <CardDescription>
              Danh sách các chủ vườn có đơn kit đã thanh toán còn slot trống và
              vẫn nằm trong hạn mức gói. Bấm vào dòng để xem chi tiết và gán
              thiết bị.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên / email / SĐT"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ownersQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-14 w-full"
                />
              ))}
            </div>
          ) : ownersQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                ownersQuery.error,
                "Không thể tải danh sách.",
              )}
              onRetry={() => ownersQuery.refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có chủ vườn nào đủ điều kiện"
              description="Chỉ những chủ vườn đã mua bộ kit (đơn PAID) còn slot trống và còn quota gói mới hiển thị ở đây."
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[280px]">Chủ vườn</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead className="text-right">Quota gói</TableHead>
                      <TableHead className="text-right">Bộ kit còn slot</TableHead>
                      <TableHead className="text-right">Slot trống</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row) => {
                      const totalRemaining = row.orders.reduce(
                        (acc, o) => acc + o.remainingSlots,
                        0,
                      );
                      const onClick = () =>
                        navigate(
                          `/dashboard/admin/iot-kits/assignments/${row.owner.id}`,
                        );
                      return (
                        <TableRow
                          key={row.owner.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={onClick}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                {row.owner.avatarUrl ? (
                                  <AvatarImage src={row.owner.avatarUrl} />
                                ) : null}
                                <AvatarFallback>
                                  {getInitials(row.owner.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {row.owner.fullName || row.owner.email}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  ID: {row.owner.id.slice(0, 8)}…
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <p className="truncate">{row.owner.email}</p>
                            {row.owner.phone && (
                              <p className="truncate text-xs text-muted-foreground">
                                {row.owner.phone}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <span className="font-semibold">
                              {row.quota.used}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              / {row.quota.effectiveLimit}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              còn {row.quota.remaining}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {row.orders.length} đơn
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-emerald-600">
                            {totalRemaining}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Trang {meta.page}/{meta.totalPages} · {meta.totalItems} chủ
                    vườn
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasPreviousPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Trang trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Trang sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
