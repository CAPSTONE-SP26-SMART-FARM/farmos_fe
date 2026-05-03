import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type { DoctorPublicProfileResType } from "@/schemaValidatation/doctorPublic";

const D = API_ENDPOINTS.DOCTORS;

const doctorPublicService = {
  // ── B19 GET /doctors/:id/public ──
  // BR-81 chặt hơn: response KHÔNG bao giờ chứa `tier`. Code review checklist
  // (mục 10 v2 doc): grep 'tier' trong UI Owner/Manager phải = 0.
  detail: (id: string) =>
    api.get<DoctorPublicProfileResType>(D.PUBLIC(id)),
};

export default doctorPublicService;
