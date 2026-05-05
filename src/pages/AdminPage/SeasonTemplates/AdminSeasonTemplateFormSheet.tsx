import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetFooter,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useCreateSeasonTemplate,
  usePatchSeasonTemplate,
} from "@/queries/useSeasonTemplate";
import {
  FARM_TYPE_LABEL,
  type CreateSeasonTemplateBodyT,
  type FarmTypeT,
  type SeasonTemplateDetailResT,
} from "@/schemaValidatation/seasonTemplate";
import { Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import SeasonTemplateBuilder from "./SeasonTemplateBuilder";
import {
  emptyBuilder,
  fromItems,
  summarize,
  toItems,
  type BuilderModel,
} from "./seasonTemplate.helpers";

interface Props {
  mode: "create" | "edit";
  initialData: SeasonTemplateDetailResT | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminSeasonTemplateFormSheet({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [farmType, setFarmType] = useState<FarmTypeT>(
    (initialData?.farmType as FarmTypeT) ?? "cultivation",
  );
  const [model, setModel] = useState<BuilderModel>(
    initialData?.items ? fromItems(initialData.items) : emptyBuilder(),
  );

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? "");
      setDescription(initialData.description ?? "");
      setFarmType((initialData.farmType as FarmTypeT) ?? "cultivation");
      setModel(fromItems(initialData.items));
    } else {
      setName("");
      setDescription("");
      setFarmType("cultivation");
      setModel(emptyBuilder());
    }
  }, [initialData]);

  const createMut = useCreateSeasonTemplate();
  const patchMut = usePatchSeasonTemplate();
  const isPending = createMut.isPending || patchMut.isPending;

  const stats = useMemo(() => summarize(model), [model]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên mẫu.");
      return;
    }
    const items = toItems(model);
    if (items.length === 0) {
      toast.error("Mẫu cần có ít nhất 1 mục (giai đoạn / công việc / ngưỡng).");
      return;
    }

    const body: CreateSeasonTemplateBodyT = {
      name: name.trim(),
      description: description.trim() || null,
      farmType,
      items,
    };

    try {
      if (mode === "create") {
        await createMut.mutateAsync(body);
        toast.success(`Đã tạo mẫu "${body.name}".`);
      } else if (initialData) {
        await patchMut.mutateAsync({ id: initialData.id, body });
        toast.success(
          `Đã cập nhật mẫu "${body.name}" (phiên bản tăng lên ${(initialData.version ?? 0) + 1}).`,
        );
      }
      onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
        {/* Top fields */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2 space-y-1">
            <Label>Tên mẫu *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lúa nước 3 vụ — chuẩn"
            />
          </div>
          <div className="space-y-1">
            <Label>Loại trang trại *</Label>
            <Select
              value={farmType}
              onValueChange={(v) => setFarmType(v as FarmTypeT)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FARM_TYPE_LABEL) as FarmTypeT[]).map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                  >
                    {FARM_TYPE_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tóm tắt</Label>
            <div className="text-xs text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
              {stats.milestones} giai đoạn · {stats.tasks} công việc ·{" "}
              {stats.thresholds} ngưỡng
            </div>
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label>Mô tả</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về mục đích / phạm vi của mẫu này."
            />
          </div>
        </div>

        {/* Builder */}
        <SeasonTemplateBuilder
          value={model}
          onChange={setModel}
        />
      </div>

      <SheetFooter className="border-t bg-background px-6 py-3 sticky bottom-0">
        <div className="flex w-full items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {mode === "edit" && initialData
              ? `Lưu sẽ tăng phiên bản từ v${initialData.version ?? 1} lên v${(initialData.version ?? 1) + 1}. Vụ mùa cũ KHÔNG bị ảnh hưởng.`
              : "Sau khi lưu, mẫu sẽ ở phiên bản 1, hoạt động (active)."}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {mode === "create" ? "Tạo mẫu" : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </SheetFooter>
    </>
  );
}
