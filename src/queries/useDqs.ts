import { QUERY_KEYS } from "@/constants";
import type {
  DqsHistoryQueryType,
  DqsLeaderboardQueryType,
} from "@/schemaValidatation/dqs";
import dqsService from "@/services/dqsService";
import { useQuery } from "@tanstack/react-query";

// ── B16 — Leaderboard ─────────────────────────────────────────────────────
// BE trả flat array {data: LeaderboardRow[]} — KHÔNG pagination.
// FE filter/limit client-side nếu list dài.

export const useDqsLeaderboard = (
  query: DqsLeaderboardQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.dqs.leaderboard(query),
    queryFn: () => dqsService.leaderboard(query),
    enabled,
  });
};

// ── B14 — Doctor DQS detail (snapshot mới nhất) ──
export const useDoctorDqsDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.dqs.doctorDetail(id),
    queryFn: () => dqsService.doctorDetail(id),
    enabled: enabled && Boolean(id),
  });
};

// ── B15 — Doctor DQS history ──
export const useDoctorDqsHistory = (
  id: string,
  query: DqsHistoryQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.dqs.doctorHistory(id, query),
    queryFn: () => dqsService.doctorHistory(id, query),
    enabled: enabled && Boolean(id),
  });
};
