import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Separator } from "@/components/ui/separator";
import { useOwnerGetZoneDetail, useOwnerListZones } from "@/queries/useZone";
import type { FarmResType } from "@/schemaValidatation/farmManagement";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Eye,
  FileText,
  Map as MapIcon,
  Pencil,
  Plus,
  Ruler,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import ZoneManagersSection from "./ZoneManagersSection";
import AssignManagerDialog from "./AssignManagerDialog";
import ZoneFormDialog from "./ZoneFormDialog";

const ZONE_TYPE_LABELS: Record<string, string> = {
  cultivation: "Canh tác",
};

interface Props {
  farm: FarmResType;
}

export default function ZonesPane({ farm }: Props) {
  const [searchParams] = useSearchParams();
  const zoneIdParam = searchParams.get("zoneId");

  if (zoneIdParam) {
    return (
      <ZoneInlineDetail
        farm={farm}
        zoneId={zoneIdParam}
      />
    );
  }
  return <ZonesTable farm={farm} />;
}

// ─────────────────────────────────────────────────────────────────────
// Table view
// ─────────────────────────────────────────────────────────────────────
function ZonesTable({ farm }: { farm: FarmResType }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? "",
  );
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = 10;

  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const query = {
    page,
    limit,
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isError } = useOwnerListZones(farm.id, query);
  const zones = data?.data.data ?? [];
  const meta = data?.data.meta;
  const hasFilter = Boolean(search);

  const applySearch = () => {
    const next = new URLSearchParams(searchParams);
    const q = searchInput.trim();
    if (q) next.set("search", q);
    else next.delete("search");
    next.delete("page");
    setSearchParams(next);
  };

  const setZoneId = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("zoneId", id);
    setSearchParams(next);
  };

  const goPrev = () => {
    const next = new URLSearchParams(searchParams);
    const prev = Math.max(1, page - 1);
    if (prev <= 1) next.delete("page");
    else next.set("page", String(prev));
    setSearchParams(next);
  };

  const goNext = () => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page + 1));
    setSearchParams(next);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-medium">Tìm kiếm khu vực</p>
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nhập tên khu vực"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applySearch();
                  }
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={applySearch}
              >
                Tìm
              </Button>
              <Button
                onClick={() => setCreateOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Tạo khu vực
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách khu vực</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Không thể tải danh sách khu vực. Vui lòng thử lại.
              </p>
            </div>
          ) : !isLoading && zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Sprout className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {hasFilter ? "Không có kết quả phù hợp" : "Chưa có khu vực nào"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {hasFilter
                  ? "Thử đổi từ khoá tìm kiếm hoặc xoá bộ lọc."
                  : "Tạo khu vực đầu tiên để bắt đầu quản lý mùa vụ."}
              </p>
            </div>
          ) : (
            <>
              <DataTable
                columns={
                  [
                    {
                      accessorKey: "name",
                      header: "Tên khu vực",
                      cell: ({ row }) => (
                        <span className="font-medium">{row.original.name}</span>
                      ),
                    },
                    {
                      accessorKey: "zoneType",
                      header: "Loại",
                      cell: ({ row }) => (
                        <Badge variant="secondary">
                          {ZONE_TYPE_LABELS[row.original.zoneType] ??
                            row.original.zoneType}
                        </Badge>
                      ),
                    },
                    {
                      accessorKey: "areaSqm",
                      header: "Diện tích",
                      cell: ({ row }) =>
                        row.original.areaSqm != null
                          ? `${row.original.areaSqm} m²`
                          : "—",
                    },
                    {
                      accessorKey: "updatedAt",
                      header: "Cập nhật",
                      cell: ({ row }) => (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(row.original.updatedAt), "dd/MM/yyyy")}
                        </span>
                      ),
                    },
                  ] as ColumnDef<(typeof zones)[number]>[]
                }
                data={zones}
                isLoading={isLoading}
                actions={[
                  {
                    key: "view",
                    label: "Chi tiết và phân công quản lý",
                    icon: Eye,
                    onSelect: (zone) => setZoneId(zone.id),
                  },
                  {
                    key: "crop-seasons",
                    label: "Mùa vụ",
                    icon: Sprout,
                    onSelect: (zone) =>
                      navigate(
                        `/dashboard/owner/crop-seasons?zoneId=${zone.id}`,
                      ),
                  },
                ]}
                onRowClick={(zone) => setZoneId(zone.id)}
                emptyText="Chưa có khu vực nào."
              />

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {meta.page} / {meta.totalPages} • {meta.totalItems}{" "}
                    khu vực
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasPreviousPage}
                      onClick={goPrev}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasNextPage}
                      onClick={goNext}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ZoneFormDialog
        mode="create"
        farmCode={farm.code}
        farmId={farm.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Inline detail view
// ─────────────────────────────────────────────────────────────────────
function ZoneInlineDetail({
  farm,
  zoneId,
}: {
  farm: FarmResType;
  zoneId: string;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useOwnerGetZoneDetail(zoneId);
  const detail = data?.data;

  const [editOpen, setEditOpen] = useState(false);
  const [assignSingleOpen, setAssignSingleOpen] = useState(false);

  const handleBack = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("zoneId");
    setSearchParams(next, { replace: true });
  };

  if (isLoading || !detail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const zoneTypeLabel = ZONE_TYPE_LABELS[detail.zoneType] ?? detail.zoneType;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Khu vực</p>
            <h2 className="text-xl font-bold leading-tight">{detail.name}</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() =>
              navigate(`/dashboard/owner/crop-seasons?zoneId=${detail.id}`)
            }
          >
            <Sprout className="h-4 w-4" />
            Xem mùa vụ
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setEditOpen(true)}
            className="gap-1.5"
          >
            <Pencil className="h-4 w-4" />
            Sửa khu vực
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-muted p-2">
              <MapIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{detail.name}</CardTitle>
              <Badge
                variant="secondary"
                className="capitalize mt-1"
              >
                {zoneTypeLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoCell
              icon={<Ruler className="h-3 w-3" />}
              label="Diện tích"
              value={
                detail.areaSqm != null
                  ? `${detail.areaSqm.toLocaleString()} m²`
                  : "—"
              }
            />
            <InfoCell
              icon={<Calendar className="h-3 w-3" />}
              label="Ngày tạo"
              value={format(new Date(detail.createdAt), "dd/MM/yyyy HH:mm")}
            />
            <InfoCell
              icon={<Calendar className="h-3 w-3" />}
              label="Cập nhật cuối"
              value={format(new Date(detail.updatedAt), "dd/MM/yyyy HH:mm")}
            />
            <InfoCell
              icon={<Sprout className="h-3 w-3" />}
              label="Loại khu vực"
              value={<span className="capitalize">{zoneTypeLabel}</span>}
            />
          </div>

          {detail.description && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Mô tả
                </p>
                <p className="text-sm leading-relaxed">{detail.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ZoneManagersSection
        zoneId={detail.id}
        onAssignSingle={() => setAssignSingleOpen(true)}
      />

      <ZoneFormDialog
        mode="update"
        zone={detail}
        farmId={farm.id}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <AssignManagerDialog
        mode="single"
        zoneId={detail.id}
        zoneName={detail.name}
        open={assignSingleOpen}
        onOpenChange={setAssignSingleOpen}
      />
    </div>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 rounded-md p-3 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}
