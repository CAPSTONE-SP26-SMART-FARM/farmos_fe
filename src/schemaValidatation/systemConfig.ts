import { z } from "zod";

// Module 3 — SystemConfig (B18). Schema 1-1 với BE
// `farm_os_be/src/modules/system-config/system-config.model.ts`.
//
// QUAN TRỌNG: BE endpoint là `PATCH /admin/system-configs/:key` (single-key
// upsert), không phải batch. FE form A3 phải gọi tuần tự N lần.

export const SystemConfigValueTypeSchema = z.enum([
  "number",
  "boolean",
  "string",
  "json",
]);

export const SystemConfigItemSchema = z.object({
  key: z.string(),
  value: z.string(),
  // BE response field là `valueType` (không phải `type`).
  valueType: z.string(), // BE để string đơn giản, không enum strict ở response
  description: z.string().nullable(),
  updatedBy: z.string().uuid().nullable(),
  updatedAt: z.string().datetime(),
});

export const ListSystemConfigsQuerySchema = z.object({
  prefix: z.string().optional(),
});

export const SystemConfigListResSchema = z.object({
  data: z.array(SystemConfigItemSchema),
});

// BE body: {value: string, valueType: enum default "number", description?: string|null}
export const UpsertSystemConfigBodySchema = z.object({
  value: z.string(),
  valueType: SystemConfigValueTypeSchema.default("number"),
  description: z.string().nullable().optional(),
});

// ── Form schema cho A3 (9 ticket key, validate cross-field) ──
// Min/max + chú thích nghiệp vụ theo BE seeds (system-config.model.ts:33-43).
export const TicketSystemConfigFormSchema = z
  .object({
    auto_close_hours: z
      .number()
      .int()
      .min(1, "Tối thiểu 1 giờ.")
      .max(168, "Tối đa 168 giờ (7 ngày)."),
    doctor_silence_minutes: z
      .number()
      .int()
      .min(5, "Tối thiểu 5 phút.")
      .max(1440, "Tối đa 1440 phút (24 giờ)."),
    priority_window_platinum_sec: z
      .number()
      .int()
      .min(0)
      .max(600, "Tối đa 600 giây."),
    priority_window_gold_sec: z
      .number()
      .int()
      .min(0)
      .max(600, "Tối đa 600 giây."),
    priority_window_fanout_sec: z
      .number()
      .int()
      .min(0)
      .max(1800, "Tối đa 1800 giây."),
    ai_fallback_minutes: z
      .number()
      .int()
      .min(1, "Tối thiểu 1 phút.")
      .max(60, "Tối đa 60 phút."),
    // BR-74 + BR-100 — fraction 0..1 (vd 0.667 = 2/3).
    auto_close_notify_at_fraction: z
      .number()
      .min(0, "Tối thiểu 0.")
      .max(1, "Tối đa 1 (100%)."),
    commission_max_percent: z
      .number()
      .min(1, "Tối thiểu 1%.")
      .max(100, "Tối đa 100%."),
    rating_max_stars: z
      .number()
      .int()
      .min(3, "Tối thiểu 3 sao.")
      .max(10, "Tối đa 10 sao."),
  })
  .superRefine((data, ctx) => {
    if (data.priority_window_gold_sec < data.priority_window_platinum_sec) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priority_window_gold_sec"],
        message: "Phải lớn hơn hoặc bằng cửa sổ PLATINUM.",
      });
    }
    if (data.priority_window_fanout_sec < data.priority_window_gold_sec) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priority_window_fanout_sec"],
        message: "Phải lớn hơn hoặc bằng cửa sổ GOLD.",
      });
    }
  });

// Mapping FE form key (snake) ↔ BE config key (dot-notation).
// 9 ticket keys + valueType cho mỗi key (đa số "number", riêng `auto_close_notify_at_fraction` cũng "number").
export const TICKET_SYSTEM_CONFIG_KEY_MAP = {
  auto_close_hours: "ticket.auto_close_hours",
  doctor_silence_minutes: "ticket.doctor_silence_minutes",
  priority_window_platinum_sec: "ticket.priority_window.platinum_sec",
  priority_window_gold_sec: "ticket.priority_window.gold_sec",
  priority_window_fanout_sec: "ticket.priority_window.fanout_sec",
  ai_fallback_minutes: "ticket.ai_fallback_minutes",
  auto_close_notify_at_fraction: "ticket.auto_close_notify_at_fraction",
  commission_max_percent: "ticket.commission_max_percent",
  rating_max_stars: "ticket.rating_max_stars",
} as const;

export type TicketSystemConfigFormKey = keyof typeof TICKET_SYSTEM_CONFIG_KEY_MAP;

export type SystemConfigValueTypeType = z.infer<
  typeof SystemConfigValueTypeSchema
>;
export type SystemConfigItemType = z.infer<typeof SystemConfigItemSchema>;
export type ListSystemConfigsQueryType = z.infer<
  typeof ListSystemConfigsQuerySchema
>;
export type SystemConfigListResType = z.infer<typeof SystemConfigListResSchema>;
export type UpsertSystemConfigBodyType = z.infer<
  typeof UpsertSystemConfigBodySchema
>;
export type TicketSystemConfigFormType = z.infer<
  typeof TicketSystemConfigFormSchema
>;
