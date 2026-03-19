import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type IotMetric = {
  id: string;
  indexCode: string;
  indexName: string;
  unit: string;
  device: string;
  minValue: string;
  maxValue: string;
  notes: string;
};

type IotTemplate = {
  id: string;
  templateName: string;
  cropName: string;
  growthStage: string;
  description: string;
  metrics: IotMetric[];
  updatedAt: string;
};

const SENSOR_SUGGESTIONS = [
  "ESP32",
  "DHT11 (Do am va nhiet do)",
  "AHT20 (Nhiet do khong khi)",
  "CDS Light Sensor",
  "Soil Moisture Sensor Corrosion Resistance Probe",
];

const createMetric = (seed?: Partial<IotMetric>): IotMetric => ({
  id: crypto.randomUUID(),
  indexCode: seed?.indexCode ?? "",
  indexName: seed?.indexName ?? "",
  unit: seed?.unit ?? "",
  device: seed?.device ?? "",
  minValue: seed?.minValue ?? "",
  maxValue: seed?.maxValue ?? "",
  notes: seed?.notes ?? "",
});

const createTemplate = (seed?: Partial<IotTemplate>): IotTemplate => ({
  id: seed?.id ?? crypto.randomUUID(),
  templateName: seed?.templateName ?? "",
  cropName: seed?.cropName ?? "",
  growthStage: seed?.growthStage ?? "",
  description: seed?.description ?? "",
  metrics: seed?.metrics ?? [createMetric()],
  updatedAt: seed?.updatedAt ?? new Date().toISOString(),
});

const initialTemplates: IotTemplate[] = [
  createTemplate({
    templateName: "Ot - Giai doan uom cay",
    cropName: "Ot",
    growthStage: "Uom",
    description: "Template cho giai doan uom cay ot voi nguong an toan co ban.",
    metrics: [
      createMetric({
        indexCode: "soil_moisture",
        indexName: "Do am dat",
        unit: "%",
        device: "Soil Moisture Sensor Corrosion Resistance Probe",
        minValue: "55",
        maxValue: "70",
        notes: "Dat khong duoc qua kho o giai doan uom.",
      }),
      createMetric({
        indexCode: "air_temp",
        indexName: "Nhiet do khong khi",
        unit: "C",
        device: "AHT20 (Nhiet do khong khi)",
        minValue: "24",
        maxValue: "30",
        notes: "Co the doi sang DHT11 neu bo cam bien khac.",
      }),
      createMetric({
        indexCode: "light_intensity",
        indexName: "Cuong do anh sang",
        unit: "lux",
        device: "CDS Light Sensor",
        minValue: "12000",
        maxValue: "25000",
        notes: "Theo doi muc sang theo ngay.",
      }),
    ],
  }),
];

function AdminIotTemplatesPage() {
  const [templates, setTemplates] = useState<IotTemplate[]>(initialTemplates);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [formData, setFormData] = useState<IotTemplate>(createTemplate());
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmState, setConfirmState] = useState<
    | { type: "delete"; templateId: string }
    | { type: "reset" }
    | { type: "update" }
    | null
  >(null);
  const pageSize = 8;

  const isEditing = mode === "edit" && Boolean(editingTemplateId);
  const showForm = mode !== "idle";

  const totalMetrics = useMemo(
    () => templates.reduce((acc, item) => acc + item.metrics.length, 0),
    [templates],
  );

  const totalPages = Math.max(1, Math.ceil(templates.length / pageSize));
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return templates.slice(start, start + pageSize);
  }, [currentPage, pageSize, templates]);

  const resetForm = () => {
    setFormData(createTemplate());
    setEditingTemplateId(null);
    setMode("create");
    setErrorMessage("");
  };

  const startCreateTemplate = () => {
    setMode("create");
    setEditingTemplateId(null);
    setFormData(createTemplate());
    setErrorMessage("");
  };

  const startEditTemplate = (template: IotTemplate) => {
    setMode("edit");
    setEditingTemplateId(template.id);
    setFormData({
      ...template,
      metrics: template.metrics.map((metric) => ({ ...metric })),
    });
    setErrorMessage("");
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((item) => item.id !== templateId));
    setCurrentPage((prevPage) => {
      const newTotal = templates.length - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      return Math.min(prevPage, newTotalPages);
    });

    if (editingTemplateId === templateId) {
      setMode("idle");
      setEditingTemplateId(null);
      setFormData(createTemplate());
      setErrorMessage("");
    }
  };

  const addMetricRow = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, createMetric()],
    }));
  };

  const removeMetricRow = (metricId: string) => {
    setFormData((prev) => ({
      ...prev,
      metrics:
        prev.metrics.length === 1
          ? prev.metrics
          : prev.metrics.filter((item) => item.id !== metricId),
    }));
  };

  const updateMetric = (
    metricId: string,
    field: keyof IotMetric,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.map((metric) =>
        metric.id === metricId ? { ...metric, [field]: value } : metric,
      ),
    }));
  };

  const validateForm = () => {
    if (!formData.templateName.trim()) return "Vui long nhap ten template.";
    if (!formData.cropName.trim()) return "Vui long nhap ten cay trong.";
    if (!formData.growthStage.trim())
      return "Vui long nhap giai doan sinh truong.";
    if (!formData.metrics.length) return "Can it nhat 1 chi so IoT.";

    const invalidMetric = formData.metrics.find(
      (metric) =>
        !metric.indexName.trim() ||
        !metric.unit.trim() ||
        !metric.device.trim() ||
        !metric.minValue.trim() ||
        !metric.maxValue.trim(),
    );
    if (invalidMetric) {
      return "Moi chi so can du thong tin: ten, don vi, thiet bi, min, max.";
    }
    return "";
  };

  const saveTemplate = () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const payload = {
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    if (isEditing && editingTemplateId) {
      setTemplates((prev) =>
        prev.map((item) => (item.id === editingTemplateId ? payload : item)),
      );
    } else {
      setTemplates((prev) => [payload, ...prev]);
    }

    setMode("idle");
    setEditingTemplateId(null);
    setFormData(createTemplate());
    setErrorMessage("");
  };

  const applySensorPreset = (sensor: string) => {
    const presets: Record<string, Partial<IotMetric>> = {
      "DHT11 (Do am va nhiet do)": {
        indexCode: "dht11_humidity",
        indexName: "Do am khong khi (DHT11)",
        unit: "%",
        device: "DHT11",
      },
      "AHT20 (Nhiet do khong khi)": {
        indexCode: "aht20_air_temp",
        indexName: "Nhiet do khong khi (AHT20)",
        unit: "C",
        device: "AHT20",
      },
      "CDS Light Sensor": {
        indexCode: "cds_light",
        indexName: "Cuong do anh sang (CDS)",
        unit: "lux",
        device: "CDS Light Sensor",
      },
      "Soil Moisture Sensor Corrosion Resistance Probe": {
        indexCode: "soil_probe_moisture",
        indexName: "Do am dat (probe chong an mon)",
        unit: "%",
        device: "Soil Moisture Sensor Corrosion Resistance Probe",
      },
      ESP32: {
        indexCode: "esp32_signal",
        indexName: "Trang thai gateway ESP32",
        unit: "",
        device: "ESP32",
      },
    };

    const preset = presets[sensor];
    if (!preset) return;

    // Neu dang o trang thai idle thi tu dong bat sang tao moi
    if (mode === "idle") {
      startCreateTemplate();
    }

    setFormData((prev) => {
      const emptyIndex = prev.metrics.findIndex(
        (m) => !m.indexName && !m.device && !m.unit,
      );
      if (emptyIndex === -1) {
        return {
          ...prev,
          metrics: [...prev.metrics, createMetric(preset)],
        };
      }
      const nextMetrics = prev.metrics.map((metric, idx) =>
        idx === emptyIndex ? { ...metric, ...preset } : metric,
      );
      return { ...prev, metrics: nextMetrics };
    });
  };

  const showResetButton = mode === "create" || mode === "edit";
  const showCreateButton = mode !== "create";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Admin Portal</Badge>
          <h1 className="text-2xl font-bold">IoT Templates</h1>
          <p className="text-muted-foreground">
            Cau hinh nguong IoT linh dong: admin tu dinh nghia chi so, nguon du
            lieu va gioi han min/max.
          </p>
        </div>
        <div className="flex gap-2">
          {showResetButton && (
            <Button
              variant="outline"
              onClick={() => {
                setConfirmState({ type: "reset" });
              }}
            >
              Reset Form
            </Button>
          )}
          {showCreateButton && (
            <Button onClick={startCreateTemplate}>Create Template</Button>
          )}
          {showForm && (
            <Button
              onClick={() => {
                if (isEditing) {
                  setConfirmState({ type: "update" });
                } else {
                  saveTemplate();
                }
              }}
            >
              {isEditing ? "Update Template" : "Save Template"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={showForm ? "lg:col-span-1" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>Danh sach Templates</CardTitle>
            <CardDescription>
              {templates.length} template(s) - {totalMetrics} chi so IoT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {paginatedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-md border p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{template.templateName}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.cropName} - {template.growthStage}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.metrics.length} chi so | Updated{" "}
                        {new Date(template.updatedAt).toLocaleDateString()}
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
                        <DropdownMenuItem
                          onClick={() => startEditTemplate(template)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            setConfirmState({
                              type: "delete",
                              templateId: template.id,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {showForm && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {isEditing ? "Cap nhat Template" : "Tao Template moi"}
              </CardTitle>
              <CardDescription>
                Admin co the CRUD template va CRUD tung chi so trong template
                mot cach linh hoat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Ten template (vi du: Ot - Giai doan ra hoa)"
                  value={formData.templateName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      templateName: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Ten cay trong"
                  value={formData.cropName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cropName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Giai doan sinh truong"
                  value={formData.growthStage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      growthStage: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="So luong chi so"
                  value={String(formData.metrics.length)}
                  readOnly
                />
              </div>
              <Textarea
                placeholder="Mo ta template"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />

              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-medium">
                  Sensor goi y tu he thong
                </p>
                <div className="flex flex-wrap gap-2">
                  {SENSOR_SUGGESTIONS.map((sensor) => (
                    <Badge
                      key={sensor}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => applySensorPreset(sensor)}
                    >
                      {sensor}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Danh sach chi so (dynamic)
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addMetricRow}
                  >
                    Add metric
                  </Button>
                </div>

                {formData.metrics.map((metric, index) => (
                  <div
                    key={metric.id}
                    className="rounded-md border p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Chi so #{index + 1}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={formData.metrics.length === 1}
                        onClick={() => removeMetricRow(metric.id)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Ma chi so (tu dat) - vd: chili_leaf_temp"
                        value={metric.indexCode}
                        onChange={(e) =>
                          updateMetric(metric.id, "indexCode", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Ten chi so - vd: Nhiet do la"
                        value={metric.indexName}
                        onChange={(e) =>
                          updateMetric(metric.id, "indexName", e.target.value)
                        }
                      />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Don vi - vd: C, %, lux"
                        value={metric.unit}
                        onChange={(e) =>
                          updateMetric(metric.id, "unit", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Nguon cam bien/thiet bi"
                        value={metric.device}
                        onChange={(e) =>
                          updateMetric(metric.id, "device", e.target.value)
                        }
                      />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Nguong MIN"
                        value={metric.minValue}
                        onChange={(e) =>
                          updateMetric(metric.id, "minValue", e.target.value)
                        }
                      />
                      <Input
                        placeholder="Nguong MAX"
                        value={metric.maxValue}
                        onChange={(e) =>
                          updateMetric(metric.id, "maxValue", e.target.value)
                        }
                      />
                    </div>

                    <Textarea
                      className="mt-3"
                      placeholder="Ghi chu cho chi so"
                      value={metric.notes}
                      onChange={(e) =>
                        updateMetric(metric.id, "notes", e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>

              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmState?.type === "delete"}
        title="Xoa IoT template?"
        description="Hanh dong nay khong the hoan tac. Tat ca nguong chi so cua template se bi xoa."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.type === "delete") {
            deleteTemplate(confirmState.templateId);
          }
          setConfirmState(null);
        }}
      />

      <ConfirmDialog
        open={confirmState?.type === "reset"}
        title="Reset form template?"
        description="Tat ca thay doi chua luu tren form se bi xoa."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="destructive"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          resetForm();
          setConfirmState(null);
        }}
      />

      <ConfirmDialog
        open={confirmState?.type === "update"}
        title="Cap nhat IoT template?"
        description="Thay doi nguong chi so se anh huong den he thong canh bao IoT."
        confirmLabel="Update"
        cancelLabel="Cancel"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          saveTemplate();
          setConfirmState(null);
        }}
      />
    </div>
  );
}

export default AdminIotTemplatesPage;
