import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  ActiveTicketCategoryListResType,
  CreateTicketCategoryBodyType,
  ListTicketCategoriesQueryType,
  TicketCategoryListResType,
  TicketCategoryType,
  ToggleTicketCategoryBodyType,
  UpdateTicketCategoryBodyType,
} from "@/schemaValidatation/ticketCategory";
import queryString from "query-string";

const TC = API_ENDPOINTS.TICKET_CATEGORIES;

const ticketCategoryService = {
  adminList: (query: ListTicketCategoriesQueryType) =>
    api.get<TicketCategoryListResType>(
      `${TC.ADMIN_LIST}?${queryString.stringify({ ...query }, { skipNull: true, skipEmptyString: true })}`,
    ),

  adminDetail: (id: string) => api.get<TicketCategoryType>(TC.ADMIN_DETAIL(id)),

  create: (body: CreateTicketCategoryBodyType) =>
    api.post<TicketCategoryType, CreateTicketCategoryBodyType>(
      TC.ADMIN_CREATE,
      body,
    ),

  update: (id: string, body: UpdateTicketCategoryBodyType) =>
    api.patch<TicketCategoryType, UpdateTicketCategoryBodyType>(
      TC.ADMIN_UPDATE(id),
      body,
    ),

  toggle: (id: string, body: ToggleTicketCategoryBodyType) =>
    api.patch<TicketCategoryType, ToggleTicketCategoryBodyType>(
      TC.ADMIN_TOGGLE(id),
      body,
    ),

  activeList: () => api.get<ActiveTicketCategoryListResType>(TC.ACTIVE_LIST),
};

export default ticketCategoryService;
