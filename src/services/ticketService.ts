import { API_ENDPOINTS } from "@/constants/endpoints";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type {
  CreateIncidentTicketBodyType,
  ListIncidentTicketsQueryType,
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

const T = API_ENDPOINTS.TICKET;

const ticketService = {
  // ── Incident (Owner) ──────────────────────────────────────────────────
  ownerListByFarm: (farmId: string, query: ListIncidentTicketsQueryType) =>
    api.get<TicketIncidentListResType>(
      `${T.INCIDENT.OWNER_LIST_BY_FARM(farmId)}?${queryString.stringify(query, { skipNull: true, skipEmptyString: true })}`,
    ),

  ownerDetail: (ticketId: string) =>
    api.get<TicketIncidentResType>(T.INCIDENT.OWNER_DETAIL(ticketId)),

  // ── Incident (Manager) ────────────────────────────────────────────────
  managerListByZone: (zoneId: string, query: ListIncidentTicketsQueryType) =>
    api.get<TicketIncidentListResType>(
      `${T.INCIDENT.MANAGER_LIST_BY_ZONE(zoneId)}?${queryString.stringify(query, { skipNull: true, skipEmptyString: true })}`,
    ),

  managerDetail: (ticketId: string) =>
    api.get<TicketIncidentResType>(T.INCIDENT.MANAGER_DETAIL(ticketId)),

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
};

export default ticketService;
