import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import useDebounce from "@/hooks/useDebounce";
import {
  useAdminListSensorTemplates,
  useAdminDeleteSensorTemplate,
} from "@/queries/useIotTemplate";
import type {
  ListSensorTemplatesQueryType,
  SensorTemplateResType,
} from "@/schemaValidatation/iotTemplate";

const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture_sensor: "Độ ẩm đất",
  light_intensity_sensor: "Cường độ ánh sáng",
  air_humidity_sensor: "Độ ẩm không khí",
  air_temperature_sensor: "Nhiệt độ không khí",
} as const;

interface SensorTemplateListProps {
  onEdit: (template: SensorTemplateResType) => void;
  onCreate: () => void;
}

export default function SensorTemplateList({
  onEdit,
  onCreate,
}: SensorTemplateListProps) {
  const [query, setQuery] = useState<ListSensorTemplatesQueryType>({
    page: 1,
    limit: 8,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
    }),
    [query, debouncedSearch],
  );

  const { data, isLoading } = useAdminListSensorTemplates(effectiveQuery);
  const deleteMutation = useAdminDeleteSensorTemplate();

  const templates = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const activeCount = templates.filter(
    (t) => t.isActive && !t.deletedAt,
  ).length;
  const inactiveCount = templates.filter(
    (t) => !t.isActive && !t.deletedAt,
  ).length;
  const avgVersion =
    templates.length > 0
      ? (
          templates.reduce((sum, t) => sum + t.version, 0) / templates.length
        ).toFixed(1)
      : "0.0";

  return (
    <>
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Template cảm biến</CardTitle>
              <CardDescription className="mt-1">
                Quản lý template cho cảm biến đất, ánh sáng, độ ẩm, nhiệt độ
              </CardDescription>
            </div>
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo mới
            </Button>
          </div>

          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_220px_180px_140px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên template, loại cảm biến, model..."
                className="pl-9"
              />
            </div>

            <Select
              value={query.type ?? "all"}
              onValueChange={(value) => {
                setQuery((prev) => ({
                  ...prev,
                  page: 1,
                  type:
                    value === "all"
                      ? undefined
                      : (value as ListSensorTemplatesQueryType["type"]),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {Object.entries(SENSOR_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={query.status ?? "all"}
              onValueChange={(value) => {
                setQuery((prev) => ({
                  ...prev,
                  page: 1,
                  status:
                    value === "all"
                      ? undefined
                      : (value as ListSensorTemplatesQueryType["status"]),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tắt</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(query.limit ?? 8)}
              onValueChange={(value) => {
                setQuery((prev) => ({
                  ...prev,
                  page: 1,
                  limit: Number(value),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Số mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 / trang</SelectItem>
                <SelectItem value="8">8 / trang</SelectItem>
                <SelectItem value="12">12 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center gap-1.5">
                <Power className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Đang hoạt động
                </p>
              </div>
              <p className="mt-1 text-xl font-semibold">{activeCount}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center gap-1.5">
                <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Đang tắt
                </p>
              </div>
              <p className="mt-1 text-xl font-semibold">{inactiveCount}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary/70" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Phiên bản trung bình
                </p>
              </div>
              <p className="mt-1 text-xl font-semibold">v{avgVersion}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Không tìm thấy template phù hợp với bộ lọc hiện tại.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`group rounded-xl border p-4 transition-all ${
                    template.deletedAt
                      ? "border-destructive/30 bg-muted/40 opacity-60"
                      : "border-border/70 bg-background hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium leading-tight">
                        {template.name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline">
                          <Activity className="mr-1 h-3 w-3" />
                          {SENSOR_TYPE_LABEL[template.type] ?? template.type}
                        </Badge>
                        <Badge variant="secondary">v{template.version}</Badge>
                        <Badge
                          variant={
                            template.deletedAt
                              ? "destructive"
                              : template.isActive
                                ? "default"
                                : "secondary"
                          }
                          className={`gap-1 ${
                            !template.deletedAt && template.isActive
                              ? "bg-emerald-600 hover:bg-emerald-600/90"
                              : ""
                          }`}
                        >
                          {template.deletedAt ? (
                            <Trash2 className="h-3 w-3" />
                          ) : template.isActive ? (
                            <Power className="h-3 w-3" />
                          ) : (
                            <PowerOff className="h-3 w-3" />
                          )}
                          {template.deletedAt
                            ? "Đã xóa"
                            : template.isActive
                              ? "Hoạt động"
                              : "Tắt"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.items.length} cảm biến | Cập nhật{" "}
                        {new Date(template.updatedAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(template)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        {!template.deletedAt && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(template.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {template.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}

                  {template.items.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {template.items.slice(0, 2).map((item) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="max-w-[200px] truncate"
                        >
                          {SENSOR_TYPE_LABEL[item.sensorType] ??
                            item.sensorType}
                        </Badge>
                      ))}
                      {template.items.length > 2 && (
                        <Badge variant="secondary">
                          +{template.items.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>
                Trang {meta.page} / {meta.totalPages} ({meta.totalItems} mục)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() =>
                    setQuery((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title="Xóa template cảm biến?"
        description="Hành động này sẽ xóa mềm template. Template sẽ không hiển thị cho Quản lý/Chủ trang trại."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
          }
          setDeleteId(null);
        }}
      />
    </>
  );
}
