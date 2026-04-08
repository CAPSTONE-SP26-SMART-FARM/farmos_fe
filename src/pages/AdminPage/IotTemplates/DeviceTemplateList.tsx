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
  useAdminListIotDeviceTemplates,
  useAdminDeleteIotDeviceTemplate,
} from "@/queries/useIotTemplate";
import type {
  ListIotDeviceTemplateQueryType,
  IotDeviceTemplateResType,
} from "@/schemaValidatation/iotTemplate";

const DEVICE_TYPE_LABEL: Record<string, string> = {
  board_module: "Board Module",
  wifi_module: "WiFi Module",
  lora_module: "LoRa Module",
} as const;

interface DeviceTemplateListProps {
  onEdit: (template: IotDeviceTemplateResType) => void;
  onCreate: () => void;
}

export default function DeviceTemplateList({
  onEdit,
  onCreate,
}: DeviceTemplateListProps) {
  const [query, setQuery] = useState<ListIotDeviceTemplateQueryType>({
    page: 1,
    limit: 10,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAdminListIotDeviceTemplates(query);
  const deleteMutation = useAdminDeleteIotDeviceTemplate();

  const templates = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template thiết bị IoT</CardTitle>
              <CardDescription>
                Quản lý template cho Board, WiFi, LoRa module
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
              Chưa có template thiết bị IoT nào.
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
                          {DEVICE_TYPE_LABEL[template.type] ?? template.type}
                        </Badge>
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
                        {template.items.length} thiết bị | Cập nhật{" "}
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
        title="Xóa template thiết bị IoT?"
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
