import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  ListMilestoneTemplatesQueryType,
  ListMilestoneTemplatesResType,
  MilestoneTemplateResType,
} from "@/schemaValidatation/milestoneTemplate";
import queryString from "query-string";

const MANAGER = API_ENDPOINTS.MANAGER;
const OWNER = API_ENDPOINTS.OWNER;

export const managerMilestoneTemplateService = {
  list: (query: ListMilestoneTemplatesQueryType) =>
    api.get<ListMilestoneTemplatesResType>(
      MANAGER.MILESTONE_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<MilestoneTemplateResType>(MANAGER.MILESTONE_TEMPLATE.DETAIL(id)),
};

export const ownerMilestoneTemplateService = {
  list: (query: ListMilestoneTemplatesQueryType) =>
    api.get<ListMilestoneTemplatesResType>(
      OWNER.MILESTONE_TEMPLATE.LIST +
        "?" +
        queryString.stringify(
          { ...query },
          { skipEmptyString: true, skipNull: true },
        ),
    ),
  detail: (id: string) =>
    api.get<MilestoneTemplateResType>(OWNER.MILESTONE_TEMPLATE.DETAIL(id)),
};
