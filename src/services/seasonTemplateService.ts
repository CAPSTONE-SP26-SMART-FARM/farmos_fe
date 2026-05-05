import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  ActionResT,
  AppliedTemplateInfoResT,
  CreateSeasonTemplateBodyT,
  ListSeasonTemplatesQueryT,
  PatchSeasonTemplateBodyT,
  PreviewFromTemplateBodyT,
  PreviewFromTemplateResT,
  SeasonTemplateDetailResT,
  SeasonTemplateListResT,
  UsageResT,
} from "@/schemaValidatation/seasonTemplate";
import queryString from "query-string";

const E = API_ENDPOINTS.SEASON_TEMPLATES;

const seasonTemplateService = {
  // ── Admin (B1–B8) ──
  adminList: (query: ListSeasonTemplatesQueryT) =>
    api.get<SeasonTemplateListResT>(
      `${E.ADMIN_LIST}?${queryString.stringify(query, {
        skipNull: true,
        skipEmptyString: true,
      })}`,
    ),

  adminDetail: (id: string) =>
    api.get<SeasonTemplateDetailResT>(E.ADMIN_DETAIL(id)),

  adminCreate: (body: CreateSeasonTemplateBodyT) =>
    api.post<SeasonTemplateDetailResT, CreateSeasonTemplateBodyT>(
      E.ADMIN_CREATE,
      body,
    ),

  adminPatch: (id: string, body: PatchSeasonTemplateBodyT) =>
    api.patch<SeasonTemplateDetailResT, PatchSeasonTemplateBodyT>(
      E.ADMIN_PATCH(id),
      body,
    ),

  adminDeactivate: (id: string) =>
    api.post<ActionResT>(E.ADMIN_DEACTIVATE(id)),

  adminActivate: (id: string) => api.post<ActionResT>(E.ADMIN_ACTIVATE(id)),

  adminSoftDelete: (id: string) => api.delete<ActionResT>(E.ADMIN_DELETE(id)),

  adminUsage: (id: string) => api.get<UsageResT>(E.ADMIN_USAGE(id)),

  // ── Public (B9, B10) ──
  publicList: (query: ListSeasonTemplatesQueryT) =>
    api.get<SeasonTemplateListResT>(
      `${E.PUBLIC_LIST}?${queryString.stringify(query, {
        skipNull: true,
        skipEmptyString: true,
      })}`,
    ),

  publicDetail: (id: string) =>
    api.get<SeasonTemplateDetailResT>(E.PUBLIC_DETAIL(id)),

  // ── Apply (B11) ──
  preview: (body: PreviewFromTemplateBodyT) =>
    api.post<PreviewFromTemplateResT, PreviewFromTemplateBodyT>(
      E.PREVIEW,
      body,
    ),

  // ── Applied info (B13) ──
  appliedInfo: (cropSeasonId: string) =>
    api.get<AppliedTemplateInfoResT>(E.APPLIED_INFO(cropSeasonId)),
};

export default seasonTemplateService;
