import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  ListAdminWithdrawalsQueryType,
  ListWithdrawalsAdminResType,
  MarkPaidBodyType,
  RejectWithdrawalBodyType,
  ResolveNotReceivedBodyType,
  WithdrawalAuditResType,
  WithdrawalRequestResType,
} from "@/schemaValidatation/doctorWithdrawal";
import type {
  AssignmentDetailAdminResType,
  AssignmentResType,
  CreateAssignmentBodyType,
  ListAssignmentsAdminResType,
  ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import type {
  DoctorRequestResType,
  DoctorRequestWithProfileAndUserResType,
  ListDoctorRequestsAdminResType,
  ListDoctorRequestsQueryType,
  UpdateDoctorRequestStatusBodyType,
} from "@/schemaValidatation/doctorProfile";
import type {
  FarmWithOwnerResType,
  ListFarmsQueryType,
  ListFarmsResType,
} from "@/schemaValidatation/farmManagement";
import type { ListUsersQueryType, ListUsersResType } from "@/schemaValidatation/user";
import type {
  CreateMilestoneTemplateBodyType,
  ListMilestoneTemplatesQueryType,
  ListMilestoneTemplatesResType,
  MilestoneTemplateResType,
  UpdateMilestoneTemplateBodyType,
} from "@/schemaValidatation/milestoneTemplate";
import type { UserResType } from "@/types/user";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const ADMIN = API_ENDPOINTS.ADMIN;

const adminService = {
  listDoctorRequest: (query: ListDoctorRequestsQueryType) =>
    api.get<ListDoctorRequestsAdminResType>(
      ADMIN.DOCTOR_PROFILE.LIST +
        "?" +
        queryString.stringify({
          ...query,
        }),
    ),
  doctorRequestDetail: (id: string) =>
    api.get<DoctorRequestWithProfileAndUserResType>(
      ADMIN.DOCTOR_PROFILE.DETAIL(id),
    ),
  changeStatus: (id: string, data: UpdateDoctorRequestStatusBodyType) =>
    api.put<DoctorRequestResType, UpdateDoctorRequestStatusBodyType>(
      ADMIN.DOCTOR_PROFILE.CHANGE_REQUEST(id),
      {
        ...data,
      },
    ),
  assignDoctor: (data: CreateAssignmentBodyType) =>
    api.post<AssignmentResType, CreateAssignmentBodyType>(
      ADMIN.DOCTOR_ASSIGNMENT.ASSIGN,
      {
        ...data,
      },
    ),
  listDoctorAssignment: (query: ListAssignmentsQueryType) =>
    api.get<ListAssignmentsAdminResType>(
      ADMIN.DOCTOR_ASSIGNMENT.LIST +
        "?" +
        queryString.stringify({
          ...query,
        }),
    ),
  detailDoctorAssignment: (id: string) =>
    api.get<AssignmentDetailAdminResType>(ADMIN.DOCTOR_ASSIGNMENT.DETAIL(id)),
  listFarms: (query: ListFarmsQueryType) =>
    api.get<ListFarmsResType>(
      ADMIN.FARMS.LIST + "?" + queryString.stringify({ ...query }),
    ),
  farmDetail: (id: string) =>
    api.get<FarmWithOwnerResType>(ADMIN.FARMS.DETAIL(id)),
  listUsers: (query: ListUsersQueryType) =>
    api.get<ListUsersResType>(
      ADMIN.USERS.LIST + "?" + queryString.stringify({ ...query }),
    ),
  userDetail: (id: string) =>
    api.get<UserResType>(ADMIN.USERS.DETAIL(id)),
  listMilestoneTemplates: (query: ListMilestoneTemplatesQueryType) =>
    api.get<ListMilestoneTemplatesResType>(
      ADMIN.MILESTONE_TEMPLATES.LIST +
        "?" +
        queryString.stringify({ ...query }),
    ),
  getMilestoneTemplate: (id: string) =>
    api.get<MilestoneTemplateResType>(ADMIN.MILESTONE_TEMPLATES.DETAIL(id)),
  createMilestoneTemplate: (data: CreateMilestoneTemplateBodyType) =>
    api.post<MilestoneTemplateResType, CreateMilestoneTemplateBodyType>(
      ADMIN.MILESTONE_TEMPLATES.CREATE,
      data,
    ),
  updateMilestoneTemplate: (
    id: string,
    data: UpdateMilestoneTemplateBodyType,
  ) =>
    api.put<MilestoneTemplateResType, UpdateMilestoneTemplateBodyType>(
      ADMIN.MILESTONE_TEMPLATES.UPDATE(id),
      data,
    ),
  deleteMilestoneTemplate: (id: string) =>
    api.delete<MessageResType>(ADMIN.MILESTONE_TEMPLATES.DELETE(id)),

  // ── Doctor Withdrawals ──────────────────────────────────────────────
  listWithdrawals: (query: ListAdminWithdrawalsQueryType) =>
    api.get<ListWithdrawalsAdminResType>(
      ADMIN.WITHDRAWALS.LIST + "?" + queryString.stringify({ ...query }),
    ),
  withdrawalDetail: (id: string) =>
    api.get<WithdrawalRequestResType>(ADMIN.WITHDRAWALS.DETAIL(id)),
  withdrawalAudit: (id: string) =>
    api.get<WithdrawalAuditResType>(ADMIN.WITHDRAWALS.AUDIT(id)),
  approveWithdrawal: (id: string) =>
    api.post<WithdrawalRequestResType, Record<string, never>>(
      ADMIN.WITHDRAWALS.APPROVE(id),
      {},
    ),
  rejectWithdrawal: (id: string, body: RejectWithdrawalBodyType) =>
    api.post<WithdrawalRequestResType, RejectWithdrawalBodyType>(
      ADMIN.WITHDRAWALS.REJECT(id),
      body,
    ),
  markPaidWithdrawal: (id: string, body: MarkPaidBodyType) =>
    api.post<WithdrawalRequestResType, MarkPaidBodyType>(
      ADMIN.WITHDRAWALS.MARK_PAID(id),
      body,
    ),
  resolveNotReceived: (id: string, body: ResolveNotReceivedBodyType) =>
    api.post<WithdrawalRequestResType, ResolveNotReceivedBodyType>(
      ADMIN.WITHDRAWALS.RESOLVE_NOT_RECEIVED(id),
      body,
    ),
};
export default adminService;
