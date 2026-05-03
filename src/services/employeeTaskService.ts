import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CreateEmployeeTaskBatchBodyType,
  EligibleFarmerResType,
  EmployeeTaskBatchResType,
  EmployeeTaskResType,
  ListEmployeeTasksQueryType,
  ListEmployeeTasksResType,
  UpdateEmployeeTaskBodyType,
  AssignFarmerToTaskBodyType,
} from "@/schemaValidatation/employeeTask";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const MANAGER = API_ENDPOINTS.MANAGER;
const OWNER = API_ENDPOINTS.OWNER;

// ── Manager (full CRUD) ────────────────────────────────────────────────

export const managerEmployeeTaskService = {
  list: (milestoneId: string, query: ListEmployeeTasksQueryType) =>
    api.get<ListEmployeeTasksResType>(
      MANAGER.EMPLOYEE_TASK.LIST(milestoneId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (taskId: string, milestoneId: string) =>
    api.get<EmployeeTaskResType>(
      MANAGER.EMPLOYEE_TASK.DETAIL(taskId, milestoneId),
    ),
  createBatch: (milestoneId: string, body: CreateEmployeeTaskBatchBodyType) =>
    api.post<EmployeeTaskBatchResType, CreateEmployeeTaskBatchBodyType>(
      MANAGER.EMPLOYEE_TASK.CREATE_BATCH(milestoneId),
      body,
    ),
  update: (
    taskId: string,
    milestoneId: string,
    body: UpdateEmployeeTaskBodyType,
  ) =>
    api.put<EmployeeTaskResType, UpdateEmployeeTaskBodyType>(
      MANAGER.EMPLOYEE_TASK.UPDATE(taskId, milestoneId),
      body,
    ),
  delete: (taskId: string, milestoneId: string) =>
    api.delete<MessageResType>(
      MANAGER.EMPLOYEE_TASK.DELETE(taskId, milestoneId),
    ),
  assign: (
    taskId: string,
    milestoneId: string,
    body: AssignFarmerToTaskBodyType,
  ) =>
    api.post<EmployeeTaskResType, AssignFarmerToTaskBodyType>(
      MANAGER.EMPLOYEE_TASK.ASSIGN(taskId, milestoneId),
      body,
    ),
  unassign: (taskId: string, milestoneId: string) =>
    api.post<EmployeeTaskResType>(
      MANAGER.EMPLOYEE_TASK.UNASSIGN(taskId, milestoneId),
    ),
  complete: (taskId: string, milestoneId: string) =>
    api.post<EmployeeTaskResType>(
      MANAGER.EMPLOYEE_TASK.COMPLETE(taskId, milestoneId),
    ),
  eligibleFarmers: (milestoneId: string) =>
    api.get<EligibleFarmerResType[]>(
      MANAGER.EMPLOYEE_TASK.ELIGIBLE_FARMERS(milestoneId),
    ),
};

// ── Owner (full CRUD) ──────────────────────────────────────────────────

export const ownerEmployeeTaskService = {
  list: (milestoneId: string, query: ListEmployeeTasksQueryType) =>
    api.get<ListEmployeeTasksResType>(
      OWNER.EMPLOYEE_TASK.LIST(milestoneId) +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (taskId: string, milestoneId: string) =>
    api.get<EmployeeTaskResType>(
      OWNER.EMPLOYEE_TASK.DETAIL(taskId, milestoneId),
    ),
  createBatch: (milestoneId: string, body: CreateEmployeeTaskBatchBodyType) =>
    api.post<EmployeeTaskBatchResType, CreateEmployeeTaskBatchBodyType>(
      OWNER.EMPLOYEE_TASK.CREATE_BATCH(milestoneId),
      body,
    ),
  update: (
    taskId: string,
    milestoneId: string,
    body: UpdateEmployeeTaskBodyType,
  ) =>
    api.put<EmployeeTaskResType, UpdateEmployeeTaskBodyType>(
      OWNER.EMPLOYEE_TASK.UPDATE(taskId, milestoneId),
      body,
    ),
  delete: (taskId: string, milestoneId: string) =>
    api.delete<MessageResType>(OWNER.EMPLOYEE_TASK.DELETE(taskId, milestoneId)),
  assign: (
    taskId: string,
    milestoneId: string,
    body: AssignFarmerToTaskBodyType,
  ) =>
    api.post<EmployeeTaskResType, AssignFarmerToTaskBodyType>(
      OWNER.EMPLOYEE_TASK.ASSIGN(taskId, milestoneId),
      body,
    ),
  unassign: (taskId: string, milestoneId: string) =>
    api.post<EmployeeTaskResType>(
      OWNER.EMPLOYEE_TASK.UNASSIGN(taskId, milestoneId),
    ),
  complete: (taskId: string, milestoneId: string) =>
    api.post<EmployeeTaskResType>(
      OWNER.EMPLOYEE_TASK.COMPLETE(taskId, milestoneId),
    ),
  eligibleFarmers: (milestoneId: string) =>
    api.get<EligibleFarmerResType[]>(
      OWNER.EMPLOYEE_TASK.ELIGIBLE_FARMERS(milestoneId),
    ),
};
