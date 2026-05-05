import { QUERY_KEYS } from "@/constants";
import type {
  CreateSeasonTemplateBodyT,
  ListSeasonTemplatesQueryT,
  PatchSeasonTemplateBodyT,
  PreviewFromTemplateBodyT,
} from "@/schemaValidatation/seasonTemplate";
import seasonTemplateService from "@/services/seasonTemplateService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Admin ─────────────────────────────────────────────────────────────────

export const useAdminSeasonTemplateList = (
  query: ListSeasonTemplatesQueryT,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.seasonTemplates.adminList(query),
    queryFn: () => seasonTemplateService.adminList(query),
    enabled,
  });

export const useAdminSeasonTemplateDetail = (id: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.seasonTemplates.adminDetail(id),
    queryFn: () => seasonTemplateService.adminDetail(id),
    enabled: enabled && Boolean(id),
  });

export const useAdminSeasonTemplateUsage = (id: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.seasonTemplates.adminUsage(id),
    queryFn: () => seasonTemplateService.adminUsage(id),
    enabled: enabled && Boolean(id),
  });

export const useCreateSeasonTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSeasonTemplateBodyT) =>
      seasonTemplateService.adminCreate(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.seasonTemplates.root });
    },
  });
};

export const usePatchSeasonTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: PatchSeasonTemplateBodyT;
    }) => seasonTemplateService.adminPatch(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.seasonTemplates.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.seasonTemplates.adminDetail(id),
      });
    },
  });
};

export const useActivateSeasonTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seasonTemplateService.adminActivate(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.seasonTemplates.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.seasonTemplates.adminDetail(id),
      });
    },
  });
};

export const useDeactivateSeasonTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seasonTemplateService.adminDeactivate(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.seasonTemplates.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.seasonTemplates.adminDetail(id),
      });
    },
  });
};

export const useSoftDeleteSeasonTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seasonTemplateService.adminSoftDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.seasonTemplates.root });
    },
  });
};

// ── Public (Manager / Owner) ──────────────────────────────────────────────

export const useSeasonTemplateList = (
  query: ListSeasonTemplatesQueryT,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.seasonTemplates.publicList(query),
    queryFn: () => seasonTemplateService.publicList(query),
    enabled,
  });

export const useSeasonTemplateDetail = (id: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.seasonTemplates.publicDetail(id),
    queryFn: () => seasonTemplateService.publicDetail(id),
    enabled: enabled && Boolean(id),
  });

// ── Apply (B11) ───────────────────────────────────────────────────────────

export const usePreviewFromTemplate = () =>
  useMutation({
    mutationFn: (body: PreviewFromTemplateBodyT) =>
      seasonTemplateService.preview(body),
  });

// ── Applied info (B13) ────────────────────────────────────────────────────

export const useAppliedTemplateInfo = (
  cropSeasonId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.seasonTemplates.appliedInfo(cropSeasonId),
    queryFn: () => seasonTemplateService.appliedInfo(cropSeasonId),
    enabled: enabled && Boolean(cropSeasonId),
  });
