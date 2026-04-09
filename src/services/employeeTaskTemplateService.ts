import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateEmployeeTaskTemplateBodyType,
  EmployeeTaskTemplateResType,
  ListEmployeeTaskTemplatesQueryType,
  ListEmployeeTaskTemplatesResType,
  UpdateEmployeeTaskTemplateBodyType,
} from "@/schemaValidatation/employeeTaskTemplate";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const ADMIN = API_ENDPOINTS.ADMIN;
const MANAGER = API_ENDPOINTS.MANAGER;
const OWNER = API_ENDPOINTS.OWNER;

// ── Admin (full CRUD) ──────────────────────────────────────────────────

export const employeeTaskTemplateService = {
  list: (query: ListEmployeeTaskTemplatesQueryType) =>
    api.get<ListEmployeeTaskTemplatesResType>(
      ADMIN.EMPLOYEE_TASK_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<EmployeeTaskTemplateResType>(
      ADMIN.EMPLOYEE_TASK_TEMPLATE.DETAIL(id),
    ),
  create: (body: CreateEmployeeTaskTemplateBodyType) =>
    api.post<EmployeeTaskTemplateResType, CreateEmployeeTaskTemplateBodyType>(
      ADMIN.EMPLOYEE_TASK_TEMPLATE.CREATE,
      body,
    ),
  update: (id: string, body: UpdateEmployeeTaskTemplateBodyType) =>
    api.put<EmployeeTaskTemplateResType, UpdateEmployeeTaskTemplateBodyType>(
      ADMIN.EMPLOYEE_TASK_TEMPLATE.UPDATE(id),
      body,
    ),
  delete: (id: string) =>
    api.delete<MessageResType>(ADMIN.EMPLOYEE_TASK_TEMPLATE.DELETE(id)),
};

// ── Manager (read-only) ────────────────────────────────────────────────

export const managerEmployeeTaskTemplateService = {
  list: (query: ListEmployeeTaskTemplatesQueryType) =>
    api.get<ListEmployeeTaskTemplatesResType>(
      MANAGER.EMPLOYEE_TASK_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<EmployeeTaskTemplateResType>(
      MANAGER.EMPLOYEE_TASK_TEMPLATE.DETAIL(id),
    ),
};

// ── Owner (read-only) ──────────────────────────────────────────────────

export const ownerEmployeeTaskTemplateService = {
  list: (query: ListEmployeeTaskTemplatesQueryType) =>
    api.get<ListEmployeeTaskTemplatesResType>(
      OWNER.EMPLOYEE_TASK_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<EmployeeTaskTemplateResType>(
      OWNER.EMPLOYEE_TASK_TEMPLATE.DETAIL(id),
    ),
};
