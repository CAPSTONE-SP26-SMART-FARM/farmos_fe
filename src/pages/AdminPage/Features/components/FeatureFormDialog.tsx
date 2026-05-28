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
import { Info, Loader2, Ticket } from "lucide-react";
import { useMemo } from "react";
import type { CreateFeatureBodyType } from "@/schemaValidatation/feature";
import type { FormState } from "../featureTypes";
import {
  INITIAL_FORM,
  TICKET_FEATURE_CODE_PREFIX,
  TICKET_FEATURE_CODE_SUFFIX,
  TICKET_FEATURE_DOMAIN_REGEX,
  TICKET_INITIAL_FORM,
  buildTicketFeatureCode,
  extractTicketFeatureDomain,
} from "../featureTypes";

interface FeatureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  editingFeatureCode: string | null;
  setEditingFeatureCode: React.Dispatch<React.SetStateAction<string | null>>;
  isSubmitting: boolean;
  onSubmit: () => void;
  // Khi true: chỉ cho phép tạo feature ticket (TICKET_*_CREDITS), khoá kiểu
  // dữ liệu (INT) và đơn vị (ticket). Edit mode vẫn dùng UI gốc.
  ticketOnly?: boolean;
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
  ticketOnly = false,
}: FeatureFormDialogProps) {
  const isCreating = !editingFeatureCode;
  const ticketCreateMode = ticketOnly && isCreating;

  const domain = useMemo(
    () => extractTicketFeatureDomain(form.code),
    [form.code],
  );
  const domainValid = !domain || TICKET_FEATURE_DOMAIN_REGEX.test(domain);
  const ticketCodeValid =
    !!form.code &&
    form.code.startsWith(TICKET_FEATURE_CODE_PREFIX) &&
    form.code.endsWith(TICKET_FEATURE_CODE_SUFFIX) &&
    form.code.length >
      TICKET_FEATURE_CODE_PREFIX.length + TICKET_FEATURE_CODE_SUFFIX.length &&
    domainValid;

  const resetOnClose = () => {
    setForm(ticketOnly ? TICKET_INITIAL_FORM : INITIAL_FORM);
    setEditingFeatureCode(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isSubmitting) return;
        onOpenChange(next);
        if (!next) resetOnClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingFeatureCode
              ? "Cập nhật tính năng"
              : ticketCreateMode
                ? "Tạo tính năng ticket"
                : "Tạo tính năng mới"}
          </DialogTitle>
          <DialogDescription>
            {editingFeatureCode
              ? "Chỉnh sửa thông tin tính năng hiện có."
              : ticketCreateMode
                ? "Tính năng dùng để cấp quota ticket qua gói đăng ký. Sau khi tạo, hãy gắn vào một danh mục ticket để trừ quota khi owner gửi yêu cầu hỗ trợ."
                : "Thêm tính năng mới vào danh mục."}
          </DialogDescription>
        </DialogHeader>

        {ticketCreateMode && (
          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs">
            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-primary">
                Quy ước mã tính năng ticket
              </p>
              <p className="text-muted-foreground">
                Mã sẽ có dạng{" "}
                <code className="font-mono">TICKET_&lt;LĨNH_VỰC&gt;_CREDITS</code>.
                Sau khi tạo, mở trang{" "}
                <strong>Danh Mục Ticket</strong> rồi bật "Cấp qua gói đăng ký"
                và chọn mã này ở ô <strong>Feature code</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {ticketCreateMode ? (
            <div className="space-y-2">
              <Label htmlFor="feature-code-domain">Lĩnh vực ticket</Label>
              <div className="flex items-center gap-1.5">
                <span className="select-none rounded-md border bg-muted px-2 py-2 font-mono text-xs text-muted-foreground">
                  TICKET_
                </span>
                <Input
                  id="feature-code-domain"
                  value={domain}
                  onChange={(event) => {
                    const next = event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_]/g, "");
                    setForm((prev) => ({
                      ...prev,
                      code: buildTicketFeatureCode(next),
                    }));
                  }}
                  placeholder="VD: DISEASE_DIAGNOSIS"
                  className="font-mono uppercase"
                />
                <span className="select-none rounded-md border bg-muted px-2 py-2 font-mono text-xs text-muted-foreground">
                  _CREDITS
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>
                  Chỉ chữ in hoa, số, dấu gạch dưới. Mã đầy đủ:{" "}
                  <code className="font-mono">{form.code || "TICKET_???_CREDITS"}</code>
                </span>
              </div>
              {!domainValid && (
                <p className="text-xs text-destructive">
                  Lĩnh vực phải bắt đầu bằng chữ cái và chỉ chứa A-Z, 0-9, _.
                </p>
              )}
            </div>
          ) : (
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
          )}

          <div className="space-y-2">
            <Label htmlFor="feature-name">Tên feature</Label>
            <Input
              id="feature-name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder={
                ticketCreateMode
                  ? "VD: Lượt chẩn đoán bệnh"
                  : "VD: Số trang trại tối đa"
              }
            />
          </div>

          {isCreating && !ticketCreateMode && (
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
            <Label htmlFor="feature-default">
              {ticketCreateMode ? "Số lượt mặc định" : "Giá trị mặc định"}
            </Label>
            <Input
              id="feature-default"
              type={ticketCreateMode ? "number" : "text"}
              min={ticketCreateMode ? 0 : undefined}
              value={form.defaultValue}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  defaultValue: event.target.value,
                }))
              }
              placeholder={ticketCreateMode ? "VD: 5" : "VD: 10"}
            />
            {ticketCreateMode && (
              <p className="text-xs text-muted-foreground">
                Số lượt mặc định khi gói chưa cấu hình riêng cho tính năng này.
              </p>
            )}
          </div>

          {!ticketCreateMode && (
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
          )}

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
              placeholder={
                ticketCreateMode
                  ? "Mô tả ngắn về loại ticket mà tính năng này cấp quota."
                  : undefined
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetOnClose();
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              isSubmitting || (ticketCreateMode && !ticketCodeValid)
            }
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {editingFeatureCode
              ? "Lưu thay đổi"
              : ticketCreateMode
                ? "Tạo tính năng ticket"
                : "Tạo feature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
