import { QUERY_KEYS } from "@/constants";
import {
  managerMilestoneTemplateService,
  ownerMilestoneTemplateService,
} from "@/services/milestoneTemplateService";
import type { ListMilestoneTemplatesQueryType } from "@/schemaValidatation/milestoneTemplate";
import { useQuery } from "@tanstack/react-query";

export const useManagerListMilestoneTemplates = (
  query: ListMilestoneTemplatesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.milestoneTemplates.list(query),
    queryFn: () => managerMilestoneTemplateService.list(query),
    enabled,
  });
};

export const useManagerMilestoneTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.manager.milestoneTemplates.detail(id),
    queryFn: () => managerMilestoneTemplateService.detail(id),
    enabled,
  });
};

export const useOwnerListMilestoneTemplates = (
  query: ListMilestoneTemplatesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.milestoneTemplates.list(query),
    queryFn: () => ownerMilestoneTemplateService.list(query),
    enabled,
  });
};

export const useOwnerMilestoneTemplateDetail = (
  id: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.owner.milestoneTemplates.detail(id),
    queryFn: () => ownerMilestoneTemplateService.detail(id),
    enabled,
  });
};
