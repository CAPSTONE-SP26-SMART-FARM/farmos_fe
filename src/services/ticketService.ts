import { API_ENDPOINTS } from "@/constants/endpoints";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type {
  CloseTicketBodyType,
  CreateIncidentTicketBodyType,
  ListIncidentTicketsQueryType,
  TicketFullResType,
  TicketIncidentListResType,
  TicketIncidentResType,
} from "@/schemaValidatation/ticket";
import type {
  CreatePrescriptionBodyType,
  PrescriptionListResType,
  PrescriptionResType,
} from "@/schemaValidatation/prescription";
import type {
  CreateTicketMessageBodyType,
  TicketMessageListResType,
  TicketMessageResType,
} from "@/schemaValidatation/ticketMessage";
import type {
  InvalidateRatingBodyType,
  RatingResType,
  SubmitRatingBodyType,
} from "@/schemaValidatation/rating";
import type { AbandonTicketBodyType } from "@/schemaValidatation/abandonLog";
import type { MessageResType } from "@/types/api";

const T = API_ENDPOINTS.TICKET;
const ADMIN_T = API_ENDPOINTS.ADMIN_TICKETS;

const ticketService = {
  // Owner/Manager đã migrate sang ticketV2Service (`GET /tickets[/:id]`).
  // Các endpoint legacy `/ticket/incident/owner|manager/*` không còn dùng
  // ở FE web — xem memory project_ticket_v2_migration.

  // ── Incident (Doctor) ─────────────────────────────────────────────────
  doctorList: (query: ListIncidentTicketsQueryType) =>
    api.get<TicketIncidentListResType>(
      `${T.INCIDENT.DOCTOR_LIST}?${queryString.stringify(query, { skipNull: true, skipEmptyString: true })}`,
    ),

  doctorDetail: (ticketId: string) =>
    api.get<TicketIncidentResType>(T.INCIDENT.DOCTOR_DETAIL(ticketId)),

  doctorAccept: (ticketId: string) =>
    api.put<TicketIncidentResType, Record<string, never>>(
      T.INCIDENT.DOCTOR_ACCEPT(ticketId),
    ),

  // ── Incident (shared create / end) ────────────────────────────────────
  createIncident: (body: CreateIncidentTicketBodyType) =>
    api.post<TicketIncidentResType, CreateIncidentTicketBodyType>(
      T.INCIDENT.CREATE,
      body,
    ),

  endIncident: (ticketId: string) =>
    api.put<TicketIncidentResType, Record<string, never>>(
      T.INCIDENT.END(ticketId),
    ),

  // ── Messages ──────────────────────────────────────────────────────────
  listMessages: (ticketId: string, query: { page: number; limit: number }) =>
    api.get<TicketMessageListResType>(
      `${T.MESSAGES.LIST(ticketId)}?${queryString.stringify(query, { skipNull: true, skipEmptyString: true })}`,
    ),

  createMessage: (ticketId: string, body: CreateTicketMessageBodyType) =>
    api.post<TicketMessageResType, CreateTicketMessageBodyType>(
      T.MESSAGES.CREATE(ticketId),
      body,
    ),

  // ── Prescriptions ─────────────────────────────────────────────────────
  listPrescriptions: (
    ticketId: string,
    query: { page: number; limit: number },
  ) =>
    api.get<PrescriptionListResType>(
      `${T.PRESCRIPTIONS.LIST(ticketId)}?${queryString.stringify(query, { skipNull: true, skipEmptyString: true })}`,
    ),

  createPrescription: (ticketId: string, body: CreatePrescriptionBodyType) =>
    api.post<PrescriptionResType, CreatePrescriptionBodyType>(
      T.PRESCRIPTIONS.CREATE(ticketId),
      body,
    ),

  getPrescriptionDetail: (ticketId: string, prescriptionId: string) =>
    api.get<PrescriptionResType>(
      T.PRESCRIPTIONS.DETAIL(ticketId, prescriptionId),
    ),

  // ── Module 3 — Ticket Quality actions (B5/B6/B7/B8 + Admin B17) ─────────
  // CHÚ Ý: KHÔNG reuse `endIncident` (PUT /end) cho close — endpoint cũ chỉ
  // end-of-chat, không trigger payout. Module 3 dùng `closeByCreator` (B5).

  // B8 — Full payload (Owner/Manager/Admin tuỳ role).
  getFull: (ticketId: string) =>
    api.get<TicketFullResType>(T.FULL(ticketId)),

  // B5 — Creator (Owner/Manager) đóng ticket. Body `{confirmed?: bool, note?: string}`.
  // BE default `confirmed=true`. Idempotent qua `closedAt IS NULL`.
  // Edge case 6.1: race với auto-close (B22) → BE 409 → caller hiển thị toast.
  closeByCreator: (ticketId: string, body: CloseTicketBodyType = {}) =>
    api.post<MessageResType, CloseTicketBodyType>(T.CLOSE(ticketId), body),

  // B6 — Creator rate ticket. UNIQUE(ticketId) → BE 409 nếu đã rate.
  // AI ticket: BE từ chối (BR-79); FE ẩn UI rate khi `isAIResolved=true`.
  // Body BE: {stars 1-5, feedback?, tags?}.
  rateByCreator: (ticketId: string, body: SubmitRatingBodyType) =>
    api.post<RatingResType, SubmitRatingBodyType>(T.RATING(ticketId), body),

  // B7 — Creator chọn FALLBACK_AI hoặc REFUND_TICKET khi Doctor im lặng.
  // Body BE: {resolution, note?} — KHÔNG phải `reason`.
  abandonResolution: (ticketId: string, body: AbandonTicketBodyType) =>
    api.post<MessageResType, AbandonTicketBodyType>(
      T.ABANDON(ticketId),
      body,
    ),

  // ── Admin actions (B17 + admin full) ──
  adminGetFull: (ticketId: string) =>
    api.get<TicketFullResType>(ADMIN_T.FULL(ticketId)),

  // B17 — Vô hiệu rating. Sau invalidate, BE chạy lại DQS calculator vào cron đêm.
  adminInvalidateRating: (ticketId: string, body: InvalidateRatingBodyType) =>
    api.post<MessageResType, InvalidateRatingBodyType>(
      ADMIN_T.INVALIDATE_RATING(ticketId),
      body,
    ),
};

export default ticketService;
