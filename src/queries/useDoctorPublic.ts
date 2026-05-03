import { QUERY_KEYS } from "@/constants";
import doctorPublicService from "@/services/doctorPublicService";
import { useQuery } from "@tanstack/react-query";

// ── B19 — Public doctor profile ───────────────────────────────────────────
// Dùng cho `DoctorPublicProfile` widget ở Owner MyDoctor + bất cứ chỗ nào
// hiển thị thông tin Doctor cho non-Admin. KHÔNG bao giờ render `tier`.

export const useDoctorPublicProfile = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.doctorPublic.detail(id),
    queryFn: () => doctorPublicService.detail(id),
    enabled: enabled && Boolean(id),
  });
};
