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
  Ban,
  Calendar,
  Clock3,
  Milestone,
  Power,
  PowerOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { MilestoneTemplateResType } from "@/schemaValidatation/milestoneTemplate";

const FARM_TYPE_LABEL: Record<string, string> = {
  cultivation: "Trồng trọt",
};

interface MilestoneTemplateDetailProps {
  template: MilestoneTemplateResType;
  onBack: () => void;
  onEdit?: (template: MilestoneTemplateResType) => void;
}

export default function MilestoneTemplateDetail({
  template,
  onBack,
  onEdit,
}: MilestoneTemplateDetailProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const orderedItems = [...template.items].sort(
    (a, b) => a.milestoneOrder - b.milestoneOrder,
  );

  return (
    <div
      className={`transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-lg font-semibold">{template.name}</h2>
        <Badge variant="secondary" className="gap-1">
          <Milestone className="h-3 w-3" />
          Milestone
        </Badge>
        {onEdit && !template.deletedAt && (
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

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>Chi tiết milestone template.</CardDescription>
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
                  <Badge variant="destructive" className="gap-1">
                    <Ban className="h-3 w-3" />
                    Đã xóa
                  </Badge>
                ) : template.isActive ? (
                  <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600/90">
                    <Power className="h-3 w-3" />
                    Hoạt động
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <PowerOff className="h-3 w-3" />
                    Tắt
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Số giai đoạn
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

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Danh sách giai đoạn ({orderedItems.length})</CardTitle>
          <CardDescription>
            Các mốc sản xuất theo thứ tự trong template này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orderedItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Template chưa có giai đoạn nào.
            </p>
          ) : (
            <div className="space-y-3">
              {orderedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-tight">
                        {item.stageName}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          Thứ tự: #{item.milestoneOrder}
                        </span>
                        {item.daysBetween != null && (
                          <span>Cách giai đoạn trước: {item.daysBetween} ngày</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
