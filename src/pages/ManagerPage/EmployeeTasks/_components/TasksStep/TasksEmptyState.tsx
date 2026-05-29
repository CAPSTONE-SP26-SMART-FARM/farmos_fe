import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Sparkles, PencilLine } from "lucide-react";

interface Props {
  canEdit: boolean;
  onApplyTemplate: () => void;
  onAddManual: () => void;
}

function TasksEmptyState({ canEdit, onApplyTemplate, onAddManual }: Props) {
  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ClipboardList
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Chưa có nhiệm vụ nào</p>
          <p className="text-sm text-muted-foreground">
            Mốc này chưa được cấu hình nhiệm vụ và hiện không thể chỉnh sửa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Bắt đầu cấu hình nhiệm vụ</h3>
        <p className="text-sm text-muted-foreground">
          Chọn cách thêm nhiệm vụ cho mốc này. Bạn có thể kết hợp cả hai cách.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardContent className="flex flex-1 flex-col items-start gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Dùng mẫu có sẵn</p>
              <p className="text-sm text-muted-foreground">
                Áp dụng nhanh các nhiệm vụ phổ biến cho mốc này, tiết kiệm thời
                gian nhập liệu.
              </p>
            </div>
            <Button
              className="mt-auto w-full"
              onClick={onApplyTemplate}
            >
              <Sparkles
                className="mr-1 h-4 w-4"
                aria-hidden="true"
              />
              Chọn mẫu
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardContent className="flex flex-1 flex-col items-start gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
              <PencilLine
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Tạo tay từng nhiệm vụ</p>
              <p className="text-sm text-muted-foreground">
                Tự thêm nhiệm vụ theo nhu cầu riêng. Phù hợp khi không có mẫu
                sẵn.
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-auto w-full"
              onClick={onAddManual}
            >
              <PencilLine
                className="mr-1 h-4 w-4"
                aria-hidden="true"
              />
              Thêm nhiệm vụ
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TasksEmptyState;
