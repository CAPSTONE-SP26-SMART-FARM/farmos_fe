import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Cpu,
  Radio,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useManagerListProductionMilestones,
  useManagerCreateProductionMilestone,
  useManagerUpdateProductionMilestone,
  useManagerDeleteProductionMilestone,
  useManagerMilestoneAssignment,
  useManagerListAvailableIotDevices,
  useManagerAssignIotDevice,
  useManagerUnassignIotDevice,
  useManagerListBoundSensors,
  useManagerBindSensors,
  useManagerUnbindSensors,
  useManagerListSensorsForDevice,
  useManagerSensorThresholds,
  useManagerUpsertSensorThreshold,
} from "@/queries/useProductionMilestone";
import { useManagerCropSeasonDetail } from "@/queries/useCropSeason";
import type {
  ProductionMilestoneResType,
  ProductionMilestoneStatusType,
} from "@/schemaValidatation/productionMilestone";
import type { ThresholdEligibleSensorType } from "@/schemaValidatation/sensorThreshold";

// ============================================================
// Helpers
// ============================================================

const STATUS_META: Record<
  ProductionMilestoneStatusType,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
};

const SENSOR_TYPE_LABELS: Record<string, string> = {
  soil_moisture: "Soil Moisture",
  air_temperature: "Air Temperature",
  air_humidity: "Air Humidity",
  light_intensity: "Light Intensity",
};

const THRESHOLD_ELIGIBLE = new Set([
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
]);

// ============================================================
// Create / Edit Milestone Dialog
// ============================================================

type MilestoneFormState = {
  stageName: string;
  milestoneOrder: number;
  expectedStartDate: string;
  expectedEndDate: string;
  status: ProductionMilestoneStatusType;
};

const defaultMilestoneForm = (): MilestoneFormState => ({
  stageName: "",
  milestoneOrder: 1,
  expectedStartDate: "",
  expectedEndDate: "",
  status: "pending",
});

const MilestoneFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  isSubmitting,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MilestoneFormState) => void;
  initialValues?: MilestoneFormState;
  isSubmitting: boolean;
  title: string;
}) => {
  const [form, setForm] = useState<MilestoneFormState>(
    initialValues ?? defaultMilestoneForm(),
  );

  const reset = () => setForm(initialValues ?? defaultMilestoneForm());

  const handleOpenChange = (v: boolean) => {
    if (!v) { onClose(); reset(); }
  };

  const update = <K extends keyof MilestoneFormState>(
    k: K,
    v: MilestoneFormState[K],
  ) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium">Stage Name *</label>
            <Input
              className="mt-1"
              placeholder="e.g. Germination"
              value={form.stageName}
              onChange={(e) => update("stageName", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Order *</label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              value={form.milestoneOrder}
              onChange={(e) => update("milestoneOrder", Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Expected Start</label>
              <Input
                className="mt-1"
                type="date"
                value={form.expectedStartDate}
                onChange={(e) => update("expectedStartDate", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expected End</label>
              <Input
                className="mt-1"
                type="date"
                value={form.expectedEndDate}
                onChange={(e) => update("expectedEndDate", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                update("status", v as ProductionMilestoneStatusType)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || !form.stageName.trim()}
            onClick={() => onSubmit(form)}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// IoT Assignment Section (#80)
// ============================================================

const IotAssignmentSection = ({
  milestoneId,
}: {
  milestoneId: string;
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPage, setPickerPage] = useState(1);
  const [confirmUnassign, setConfirmUnassign] = useState(false);

  const assignmentQuery = useManagerMilestoneAssignment(milestoneId);
  const assignment = assignmentQuery.data?.data?.data ?? null;

  const availableQuery = useManagerListAvailableIotDevices(
    milestoneId,
    { page: pickerPage, limit: 5 },
    showPicker,
  );
  const available = availableQuery.data?.data.data ?? [];
  const availableMeta = availableQuery.data?.data.meta;

  const assignMutation = useManagerAssignIotDevice(milestoneId);
  const unassignMutation = useManagerUnassignIotDevice(milestoneId);

  const handleAssign = (deviceId: string) => {
    assignMutation.mutate(
      { iotDeviceId: deviceId },
      { onSuccess: () => setShowPicker(false) },
    );
  };

  const handleUnassign = () => {
    if (!assignment) return;
    unassignMutation.mutate(
      { iotDeviceId: assignment.iotDeviceId },
      { onSuccess: () => setConfirmUnassign(false) },
    );
  };

  if (assignmentQuery.isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          IoT Device Assignment
        </p>
        {!assignment && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowPicker(true); setPickerPage(1); }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Assign Device
          </Button>
        )}
        {assignment && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmUnassign(true)}
          >
            <X className="h-3 w-3 mr-1" />
            Unassign
          </Button>
        )}
      </div>

      {!assignment ? (
        <p className="text-xs text-muted-foreground py-2">
          No IoT device assigned to this milestone.
        </p>
      ) : (
        <div className="rounded-md border p-3 bg-muted/30 text-sm space-y-1">
          <p className="font-medium">Device ID: <span className="font-mono text-xs">{assignment.iotDeviceId}</span></p>
          <p className="text-muted-foreground text-xs">
            Assignment ID: <span className="font-mono">{assignment.assignmentId}</span>
          </p>
          <p className="text-muted-foreground text-xs">
            Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Device picker dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select IoT Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableQuery.isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : available.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No available devices.
              </p>
            ) : (
              available.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleAssign(dev.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{dev.deviceName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {dev.deviceType.replace("_", " ")} · {dev.status}
                    </p>
                  </div>
                  <Button size="sm" disabled={assignMutation.isPending}>
                    {assignMutation.isPending ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
          {availableMeta && availableMeta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
              <span>Page {pickerPage} of {availableMeta.totalPages}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pickerPage <= 1}
                  onClick={() => setPickerPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pickerPage >= availableMeta.totalPages}
                  onClick={() => setPickerPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmUnassign}
        title="Unassign device?"
        description="Sensor bindings and thresholds for this assignment will also be removed."
        confirmLabel="Unassign"
        variant="destructive"
        onCancel={() => setConfirmUnassign(false)}
        onConfirm={handleUnassign}
      />
    </div>
  );
};

// ============================================================
// Sensor Binding Section (#81)
// ============================================================

const SensorBindingSection = ({
  assignmentId,
  iotDeviceId,
}: {
  assignmentId: string;
  iotDeviceId?: string;
}) => {
  const [confirmUnbind, setConfirmUnbind] = useState<string | null>(null);

  // Fetch all sensors on the IoT board
  const sensorQuery = useManagerListSensorsForDevice(iotDeviceId);
  const allSensors = sensorQuery.data?.data.data ?? [];

  const boundQuery = useManagerListBoundSensors(assignmentId);
  const boundSensors = boundQuery.data?.data.data ?? [];
  const boundIds = new Set(boundSensors.map((s) => s.id));

  const unboundSensors = allSensors.filter((s) => !boundIds.has(s.id));

  const bindMutation = useManagerBindSensors(assignmentId);
  const unbindMutation = useManagerUnbindSensors(assignmentId);

  const handleBind = (sensorId: string) => {
    bindMutation.mutate({ sensorIds: [sensorId] });
  };

  const handleUnbind = (sensorId: string) => {
    unbindMutation.mutate(
      { sensorIds: [sensorId] },
      { onSuccess: () => setConfirmUnbind(null) },
    );
  };

  if (boundQuery.isLoading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Radio className="h-4 w-4" />
        Sensor Bindings
      </p>

      {/* Bound sensors */}
      {boundSensors.length === 0 ? (
        <p className="text-xs text-muted-foreground">No sensors bound yet.</p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Bound
          </p>
          {boundSensors.map((s) => (
            <div
              key={s.bindingId}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">
                  {SENSOR_TYPE_LABELS[s.sensorType] ?? s.sensorType}
                </span>
                <Badge variant="outline" className="ml-2 text-xs capitalize">
                  {s.status}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                onClick={() => setConfirmUnbind(s.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Available to bind */}
      {unboundSensors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Available to bind
          </p>
          {unboundSensors.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">
                {SENSOR_TYPE_LABELS[s.sensorType] ?? s.sensorType}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={bindMutation.isPending}
                onClick={() => handleBind(s.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Bind
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmUnbind}
        title="Unbind sensor?"
        description="This will remove the sensor from this assignment."
        confirmLabel="Unbind"
        variant="destructive"
        onCancel={() => setConfirmUnbind(null)}
        onConfirm={() => confirmUnbind && handleUnbind(confirmUnbind)}
      />
    </div>
  );
};

// ============================================================
// Sensor Threshold Section (#82)
// ============================================================

const ThresholdSection = ({ assignmentId }: { assignmentId: string }) => {
  const [editing, setEditing] = useState<ThresholdEligibleSensorType | null>(
    null,
  );
  const [form, setForm] = useState({ optimalMin: 0, optimalMax: 100 });

  const thresholdQuery = useManagerSensorThresholds(assignmentId);
  const items = thresholdQuery.data?.data.data ?? [];

  const eligibleItems = items.filter((i) => THRESHOLD_ELIGIBLE.has(i.sensorType));

  const upsertMutation = useManagerUpsertSensorThreshold(assignmentId);

  const startEdit = (sensorType: ThresholdEligibleSensorType) => {
    const existing = items.find((i) => i.sensorType === sensorType);
    setForm({
      optimalMin: existing?.threshold?.optimalMin ?? Number(existing?.minValue ?? 0),
      optimalMax: existing?.threshold?.optimalMax ?? Number(existing?.maxValue ?? 100),
    });
    setEditing(sensorType);
  };

  const handleSave = () => {
    if (!editing) return;
    upsertMutation.mutate(
      {
        sensorType: editing,
        optimalMin: form.optimalMin,
        optimalMax: form.optimalMax,
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  if (thresholdQuery.isLoading) return <Skeleton className="h-20 w-full" />;

  if (eligibleItems.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Sensor Thresholds</p>
        <p className="text-xs text-muted-foreground">
          No threshold-eligible sensors bound.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Sensor Thresholds</p>
      <p className="text-xs text-muted-foreground">
        Set optimal min/max values. Readings outside this range trigger alerts.
      </p>

      <div className="space-y-2">
        {eligibleItems.map((item) => {
          const isEditing = editing === item.sensorType;
          const t = item.threshold;
          return (
            <div key={item.sensorId} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {SENSOR_TYPE_LABELS[item.sensorType] ?? item.sensorType}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.source === "milestone"
                        ? "default"
                        : item.source === "zone"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {item.source === "none" ? "No threshold" : `From ${item.source}`}
                  </Badge>
                  {!isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        startEdit(item.sensorType as ThresholdEligibleSensorType)
                      }
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {!isEditing && t && (
                <p className="text-xs text-muted-foreground">
                  Optimal: {t.optimalMin} – {t.optimalMax}
                  &nbsp;·&nbsp;Range: {item.minValue} – {item.maxValue}
                </p>
              )}

              {isEditing && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Min</label>
                      <Input
                        type="number"
                        className="mt-1 h-8"
                        value={form.optimalMin}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            optimalMin: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Max</label>
                      <Input
                        type="number"
                        className="mt-1 h-8"
                        value={form.optimalMax}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            optimalMax: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7"
                      disabled={
                        upsertMutation.isPending ||
                        form.optimalMin > form.optimalMax
                      }
                      onClick={handleSave}
                    >
                      {upsertMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// Main Page
// ============================================================

const ManagerMilestonesPage = () => {
  const { cropSeasonId } = useParams<{ cropSeasonId: string }>();
  const navigate = useNavigate();

  const [selectedMilestone, setSelectedMilestone] =
    useState<ProductionMilestoneResType | null>(null);
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<ProductionMilestoneResType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const id = cropSeasonId ?? "";

  const cropSeasonQuery = useManagerCropSeasonDetail(id);
  const cropSeason = cropSeasonQuery.data?.data;

  const listQuery = useManagerListProductionMilestones(id, {
    page,
    limit: 10,
  });
  const milestones = listQuery.data?.data.data ?? [];
  const totalPages = listQuery.data?.data.meta.totalPages ?? 1;

  const createMutation = useManagerCreateProductionMilestone(id);
  const updateMutation = useManagerUpdateProductionMilestone(id);
  const deleteMutation = useManagerDeleteProductionMilestone(id);

  const handleCreate = (form: MilestoneFormState) => {
    createMutation.mutate(
      {
        stageName: form.stageName,
        milestoneOrder: form.milestoneOrder,
        expectedStartDate: form.expectedStartDate || null,
        expectedEndDate: form.expectedEndDate || null,
        status: form.status,
      },
      { onSuccess: () => setShowCreateDialog(false) },
    );
  };

  const handleUpdate = (form: MilestoneFormState) => {
    if (!editingMilestone) return;
    updateMutation.mutate(
      {
        milestoneId: editingMilestone.id,
        body: {
          stageName: form.stageName,
          milestoneOrder: form.milestoneOrder,
          expectedStartDate: form.expectedStartDate || null,
          expectedEndDate: form.expectedEndDate || null,
          status: form.status,
        },
      },
      { onSuccess: () => setEditingMilestone(null) },
    );
  };

  const handleDelete = (milestoneId: string) => {
    deleteMutation.mutate(milestoneId, {
      onSuccess: () => {
        setConfirmDelete(null);
        if (selectedMilestone?.id === milestoneId) setSelectedMilestone(null);
      },
    });
  };

  // assignment from query (for passing assignmentId to sub-sections)
  const assignmentQuery = useManagerMilestoneAssignment(
    selectedMilestone?.id ?? "",
    !!selectedMilestone,
  );
  const assignmentId = assignmentQuery.data?.data?.data?.assignmentId ?? null;
  const iotDeviceId = assignmentQuery.data?.data?.data?.iotDeviceId ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/manager/crop-seasons")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Production Milestones</h1>
          {cropSeason && (
            <p className="text-sm text-muted-foreground">
              {cropSeason.cropName} · {cropSeason.variety ?? ""}
            </p>
          )}
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Milestone
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: Milestone List */}
        <Card className={selectedMilestone ? "lg:col-span-2" : "lg:col-span-5"}>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>
              {listQuery.data?.data.meta.totalItems ?? 0} stage(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {listQuery.isLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : milestones.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No milestones yet.
              </p>
            ) : (
              milestones
                .slice()
                .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
                .map((m) => {
                  const meta = STATUS_META[m.status];
                  return (
                    <div
                      key={m.id}
                      onClick={() =>
                        setSelectedMilestone(
                          selectedMilestone?.id === m.id ? null : m,
                        )
                      }
                      className={`flex items-start justify-between rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedMilestone?.id === m.id
                          ? "border-primary bg-muted/30"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            #{m.milestoneOrder}
                          </span>
                          <p className="font-medium truncate">{m.stageName}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={meta.variant} className="text-xs">
                            {meta.label}
                          </Badge>
                          {m.expectedStartDate && (
                            <span className="text-xs text-muted-foreground">
                              {m.expectedStartDate}
                              {m.expectedEndDate
                                ? ` → ${m.expectedEndDate}`
                                : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMilestone(m);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(m.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Milestone Detail */}
        {selectedMilestone && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    #{selectedMilestone.milestoneOrder} {selectedMilestone.stageName}
                  </CardTitle>
                  <CardDescription>
                    <Badge
                      variant={STATUS_META[selectedMilestone.status].variant}
                      className="text-xs mt-1"
                    >
                      {STATUS_META[selectedMilestone.status].label}
                    </Badge>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedMilestone(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedMilestone.expectedStartDate && (
                <p className="text-sm text-muted-foreground">
                  {selectedMilestone.expectedStartDate}
                  {selectedMilestone.expectedEndDate
                    ? ` → ${selectedMilestone.expectedEndDate}`
                    : ""}
                </p>
              )}

              <Separator />

              {/* IoT Device Assignment (#80) */}
              <IotAssignmentSection milestoneId={selectedMilestone.id} />

              {/* Sensor Binding (#81) — only when device is assigned */}
              {assignmentId && (
                <>
                  <Separator />
                  <SensorBindingSection
                    assignmentId={assignmentId}
                    iotDeviceId={iotDeviceId ?? undefined}
                  />
                </>
              )}

              {/* Threshold (#82) — only when device is assigned */}
              {assignmentId && (
                <>
                  <Separator />
                  <ThresholdSection assignmentId={assignmentId} />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <MilestoneFormDialog
        open={showCreateDialog}
        title="New Milestone"
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      {editingMilestone && (
        <MilestoneFormDialog
          open={!!editingMilestone}
          title="Edit Milestone"
          initialValues={{
            stageName: editingMilestone.stageName,
            milestoneOrder: editingMilestone.milestoneOrder,
            expectedStartDate: editingMilestone.expectedStartDate ?? "",
            expectedEndDate: editingMilestone.expectedEndDate ?? "",
            status: editingMilestone.status,
          }}
          onClose={() => setEditingMilestone(null)}
          onSubmit={handleUpdate}
          isSubmitting={updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete milestone?"
        description="IoT assignment and sensor bindings linked to this milestone will also be removed."
        confirmLabel="Delete"
        variant="destructive"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
};

export default ManagerMilestonesPage;
