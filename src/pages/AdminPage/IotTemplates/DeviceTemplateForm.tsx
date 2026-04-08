import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useAdminCreateIotDeviceTemplate,
  useAdminUpdateIotDeviceTemplate,
} from "@/queries/useIotTemplate";
import type {
  IotDeviceTemplateResType,
  CreateIotDeviceTemplateBodyType,
  UpdateIotDeviceTemplateBodyType,
} from "@/schemaValidatation/iotTemplate";

interface DeviceTemplateFormProps {
  template?: IotDeviceTemplateResType;
  onBack: () => void;
}

interface DeviceItemRow {
  key: string;
  deviceName: string;
  deviceType: string;
  notes: string;
}

const createItemRow = (seed?: Partial<DeviceItemRow>): DeviceItemRow => ({
  key: crypto.randomUUID(),
  deviceName: seed?.deviceName ?? "",
  deviceType: seed?.deviceType ?? "",
  notes: seed?.notes ?? "",
});

export default function DeviceTemplateForm({
  template,
  onBack,
}: DeviceTemplateFormProps) {
  const isEdit = !!template;

  const [show, setShow] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [type, setType] = useState<string>(template?.type ?? "board_module");
  const [farmType, setFarmType] = useState<string>(
    template?.farmType ?? "cultivation",
  );
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [items, setItems] = useState<DeviceItemRow[]>(
    template?.items.map((item) =>
      createItemRow({
        deviceName: item.deviceName,
        deviceType: item.deviceType,
        notes: item.notes ?? "",
      }),
    ) ?? [createItemRow()],
  );

  const createMutation = useAdminCreateIotDeviceTemplate();
  const updateMutation = useAdminUpdateIotDeviceTemplate();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const addItem = () => setItems((prev) => [...prev, createItemRow()]);

  const removeItem = (key: string) => {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((i) => i.key !== key),
    );
  };

  const updateItem = (
    key: string,
    field: keyof DeviceItemRow,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)),
    );
  };

  const handleSave = () => {
    const itemPayload = items.map(({ deviceName, deviceType, notes }) => ({
      deviceName,
      deviceType,
      notes: notes || null,
    }));

    if (isEdit && template) {
      const body: UpdateIotDeviceTemplateBodyType = {
        name,
        description: description || null,
        type: type as UpdateIotDeviceTemplateBodyType["type"],
        farmType: farmType as UpdateIotDeviceTemplateBodyType["farmType"],
        isActive,
        items: itemPayload,
      };
      updateMutation.mutate(
        { id: template.id, body },
        { onSuccess: () => handleBack() },
      );
    } else {
      const body: CreateIotDeviceTemplateBodyType = {
        name,
        description: description || null,
        type: type as CreateIotDeviceTemplateBodyType["type"],
        farmType: farmType as CreateIotDeviceTemplateBodyType["farmType"],
        isActive,
        items: itemPayload,
      };
      createMutation.mutate(body, { onSuccess: () => handleBack() });
    }
  };

  return (
    <div
      className={`transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">
          {isEdit ? "Chỉnh sửa template thiết bị" : "Tạo template thiết bị mới"}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>
            Định nghĩa tên, loại và mô tả cho template thiết bị IoT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Tên template *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              value={type}
              onValueChange={setType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Loại thiết bị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="board_module">Board Module</SelectItem>
                <SelectItem value="wifi_module">WiFi Module</SelectItem>
                <SelectItem value="lora_module">LoRa Module</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              value={farmType}
              onValueChange={setFarmType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Loại trang trại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cultivation">Trồng trọt</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(v) => setIsActive(v === "true")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Tắt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Mô tả template (tùy chọn)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách thiết bị</CardTitle>
              <CardDescription>
                Thêm các thiết bị mặc định cho template này.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={addItem}
            >
              <Plus className="mr-1 h-4 w-4" />
              Thêm thiết bị
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.key}
              className="rounded-md border p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Thiết bị #{index + 1}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={items.length === 1}
                  onClick={() => removeItem(item.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Tên thiết bị *"
                  value={item.deviceName}
                  onChange={(e) =>
                    updateItem(item.key, "deviceName", e.target.value)
                  }
                />
                <Input
                  placeholder="Loại thiết bị *"
                  value={item.deviceType}
                  onChange={(e) =>
                    updateItem(item.key, "deviceType", e.target.value)
                  }
                />
              </div>
              <Textarea
                className="mt-3"
                placeholder="Ghi chú (tùy chọn)"
                value={item.notes}
                onChange={(e) => updateItem(item.key, "notes", e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleBack}
        >
          Hủy
        </Button>
        <Button
          disabled={isSaving || !name.trim()}
          onClick={() => {
            if (isEdit) {
              setConfirmSave(true);
            } else {
              handleSave();
            }
          }}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmSave}
        title="Cập nhật template thiết bị IoT?"
        description="Thay đổi template sẽ ảnh hưởng đến hệ thống cấu hình IoT."
        confirmLabel="Cập nhật"
        cancelLabel="Hủy"
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => {
          setConfirmSave(false);
          handleSave();
        }}
      />
    </div>
  );
}
