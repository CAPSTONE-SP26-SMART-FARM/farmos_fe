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
// Khớp 1-1 với BE response thực tế của `GET /admin/system-configs?prefix=ticket.`
// (xem ví dụ trong PR notes 2026-05-09). Toàn bộ 9 key đều `valueType: "number"`.
export const TicketSystemConfigFormSchema = z
  .object({
    // Auto-close window: BE lưu seconds; cho phép tối thiểu 1 giờ (3600s),
    // tối đa 14 ngày (1209600s).
    auto_close_window_seconds: z
      .number()
      .int()
      .min(3600, "Tối thiểu 3600 giây (1 giờ).")
      .max(1209600, "Tối đa 1209600 giây (14 ngày)."),
    // BR-74 + BR-100 — fraction 0..1 (vd 0.667 = 2/3 thời gian grace).
    auto_close_reminder_fraction: z
      .number()
      .min(0, "Tối thiểu 0.")
      .max(1, "Tối đa 1 (100%)."),
    // Doctor inactivity timer: seconds. Tối thiểu 5 phút (300s), tối đa 7 ngày.
    doctor_inactivity_timeout_seconds: z
      .number()
      .int()
      .min(300, "Tối thiểu 300 giây (5 phút).")
      .max(604800, "Tối đa 604800 giây (7 ngày)."),
    // AI fallback: seconds. Tối thiểu 60s, tối đa 1 giờ (3600s).
    ai_fallback_timeout_seconds: z
      .number()
      .int()
      .min(60, "Tối thiểu 60 giây (1 phút).")
      .max(3600, "Tối đa 3600 giây (1 giờ)."),
    // BR-67: tier broadcast windows (seconds, lũy tiến).
    broadcast_tier1_delay_seconds: z
      .number()
      .int()
      .min(0)
      .max(600, "Tối đa 600 giây."),
    broadcast_tier2_delay_seconds: z
      .number()
      .int()
      .min(0)
      .max(600, "Tối đa 600 giây."),
    broadcast_tier3_delay_seconds: z
      .number()
      .int()
      .min(0)
      .max(1800, "Tối đa 1800 giây."),
    // BR-76: số ký tự tối thiểu cho hướng dẫn dùng thuốc.
    prescription_usage_min_chars: z
      .number()
      .int()
      .min(1, "Tối thiểu 1 ký tự.")
      .max(500, "Tối đa 500 ký tự."),
    // BR-73: số ký tự tối thiểu cho mỗi field giải pháp (4 field).
    solution_field_min_chars: z
      .number()
      .int()
      .min(1, "Tối thiểu 1 ký tự.")
      .max(500, "Tối đa 500 ký tự."),
  })
  .superRefine((data, ctx) => {
    if (
      data.broadcast_tier2_delay_seconds < data.broadcast_tier1_delay_seconds
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["broadcast_tier2_delay_seconds"],
        message: "Phải lớn hơn hoặc bằng cửa sổ Bạch kim.",
      });
    }
    if (
      data.broadcast_tier3_delay_seconds < data.broadcast_tier2_delay_seconds
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["broadcast_tier3_delay_seconds"],
        message: "Phải lớn hơn hoặc bằng cửa sổ Vàng.",
      });
    }
  });

// Mapping FE form key (snake) ↔ BE config key (dot-notation).
// Khớp 1-1 với BE response của `GET /admin/system-configs?prefix=ticket.`.
export const TICKET_SYSTEM_CONFIG_KEY_MAP = {
  auto_close_window_seconds: "ticket.auto_close_window_seconds",
  auto_close_reminder_fraction: "ticket.auto_close_reminder_fraction",
  doctor_inactivity_timeout_seconds: "ticket.doctor_inactivity_timeout_seconds",
  ai_fallback_timeout_seconds: "ticket.ai_fallback_timeout_seconds",
  broadcast_tier1_delay_seconds: "ticket.broadcast_tier1_delay_seconds",
  broadcast_tier2_delay_seconds: "ticket.broadcast_tier2_delay_seconds",
  broadcast_tier3_delay_seconds: "ticket.broadcast_tier3_delay_seconds",
  prescription_usage_min_chars: "ticket.prescription_usage_min_chars",
  solution_field_min_chars: "ticket.solution_field_min_chars",
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
