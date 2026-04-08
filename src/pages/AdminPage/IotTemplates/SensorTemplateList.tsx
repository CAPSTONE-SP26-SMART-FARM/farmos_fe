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
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
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
    limit: 10,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAdminListSensorTemplates(query);
  const deleteMutation = useAdminDeleteSensorTemplate();

  const templates = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template cảm biến</CardTitle>
              <CardDescription>
                Quản lý template cho cảm biến đất, ánh sáng, độ ẩm, nhiệt độ
              </CardDescription>
            </div>
            <Button onClick={onCreate}>Tạo mới</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Chưa có template cảm biến nào.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-md border p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline">
                          {SENSOR_TYPE_LABEL[template.type] ?? template.type}
                        </Badge>
                        <Badge variant="secondary">v{template.version}</Badge>
                        <Badge
                          variant={template.isActive ? "default" : "secondary"}
                        >
                          {template.isActive ? "Hoạt động" : "Tắt"}
                        </Badge>
                        {template.deletedAt && (
                          <Badge variant="destructive">Đã xóa</Badge>
                        )}
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
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(template.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {template.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
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
                    setQuery((prev) => ({ ...prev, page: prev.page - 1 }))
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
        description="Hành động này sẽ xóa mềm template. Template sẽ không hiển thị cho manager/owner."
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
