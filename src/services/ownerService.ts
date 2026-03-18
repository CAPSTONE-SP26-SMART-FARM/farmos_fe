import { API_ENDPOINTS } from "@/constants/endpoints";
import { api } from "@/lib/axios";
import type {
  AssignmentWithDoctorResType,
  ListAssignmentsOwnerResType,
  ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import type {
  CreateFarmBodyType,
  FarmResType,
  UpdateFarmBodyType,
} from "@/schemaValidatation/farmManagement";
import type {
  CreateFarmMemberBodyType,
  CreateFarmMemberResType,
  FarmMemberResType,
  ListFarmMembersQueryType,
  ListFarmMembersResType,
  UpdateFarmMemberBodyType,
} from "@/schemaValidatation/farmMember";
import queryString from "query-string";
const OWNER = API_ENDPOINTS.OWNER;
const FARMS = API_ENDPOINTS.FARMS;
const FARM_MEMBERS = API_ENDPOINTS.FARM_MEMBERS;
const ownerService = {
  listDoctor: (query: ListAssignmentsQueryType) =>
    api.get<ListAssignmentsOwnerResType>(
      OWNER.MY_DOCTOR.LIST +
        "?" +
        queryString.stringify({
          ...query,
        }),
    ),
  detailDoctor: (id: string) =>
    api.get<AssignmentWithDoctorResType>(OWNER.MY_DOCTOR.DETAIL(id)),
  getMyFarm: () => api.get<FarmResType>(FARMS.MY_FARM),
  createFarm: (data: CreateFarmBodyType) =>
    api.post<FarmResType, CreateFarmBodyType>(FARMS.BASE, data),
  updateFarm: (id: string, data: UpdateFarmBodyType) =>
    api.put<FarmResType, UpdateFarmBodyType>(FARMS.BY_ID(id), data),

  // Farm Members
  listFarmMembers: (query: ListFarmMembersQueryType) =>
    api.get<ListFarmMembersResType>(
      FARM_MEMBERS.BASE + "?" + queryString.stringify({ ...query }),
    ),
  getFarmMemberDetail: (id: string) =>
    api.get<FarmMemberResType>(FARM_MEMBERS.BY_ID(id)),
  createFarmMember: (data: CreateFarmMemberBodyType) =>
    api.post<CreateFarmMemberResType, CreateFarmMemberBodyType>(
      FARM_MEMBERS.BASE,
      data,
    ),
  updateFarmMember: (id: string, data: UpdateFarmMemberBodyType) =>
    api.put<FarmMemberResType, UpdateFarmMemberBodyType>(
      FARM_MEMBERS.BY_ID(id),
      data,
    ),
};
export default ownerService;
