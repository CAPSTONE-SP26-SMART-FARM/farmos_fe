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
  useAdminCreateSensorTemplate,
  useAdminUpdateSensorTemplate,
} from "@/queries/useIotTemplate";
import type {
  SensorTemplateResType,
  CreateSensorTemplateBodyType,
  UpdateSensorTemplateBodyType,
} from "@/schemaValidatation/iotTemplate";

interface SensorTemplateFormProps {
  template?: SensorTemplateResType;
  onBack: () => void;
}

interface SensorItemRow {
  key: string;
  sensorType: string;
  sensorModel: string;
  gpioPin: string;
  calibrationOffset: string;
  stageName: string;
  minValue: string;
  maxValue: string;
  optimalMin: string;
  optimalMax: string;
}

const createItemRow = (seed?: Partial<SensorItemRow>): SensorItemRow => ({
  key: crypto.randomUUID(),
  sensorType: seed?.sensorType ?? "soil_moisture_sensor",
  sensorModel: seed?.sensorModel ?? "",
  gpioPin: seed?.gpioPin ?? "",
  calibrationOffset: seed?.calibrationOffset ?? "",
  stageName: seed?.stageName ?? "",
  minValue: seed?.minValue ?? "",
  maxValue: seed?.maxValue ?? "",
  optimalMin: seed?.optimalMin ?? "",
  optimalMax: seed?.optimalMax ?? "",
});

const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture_sensor: "Độ ẩm đất",
  light_intensity_sensor: "Cường độ ánh sáng",
  air_humidity_sensor: "Độ ẩm không khí",
  air_temperature_sensor: "Nhiệt độ không khí",
} as const;

export default function SensorTemplateForm({
  template,
  onBack,
}: SensorTemplateFormProps) {
  const isEdit = !!template;

  const [show, setShow] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [type, setType] = useState<string>(
    template?.type ?? "soil_moisture_sensor",
  );
  const [farmType, setFarmType] = useState<string>(
    template?.farmType ?? "cultivation",
  );
  const [version, setVersion] = useState(String(template?.version ?? 1));
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [items, setItems] = useState<SensorItemRow[]>(
    template?.items.map((item) =>
      createItemRow({
        sensorType: item.sensorType,
        sensorModel: item.sensorModel ?? "",
        gpioPin: item.gpioPin ?? "",
        calibrationOffset:
          item.calibrationOffset != null ? String(item.calibrationOffset) : "",
        stageName: item.stageName ?? "",
        minValue: item.minValue != null ? String(item.minValue) : "",
        maxValue: item.maxValue != null ? String(item.maxValue) : "",
        optimalMin: item.optimalMin != null ? String(item.optimalMin) : "",
        optimalMax: item.optimalMax != null ? String(item.optimalMax) : "",
      }),
    ) ?? [createItemRow()],
  );

  const createMutation = useAdminCreateSensorTemplate();
  const updateMutation = useAdminUpdateSensorTemplate();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const addItem = () =>
    setItems((prev) => [...prev, createItemRow({ sensorType: type })]);

  const removeItem = (key: string) => {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((i) => i.key !== key),
    );
  };

  const updateItem = (
    key: string,
    field: keyof SensorItemRow,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)),
    );
  };

  const parseNum = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const handleSave = () => {
    const itemPayload = items.map((i) => ({
      sensorType: i.sensorType as CreateSensorTemplateBodyType["type"],
      sensorModel: i.sensorModel || null,
      gpioPin: i.gpioPin || null,
      calibrationOffset: parseNum(i.calibrationOffset),
      stageName: i.stageName || null,
      minValue: parseNum(i.minValue),
      maxValue: parseNum(i.maxValue),
      optimalMin: parseNum(i.optimalMin),
      optimalMax: parseNum(i.optimalMax),
    }));

    if (isEdit && template) {
      const body: UpdateSensorTemplateBodyType = {
        name,
        description: description || null,
        type: type as UpdateSensorTemplateBodyType["type"],
        farmType: farmType as UpdateSensorTemplateBodyType["farmType"],
        version: Number(version) || undefined,
        isActive,
        items: itemPayload,
      };
      updateMutation.mutate(
        { id: template.id, body },
        { onSuccess: () => handleBack() },
      );
    } else {
      const body: CreateSensorTemplateBodyType = {
        name,
        description: description || null,
        type: type as CreateSensorTemplateBodyType["type"],
        farmType: farmType as CreateSensorTemplateBodyType["farmType"],
        version: Number(version) || 1,
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
          {isEdit ? "Chỉnh sửa template cảm biến" : "Tạo template cảm biến mới"}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>
            Định nghĩa tên, loại cảm biến và phiên bản cho template.
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
                <SelectValue placeholder="Loại cảm biến" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SENSOR_TYPE_LABEL).map(([val, label]) => (
                  <SelectItem
                    key={val}
                    value={val}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
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
            <Input
              type="number"
              placeholder="Phiên bản *"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
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
              <CardTitle>Danh sách cảm biến</CardTitle>
              <CardDescription>
                Cấu hình ngưỡng min/max, optimal cho từng cảm biến.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={addItem}
            >
              <Plus className="mr-1 h-4 w-4" />
              Thêm cảm biến
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
                <p className="text-sm font-medium">Cảm biến #{index + 1}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={items.length === 1}
                  onClick={() => removeItem(item.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Select
                  value={item.sensorType}
                  onValueChange={(v) => updateItem(item.key, "sensorType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Loại cảm biến" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SENSOR_TYPE_LABEL).map(([val, label]) => (
                      <SelectItem
                        key={val}
                        value={val}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Model (vd: DHT11)"
                  value={item.sensorModel}
                  onChange={(e) =>
                    updateItem(item.key, "sensorModel", e.target.value)
                  }
                />
                <Input
                  placeholder="GPIO Pin (vd: D4)"
                  value={item.gpioPin}
                  onChange={(e) =>
                    updateItem(item.key, "gpioPin", e.target.value)
                  }
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Giai đoạn (vd: Ươm cây)"
                  value={item.stageName}
                  onChange={(e) =>
                    updateItem(item.key, "stageName", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Calibration Offset"
                  value={item.calibrationOffset}
                  onChange={(e) =>
                    updateItem(item.key, "calibrationOffset", e.target.value)
                  }
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Input
                  type="number"
                  placeholder="Min"
                  value={item.minValue}
                  onChange={(e) =>
                    updateItem(item.key, "minValue", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={item.maxValue}
                  onChange={(e) =>
                    updateItem(item.key, "maxValue", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Optimal Min"
                  value={item.optimalMin}
                  onChange={(e) =>
                    updateItem(item.key, "optimalMin", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Optimal Max"
                  value={item.optimalMax}
                  onChange={(e) =>
                    updateItem(item.key, "optimalMax", e.target.value)
                  }
                />
              </div>
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
        title="Cập nhật template cảm biến?"
        description="Thay đổi ngưỡng cảm biến sẽ ảnh hưởng đến hệ thống cảnh báo IoT."
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
