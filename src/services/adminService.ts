import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
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
};
export default adminService;
