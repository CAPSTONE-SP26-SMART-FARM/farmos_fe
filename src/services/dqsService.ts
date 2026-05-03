import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  DoctorDqsDetailResType,
  DqsHistoryQueryType,
  DqsHistoryResType,
  DqsLeaderboardQueryType,
  DqsLeaderboardResType,
} from "@/schemaValidatation/dqs";
import queryString from "query-string";

const D = API_ENDPOINTS.DQS;

// BE strict — query field chỉ chấp nhận `from/to` cho history,
// `date/tier` cho leaderboard. KHÔNG có page/limit.

const dqsService = {
  // ── B14 GET /admin/doctors/:id/dqs ──
  // Trả {doctorId, latest: snapshot|null}. `latest` null nếu doctor mới
  // (<30 ngày) hoặc cron chưa chạy.
  doctorDetail: (id: string) =>
    api.get<DoctorDqsDetailResType>(D.DOCTOR_DETAIL(id)),

  // ── B15 GET /admin/doctors/:id/dqs-history?from=&to= ──
  doctorHistory: (id: string, query: DqsHistoryQueryType) =>
    api.get<DqsHistoryResType>(
      `${D.DOCTOR_HISTORY(id)}?${queryString.stringify(
        { ...query },
        { skipNull: true, skipEmptyString: true },
      )}`,
    ),

  // ── B16 GET /admin/dqs-leaderboard?date=&tier= ──
  // KHÔNG pagination — BE trả flat array. Nếu doctor list lớn, frontend
  // tự virtualize hoặc filter client-side.
  leaderboard: (query: DqsLeaderboardQueryType) =>
    api.get<DqsLeaderboardResType>(
      `${D.LEADERBOARD}?${queryString.stringify(
        { ...query },
        { skipNull: true, skipEmptyString: true },
      )}`,
    ),
};

export default dqsService;
