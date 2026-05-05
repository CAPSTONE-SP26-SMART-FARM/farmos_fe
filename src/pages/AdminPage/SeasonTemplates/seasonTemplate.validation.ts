import { z } from "zod";
import {
  CreateSeasonTemplateBodySchema,
  FarmTypeSchema,
  SENSOR_TYPE_LABEL,
  type SensorTypeT,
} from "@/schemaValidatation/seasonTemplate";
import type { BuilderModel } from "./seasonTemplate.helpers";
import { toItems } from "./seasonTemplate.helpers";

// Strict FE-only validation. Mirror BE Zod (`season-template.model.ts`) AND
// add UX-level invariants that BE does not enforce explicitly:
//   - optimalMin <= optimalMax for every threshold
//   - no duplicate sensorType inside the same milestone (or season-level group)
//   - stageName must be unique across milestones
// Errors are returned as a flat list keyed by `section + path` so the page can
// surface them next to the relevant section header.

export type SectionKey = "basic" | "milestones";

export interface FieldError {
  section: SectionKey;
  path: string;
  message: string;
}

const NAME_MAX = 255;
const DESC_MAX = 1000;
const STAGE_NAME_MAX = 100;
const TITLE_MAX = 255;

export const BasicInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên mẫu là bắt buộc.")
    .max(NAME_MAX, `Tên mẫu tối đa ${NAME_MAX} ký tự.`),
  description: z
    .string()
    .max(DESC_MAX, `Mô tả tối đa ${DESC_MAX} ký tự.`)
    .nullable()
    .optional(),
  farmType: FarmTypeSchema,
});
export type BasicInfoT = z.infer<typeof BasicInfoSchema>;

interface ValidateInput {
  basic: { name: string; description: string; farmType: string };
  model: BuilderModel;
}

export interface ValidationResult {
  ok: boolean;
  errors: FieldError[];
  bySection: Record<SectionKey, FieldError[]>;
}

const empty = (): ValidationResult => ({
  ok: true,
  errors: [],
  bySection: { basic: [], milestones: [] },
});

export function validateAll(input: ValidateInput): ValidationResult {
  const result = empty();
  const push = (e: FieldError) => {
    result.errors.push(e);
    result.bySection[e.section].push(e);
    result.ok = false;
  };

  // ── Basic info ──────────────────────────────────────────────────────────
  const basicParse = BasicInfoSchema.safeParse({
    name: input.basic.name,
    description: input.basic.description || null,
    farmType: input.basic.farmType,
  });
  if (!basicParse.success) {
    for (const issue of basicParse.error.issues) {
      push({
        section: "basic",
        path: issue.path.join(".") || "name",
        message: issue.message,
      });
    }
  }

  // ── Milestones ──────────────────────────────────────────────────────────
  const m = input.model.milestones;
  if (m.length === 0) {
    push({
      section: "milestones",
      path: "milestones",
      message: "Mẫu phải có ít nhất 1 giai đoạn.",
    });
  }

  const stageNames = new Set<string>();
  m.forEach((g, mi) => {
    const ms = g.milestone;
    if (!ms.stageName.trim()) {
      push({
        section: "milestones",
        path: `milestones.${mi}.stageName`,
        message: `Giai đoạn #${mi + 1}: Tên giai đoạn là bắt buộc.`,
      });
    } else if (ms.stageName.length > STAGE_NAME_MAX) {
      push({
        section: "milestones",
        path: `milestones.${mi}.stageName`,
        message: `Giai đoạn #${mi + 1}: Tên giai đoạn tối đa ${STAGE_NAME_MAX} ký tự.`,
      });
    } else {
      const key = ms.stageName.trim().toLowerCase();
      if (stageNames.has(key)) {
        push({
          section: "milestones",
          path: `milestones.${mi}.stageName`,
          message: `Giai đoạn #${mi + 1}: Tên giai đoạn bị trùng.`,
        });
      }
      stageNames.add(key);
    }

    if (!Number.isInteger(ms.dayOffset) || ms.dayOffset < 0) {
      push({
        section: "milestones",
        path: `milestones.${mi}.dayOffset`,
        message: `Giai đoạn #${mi + 1}: Ngày bắt đầu phải là số nguyên ≥ 0.`,
      });
    }
    if (!Number.isInteger(ms.expectedDuration) || ms.expectedDuration < 1) {
      push({
        section: "milestones",
        path: `milestones.${mi}.expectedDuration`,
        message: `Giai đoạn #${mi + 1}: Thời lượng phải ≥ 1 ngày.`,
      });
    }

    // Tasks
    g.tasks.forEach((t, ti) => {
      if (!t.title.trim()) {
        push({
          section: "milestones",
          path: `milestones.${mi}.tasks.${ti}.title`,
          message: `Giai đoạn #${mi + 1} · Công việc #${ti + 1}: Tên công việc là bắt buộc.`,
        });
      } else if (t.title.length > TITLE_MAX) {
        push({
          section: "milestones",
          path: `milestones.${mi}.tasks.${ti}.title`,
          message: `Giai đoạn #${mi + 1} · Công việc #${ti + 1}: Tên công việc tối đa ${TITLE_MAX} ký tự.`,
        });
      }
      if (
        t.expectedDurationDays != null &&
        (!Number.isInteger(t.expectedDurationDays) ||
          t.expectedDurationDays < 1)
      ) {
        push({
          section: "milestones",
          path: `milestones.${mi}.tasks.${ti}.expectedDurationDays`,
          message: `Giai đoạn #${mi + 1} · Công việc #${ti + 1}: Thời lượng phải ≥ 1 ngày.`,
        });
      }
    });

    // Per-milestone thresholds
    const seenSensors = new Set<SensorTypeT>();
    g.thresholds.forEach((th, ti) => {
      if (th.optimalMin > th.optimalMax) {
        push({
          section: "milestones",
          path: `milestones.${mi}.thresholds.${ti}.range`,
          message: `Giai đoạn #${mi + 1} · ${SENSOR_TYPE_LABEL[th.sensorType as SensorTypeT] ?? th.sensorType}: Min phải ≤ Max.`,
        });
      }
      if (seenSensors.has(th.sensorType as SensorTypeT)) {
        push({
          section: "milestones",
          path: `milestones.${mi}.thresholds.${ti}.sensorType`,
          message: `Giai đoạn #${mi + 1}: Trùng cảm biến "${SENSOR_TYPE_LABEL[th.sensorType as SensorTypeT] ?? th.sensorType}".`,
        });
      }
      seenSensors.add(th.sensorType as SensorTypeT);
    });
  });

  // ── Final structural sanity (mirrors BE strict body schema) ─────────────
  if (result.ok) {
    const items = toItems(input.model);
    const beParse = CreateSeasonTemplateBodySchema.safeParse({
      name: input.basic.name.trim(),
      description: input.basic.description.trim() || null,
      farmType: input.basic.farmType,
      items,
    });
    if (!beParse.success) {
      for (const issue of beParse.error.issues) {
        push({
          section: "milestones",
          path: issue.path.join("."),
          message: issue.message,
        });
      }
    }
  }

  return result;
}
