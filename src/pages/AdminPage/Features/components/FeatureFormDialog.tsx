import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { CreateFeatureBodyType } from "@/schemaValidatation/feature";
import type { FormState } from "../featureTypes";
import { INITIAL_FORM } from "../featureTypes";

interface FeatureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  editingFeatureCode: string | null;
  setEditingFeatureCode: React.Dispatch<React.SetStateAction<string | null>>;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function FeatureFormDialog({
  open,
  onOpenChange,
  form,
  setForm,
  editingFeatureCode,
  setEditingFeatureCode,
  isSubmitting,
  onSubmit,
}: FeatureFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isSubmitting) return;
        onOpenChange(next);
        if (!next) {
          setForm(INITIAL_FORM);
          setEditingFeatureCode(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingFeatureCode ? "Cập nhật feature" : "Tạo feature mới"}
          </DialogTitle>
          <DialogDescription>
            {editingFeatureCode
              ? "PATCH /features/{featureCode}"
              : "POST /features"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feature-code">Mã feature</Label>
            <Input
              id="feature-code"
              value={form.code}
              disabled={Boolean(editingFeatureCode)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }
              placeholder="VD: max_farm_count"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-name">Tên feature</Label>
            <Input
              id="feature-name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="VD: Số trang trại tối đa"
            />
          </div>
          {!editingFeatureCode && (
            <div className="space-y-2">
              <Label htmlFor="feature-value-type">Kiểu dữ liệu</Label>
              <Select
                value={form.valueType}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    valueType: value as CreateFeatureBodyType["valueType"],
                  }))
                }
              >
                <SelectTrigger id="feature-value-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                  <SelectItem value="INT">INT</SelectItem>
                  <SelectItem value="DECIMAL">DECIMAL</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="TEXT">TEXT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="feature-default">Giá trị mặc định</Label>
            <Input
              id="feature-default"
              value={form.defaultValue}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  defaultValue: event.target.value,
                }))
              }
              placeholder="VD: 10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-unit">Đơn vị</Label>
            <Input
              id="feature-unit"
              value={form.unit}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, unit: event.target.value }))
              }
              placeholder="VD: farm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-description">Mô tả</Label>
            <Textarea
              id="feature-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setForm(INITIAL_FORM);
              setEditingFeatureCode(null);
            }}
          >
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {editingFeatureCode ? "Lưu thay đổi" : "Tạo feature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
