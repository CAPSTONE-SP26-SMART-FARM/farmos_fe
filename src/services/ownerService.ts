import { API_ENDPOINTS } from "@/constants/endpoints";
import { api } from "@/lib/axios";
import type {
	AssignmentWithDoctorResType,
	ListAssignmentsOwnerResType,
	ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import queryString from "query-string";
const OWNER = API_ENDPOINTS.OWNER;
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
};
export default ownerService;
