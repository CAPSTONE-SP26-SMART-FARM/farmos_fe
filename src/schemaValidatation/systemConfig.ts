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

// ── Form schema cho A3 (7 ticket key, validate cross-field) ──
// Khớp 1-1 với BE `TICKET_SYSTEM_CONFIG_SEEDS` trong
// `farm_os_be/src/modules/system-config/system-config.model.ts`. Đơn vị (giờ /
// phút / giây) theo đúng tên key BE để admin chỉnh đúng giá trị runtime đọc.
export const TicketSystemConfigFormSchema = z
  .object({
    // BR-74: auto-close window tính bằng GIỜ. Min 1 giờ, max 14 ngày (336 giờ).
    auto_close_hours: z
      .number()
      .int()
      .min(1, "Tối thiểu 1 giờ.")
      .max(336, "Tối đa 336 giờ (14 ngày)."),
    // BR-74 + BR-100 — fraction 0..1 (vd 0.667 = 2/3 thời gian grace).
    auto_close_notify_at_fraction: z
      .number()
      .min(0, "Tối thiểu 0.")
      .max(1, "Tối đa 1 (100%)."),
    // BR-72: doctor silence timer tính bằng PHÚT. Min 5 phút, max 7 ngày (10080
    // phút). Giá trị này là fallback khi không có override theo severity.
    doctor_silence_minutes: z
      .number()
      .int()
      .min(5, "Tối thiểu 5 phút.")
      .max(10080, "Tối đa 10080 phút (7 ngày)."),
    // BR-70: AI fallback tính bằng PHÚT. Min 1 phút, max 60 phút.
    ai_fallback_minutes: z
      .number()
      .int()
      .min(1, "Tối thiểu 1 phút.")
      .max(60, "Tối đa 60 phút."),
    // BR-67: tier broadcast windows tính bằng GIÂY (lũy tiến).
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
  })
  .superRefine((data, ctx) => {
    if (data.priority_window_gold_sec < data.priority_window_platinum_sec) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priority_window_gold_sec"],
        message: "Phải lớn hơn hoặc bằng cửa sổ Bạch kim.",
      });
    }
    if (data.priority_window_fanout_sec < data.priority_window_gold_sec) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priority_window_fanout_sec"],
        message: "Phải lớn hơn hoặc bằng cửa sổ Vàng.",
      });
    }
  });

// Mapping FE form key (snake) ↔ BE config key (dot-notation).
// Khớp 1-1 với BE response của `GET /admin/system-configs?prefix=ticket.`.
export const TICKET_SYSTEM_CONFIG_KEY_MAP = {
  auto_close_hours: "ticket.auto_close_hours",
  auto_close_notify_at_fraction: "ticket.auto_close_notify_at_fraction",
  doctor_silence_minutes: "ticket.doctor_silence_minutes",
  ai_fallback_minutes: "ticket.ai_fallback_minutes",
  priority_window_platinum_sec: "ticket.priority_window.platinum_sec",
  priority_window_gold_sec: "ticket.priority_window.gold_sec",
  priority_window_fanout_sec: "ticket.priority_window.fanout_sec",
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
