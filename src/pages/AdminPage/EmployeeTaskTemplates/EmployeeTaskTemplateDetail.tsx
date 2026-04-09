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
  ArrowLeft,
  ClipboardList,
  Power,
  PowerOff,
  Trash2,
  AlertTriangle,
  Flag,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { EmployeeTaskTemplateResType } from "@/schemaValidatation/employeeTaskTemplate";

const PRIORITY_META: Record<
  string,
  { label: string; className: string; icon: typeof Flag }
> = {
  low: {
    label: "Thấp",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: Flag,
  },
  normal: {
    label: "Bình thường",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: Flag,
  },
  high: {
    label: "Cao",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    icon: AlertTriangle,
  },
  urgent: {
    label: "Khẩn cấp",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    icon: AlertTriangle,
  },
};

const FARM_TYPE_LABEL: Record<string, string> = {
  cultivation: "Trồng trọt",
};

interface EmployeeTaskTemplateDetailProps {
  template: EmployeeTaskTemplateResType;
  onBack: () => void;
  onEdit?: (template: EmployeeTaskTemplateResType) => void;
}

export default function EmployeeTaskTemplateDetail({
  template,
  onBack,
  onEdit,
}: EmployeeTaskTemplateDetailProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  return (
    <div
      className={`transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-lg font-semibold">{template.name}</h2>
        <Badge
          variant="secondary"
          className="gap-1"
        >
          <ClipboardList className="h-3 w-3" />
          Nhiệm vụ
        </Badge>
        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => onEdit(template)}
          >
            Chỉnh sửa
          </Button>
        )}
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>
            Chi tiết template nhiệm vụ nhân viên.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tên template
              </p>
              <p className="text-sm font-medium">{template.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Loại trang trại
              </p>
              <p className="text-sm font-medium">
                {FARM_TYPE_LABEL[template.farmType] ?? template.farmType}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Trạng thái
              </p>
              <div>
                {template.deletedAt ? (
                  <Badge
                    variant="destructive"
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Đã xóa
                  </Badge>
                ) : template.isActive ? (
                  <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600/90">
                    <Power className="h-3 w-3" />
                    Hoạt động
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1"
                  >
                    <PowerOff className="h-3 w-3" />
                    Tắt
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Số nhiệm vụ
              </p>
              <p className="text-sm font-medium">{template.items.length}</p>
            </div>
          </div>

          {template.description && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mô tả
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {template.description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Tạo lúc:{" "}
              {new Date(template.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Cập nhật:{" "}
              {new Date(template.updatedAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Items card */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Danh sách nhiệm vụ ({template.items.length})</CardTitle>
          <CardDescription>
            Các nhiệm vụ sẽ được giao khi sử dụng template này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {template.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Template chưa có nhiệm vụ nào.
            </p>
          ) : (
            <div className="space-y-3">
              {template.items.map((item, index) => {
                const pMeta =
                  PRIORITY_META[item.priority] ?? PRIORITY_META.normal;
                const PIcon = pMeta.icon;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-tight">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${pMeta.className}`}
                      >
                        <PIcon className="h-3 w-3" />
                        {pMeta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
