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
import queryString from "query-string";
const OWNER = API_ENDPOINTS.OWNER;
const FARMS = API_ENDPOINTS.FARMS;
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
};
export default ownerService;
