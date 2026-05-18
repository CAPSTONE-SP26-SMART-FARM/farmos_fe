import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PRIORITY_LABEL,
  SENSOR_TYPE_LABEL,
  type SensorTypeT,
  type PriorityT,
} from "@/schemaValidatation/seasonTemplate";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Gauge,
  ListChecks,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import {
  newMilestone,
  newTask,
  newThreshold,
  type BuilderModel,
} from "./seasonTemplate.helpers";
import { SENSOR_TYPE_ICON } from "@/constants/iotDeviceDisplay";

const ALL_SENSOR_TYPES = Object.keys(SENSOR_TYPE_LABEL) as SensorTypeT[];

interface Props {
  value: BuilderModel;
  onChange: (next: BuilderModel) => void;
}

export default function SeasonTemplateBuilder({ value, onChange }: Props) {
  const update = (patch: Partial<BuilderModel>) =>
    onChange({ ...value, ...patch });

  // ── Milestone ops ─────────────────────────────────────────────────────
  const addMilestone = () => {
    update({
      milestones: [
        ...value.milestones,
        {
          milestone: newMilestone(value.milestones.length),
          tasks: [],
          thresholds: [],
        },
      ],
    });
  };

  const removeMilestone = (idx: number) => {
    update({ milestones: value.milestones.filter((_, i) => i !== idx) });
  };

  const moveMilestone = (idx: number, dir: -1 | 1) => {
    const next = [...value.milestones];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    update({ milestones: next });
  };

  const patchMilestone = (
    idx: number,
    patch: Partial<BuilderModel["milestones"][number]["milestone"]>,
  ) => {
    const next = [...value.milestones];
    next[idx] = {
      ...next[idx],
      milestone: { ...next[idx].milestone, ...patch },
    };
    update({ milestones: next });
  };

  // ── Task ops ──────────────────────────────────────────────────────────
  const addTask = (mi: number) => {
    const next = [...value.milestones];
    next[mi] = {
      ...next[mi],
      tasks: [...next[mi].tasks, newTask(mi)],
    };
    update({ milestones: next });
  };

  const removeTask = (mi: number, ti: number) => {
    const next = [...value.milestones];
    next[mi] = {
      ...next[mi],
      tasks: next[mi].tasks.filter((_, i) => i !== ti),
    };
    update({ milestones: next });
  };

  const patchTask = (
    mi: number,
    ti: number,
    patch: Partial<BuilderModel["milestones"][number]["tasks"][number]>,
  ) => {
    const next = [...value.milestones];
    const tasks = [...next[mi].tasks];
    tasks[ti] = { ...tasks[ti], ...patch };
    next[mi] = { ...next[mi], tasks };
    update({ milestones: next });
  };

  // ── Threshold ops (per-milestone, max 4 unique sensor types) ─────────
  const addThreshold = (mi: number) => {
    const used = new Set(
      value.milestones[mi].thresholds.map((t) => t.sensorType as SensorTypeT),
    );
    const next_sensor = ALL_SENSOR_TYPES.find((s) => !used.has(s));
    if (!next_sensor) return;
    const next = [...value.milestones];
    next[mi] = {
      ...next[mi],
      thresholds: [...next[mi].thresholds, newThreshold(mi, next_sensor)],
    };
    update({ milestones: next });
  };

  const removeThreshold = (mi: number, ti: number) => {
    const next = [...value.milestones];
    next[mi] = {
      ...next[mi],
      thresholds: next[mi].thresholds.filter((_, i) => i !== ti),
    };
    update({ milestones: next });
  };

  const patchThreshold = (
    mi: number,
    ti: number,
    patch: Partial<BuilderModel["milestones"][number]["thresholds"][number]>,
  ) => {
    const next = [...value.milestones];
    const arr = [...next[mi].thresholds];
    arr[ti] = { ...arr[ti], ...patch };
    next[mi] = { ...next[mi], thresholds: arr };
    update({ milestones: next });
  };

  return (
    <div className="space-y-4">
      {/* ── Milestones list ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-600" />
            Giai đoạn (Milestones)
          </h3>
          <p className="text-xs text-muted-foreground">
            Mỗi giai đoạn có thể đính kèm công việc và ngưỡng cảm biến riêng.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMilestone}
        >
          <Plus className="mr-1 h-4 w-4" />
          Thêm giai đoạn
        </Button>
      </div>

      {value.milestones.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chưa có giai đoạn nào. Bắt đầu bằng cách thêm giai đoạn đầu tiên.
        </div>
      ) : (
        <Accordion
          type="multiple"
          className="space-y-2"
          defaultValue={value.milestones.map((_, i) => `m-${i}`)}
        >
          {value.milestones.map((g, mi) => {
            const usedSensors = new Set(
              g.thresholds.map((t) => t.sensorType as SensorTypeT),
            );
            const thresholdsFull = g.thresholds.length >= ALL_SENSOR_TYPES.length;

            return (
              <AccordionItem
                key={mi}
                value={`m-${mi}`}
                className="rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2 px-3 pt-2">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 border-emerald-200"
                  >
                    #{mi + 1}
                  </Badge>
                  <span className="font-medium truncate flex-1">
                    {g.milestone.stageName || "(chưa đặt tên)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {g.tasks.length} task · {g.thresholds.length} ngưỡng
                  </span>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveMilestone(mi, -1);
                          }}
                          disabled={mi === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Lên</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveMilestone(mi, 1);
                          }}
                          disabled={mi === value.milestones.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Xuống</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMilestone(mi);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Xoá</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <AccordionTrigger className="px-3 py-2 text-xs">
                  Chi tiết
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-3 pb-4">
                  {/* Milestone fields */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Tên giai đoạn *</Label>
                      <Input
                        value={g.milestone.stageName}
                        onChange={(e) =>
                          patchMilestone(mi, { stageName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" /> Bắt đầu (ngày)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={g.milestone.dayOffset}
                        onChange={(e) =>
                          patchMilestone(mi, {
                            dayOffset: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Thời lượng (ngày)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={g.milestone.expectedDuration}
                        onChange={(e) =>
                          patchMilestone(mi, {
                            expectedDuration: Number(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2 md:col-span-4 space-y-1">
                      <Label className="text-xs">Ghi chú gợi ý</Label>
                      <Textarea
                        rows={2}
                        value={g.milestone.suggestedNotes ?? ""}
                        onChange={(e) =>
                          patchMilestone(mi, {
                            suggestedNotes: e.target.value || null,
                          })
                        }
                        placeholder="Vd: bón lót trước khi gieo hạt..."
                      />
                    </div>
                  </div>

                  {/* Tasks */}
                  <Card className="bg-muted/30">
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold flex items-center gap-1">
                          <ListChecks className="h-3.5 w-3.5" /> Công việc gợi ý
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTask(mi)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Thêm task
                        </Button>
                      </div>
                      {g.tasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Chưa có công việc.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {g.tasks.map((t, ti) => (
                            <div
                              key={ti}
                              className="grid grid-cols-12 gap-2 rounded-md border bg-background p-2"
                            >
                              <Input
                                className="col-span-5"
                                placeholder="Tên công việc *"
                                value={t.title}
                                onChange={(e) =>
                                  patchTask(mi, ti, { title: e.target.value })
                                }
                              />
                              <Select
                                value={t.priority ?? "medium"}
                                onValueChange={(v) =>
                                  patchTask(mi, ti, {
                                    priority: v as PriorityT,
                                  })
                                }
                              >
                                <SelectTrigger className="col-span-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(
                                    Object.keys(PRIORITY_LABEL) as PriorityT[]
                                  ).map((p) => (
                                    <SelectItem
                                      key={p}
                                      value={p}
                                    >
                                      {PRIORITY_LABEL[p]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                className="col-span-4"
                                placeholder="Mô tả ngắn"
                                value={t.description ?? ""}
                                onChange={(e) =>
                                  patchTask(mi, ti, {
                                    description: e.target.value || null,
                                  })
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="col-span-1"
                                onClick={() => removeTask(mi, ti)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Thresholds — max 4, unique sensor type per row */}
                  <Card className="bg-muted/30">
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5" /> Ngưỡng cảm biến
                          {g.thresholds.length > 0 && (
                            <span className="text-muted-foreground font-normal">
                              ({g.thresholds.length}/{ALL_SENSOR_TYPES.length})
                            </span>
                          )}
                        </div>
                        {!thresholdsFull && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addThreshold(mi)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Thêm ngưỡng
                          </Button>
                        )}
                      </div>
                      {g.thresholds.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Chưa có ngưỡng cảm biến.
                        </p>
                      ) : (
                        <MilestoneThresholdList
                          thresholds={g.thresholds}
                          usedSensors={usedSensors}
                          onPatch={(ti, p) => patchThreshold(mi, ti, p)}
                          onRemove={(ti) => removeThreshold(mi, ti)}
                        />
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

// ── Milestone threshold list (unique sensor type, select shows only available) ──

interface MilestoneThresholdListProps {
  thresholds: BuilderModel["milestones"][number]["thresholds"];
  usedSensors: Set<SensorTypeT>;
  onPatch: (
    idx: number,
    patch: Partial<BuilderModel["milestones"][number]["thresholds"][number]>,
  ) => void;
  onRemove: (idx: number) => void;
}

function MilestoneThresholdList({
  thresholds,
  usedSensors,
  onPatch,
  onRemove,
}: MilestoneThresholdListProps) {
  return (
    <div className="space-y-2">
      {thresholds.map((th, ti) => {
        // Show: current row's sensor + any sensor not used by other rows
        const available = ALL_SENSOR_TYPES.filter(
          (s) => s === th.sensorType || !usedSensors.has(s),
        );

        return (
          <div
            key={ti}
            className="grid grid-cols-12 gap-2 rounded-md border bg-background p-2"
          >
            <Select
              value={th.sensorType}
              onValueChange={(v) =>
                onPatch(ti, { sensorType: v as SensorTypeT })
              }
            >
              <SelectTrigger className="col-span-5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {available.map((s) => {
                  const SIcon = SENSOR_TYPE_ICON[s];
                  return (
                    <SelectItem
                      key={s}
                      value={s}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {SIcon && <SIcon className="h-3.5 w-3.5 text-primary" />}
                        {SENSOR_TYPE_LABEL[s]}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Input
              className="col-span-3"
              type="number"
              placeholder="Min"
              value={th.optimalMin}
              onChange={(e) =>
                onPatch(ti, { optimalMin: Number(e.target.value) })
              }
            />
            <Input
              className="col-span-3"
              type="number"
              placeholder="Max"
              value={th.optimalMax}
              onChange={(e) =>
                onPatch(ti, { optimalMax: Number(e.target.value) })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-1"
              onClick={() => onRemove(ti)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
