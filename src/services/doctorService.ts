import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
	AssignmentWithOwnerResType,
	ListAssignmentsDoctorResType,
	ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import type {
	DoctorProfileResType,
	DoctorRequestResType,
	DoctorRequestWithProfileResType,
	ListDoctorRequestsQueryType,
	ListDoctorRequestsResType,
	SubmitDoctorRequestBodyType,
	UpsertDoctorProfileBodyType,
} from "@/schemaValidatation/doctorProfile";
import queryString from "query-string";
const DOCTOR = API_ENDPOINTS.DOCTORS;

const doctorService = {
	upsertProfile: (data: UpsertDoctorProfileBodyType) =>
		api.post<DoctorProfileResType, UpsertDoctorProfileBodyType>(
			DOCTOR.PROFILE.UPSERT_PROFILE,
			{
				...data,
			},
		),
	request: (data: SubmitDoctorRequestBodyType) =>
		api.post<DoctorRequestResType, SubmitDoctorRequestBodyType>(
			DOCTOR.PROFILE.REQUEST,
			data,
		),
	listRequest: (query?: ListDoctorRequestsQueryType) =>
		api.get<ListDoctorRequestsResType>(
			`${DOCTOR.PROFILE.LIST}?${queryString.stringify({
				...query,
			})}`,
		),
	requestDetail: (id: string) =>
		api.get<DoctorRequestWithProfileResType>(DOCTOR.PROFILE.DETAIL(id)),
	assignMe: (query: ListAssignmentsQueryType) =>
		api.get<ListAssignmentsDoctorResType>(
			DOCTOR.ASSIGNMENT.ME +
				"?" +
				queryString.stringify({
					...query,
				}),
		),
	detailAssignment: (id: string) =>
		api.get<AssignmentWithOwnerResType>(DOCTOR.ASSIGNMENT.DETAIL(id)),
};

export default doctorService;
