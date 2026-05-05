import type {
  MilestoneConfigT,
  SeasonTemplateItemResT,
  TaskConfigT,
  TemplateItemConfigT,
  TemplateItemInputT,
  ThresholdConfigT,
} from "@/schemaValidatation/seasonTemplate";

// ── Group typed-by-kind structure (UI-only model) ─────────────────────────
// Server stores items as a flat array of {itemType, orderNo, config(kind=...)}
// FE treats template as an ordered list of milestones, each with nested
// tasks + thresholds. Convert in/out.

export interface MilestoneGroup {
  milestone: MilestoneConfigT;
  tasks: TaskConfigT[];
  thresholds: ThresholdConfigT[];
}

export interface BuilderModel {
  milestones: MilestoneGroup[];
  /** @deprecated season-level thresholds removed from UI; kept for backward-compat when reading old BE data */
  seasonThresholds: ThresholdConfigT[];
}

export const emptyBuilder = (): BuilderModel => ({
  milestones: [],
  seasonThresholds: [],
});

export const newMilestone = (order: number): MilestoneConfigT => ({
  kind: "milestone",
  stageName: `Giai đoạn ${order + 1}`,
  milestoneOrder: order,
  dayOffset: 0,
  expectedDuration: 7,
  suggestedNotes: null,
});

export const newTask = (parentOrder: number): TaskConfigT => ({
  kind: "task",
  title: "",
  description: null,
  priority: "medium",
  expectedDurationDays: 1,
  parentMilestoneOrder: parentOrder,
});

export const newThreshold = (
  parentOrder: number | null = null,
  sensorType: ThresholdConfigT["sensorType"] = "soil_moisture",
): ThresholdConfigT => ({
  kind: "threshold",
  sensorType,
  optimalMin: 0,
  optimalMax: 100,
  parentMilestoneOrder: parentOrder,
});

// Convert BE detail.items → builder model
export const fromItems = (
  items: SeasonTemplateItemResT[],
): BuilderModel => {
  const milestonesByOrder = new Map<number, MilestoneGroup>();
  const seasonThresholds: ThresholdConfigT[] = [];

  // Pass 1 — collect milestones
  for (const it of items) {
    const cfg = it.config as TemplateItemConfigT | undefined;
    if (!cfg) continue;
    if (cfg.kind === "milestone") {
      milestonesByOrder.set(cfg.milestoneOrder, {
        milestone: cfg,
        tasks: [],
        thresholds: [],
      });
    }
  }

  // Pass 2 — attach tasks + thresholds
  for (const it of items) {
    const cfg = it.config as TemplateItemConfigT | undefined;
    if (!cfg) continue;
    if (cfg.kind === "task") {
      const grp = milestonesByOrder.get(cfg.parentMilestoneOrder);
      if (grp) grp.tasks.push(cfg);
    } else if (cfg.kind === "threshold") {
      if (cfg.parentMilestoneOrder == null) {
        seasonThresholds.push(cfg);
      } else {
        const grp = milestonesByOrder.get(cfg.parentMilestoneOrder);
        if (grp) grp.thresholds.push(cfg);
        else seasonThresholds.push(cfg);
      }
    }
  }

  const ordered = [...milestonesByOrder.values()].sort(
    (a, b) => a.milestone.milestoneOrder - b.milestone.milestoneOrder,
  );

  return { milestones: ordered, seasonThresholds };
};

// Convert builder model → flat items[] for BE
export const toItems = (model: BuilderModel): TemplateItemInputT[] => {
  const out: TemplateItemInputT[] = [];
  let order = 0;

  // Renumber milestoneOrder for stability + reflect onto children
  const normalized = model.milestones.map((g, idx) => ({
    ...g,
    milestone: { ...g.milestone, milestoneOrder: idx },
    tasks: g.tasks.map((t) => ({ ...t, parentMilestoneOrder: idx })),
    thresholds: g.thresholds.map((t) => ({ ...t, parentMilestoneOrder: idx })),
  }));

  for (const g of normalized) {
    out.push({ itemType: "activity", orderNo: order++, config: g.milestone });
    for (const t of g.tasks)
      out.push({ itemType: "activity", orderNo: order++, config: t });
    for (const th of g.thresholds)
      out.push({ itemType: "metric", orderNo: order++, config: th });
  }
  // season-level thresholds intentionally excluded from UI — not sent to BE

  return out;
};

export const summarize = (model: BuilderModel) => {
  const milestones = model.milestones.length;
  const tasks = model.milestones.reduce((s, g) => s + g.tasks.length, 0);
  const thresholds =
    model.milestones.reduce((s, g) => s + g.thresholds.length, 0) +
    model.seasonThresholds.length;
  return { milestones, tasks, thresholds };
};
