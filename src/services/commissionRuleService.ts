import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import type {
  CommissionRuleListResType,
  CommissionRuleType,
  CreateCommissionRuleBodyType,
  ListCommissionRulesQueryType,
  UpdateCommissionRuleBodyType,
} from "@/schemaValidatation/commissionRule";
import type { MessageResType } from "@/types/api";
import queryString from "query-string";

const CR = API_ENDPOINTS.COMMISSION_RULES;

const commissionRuleService = {
  list: (query: ListCommissionRulesQueryType) =>
    api.get<CommissionRuleListResType>(
      `${CR.ADMIN_LIST}?${queryString.stringify({ ...query }, { skipNull: true, skipEmptyString: true })}`,
    ),

  detail: (id: string) => api.get<CommissionRuleType>(CR.ADMIN_DETAIL(id)),

  create: (body: CreateCommissionRuleBodyType) =>
    api.post<CommissionRuleType, CreateCommissionRuleBodyType>(
      CR.ADMIN_CREATE,
      body,
    ),

  update: (id: string, body: UpdateCommissionRuleBodyType) =>
    api.patch<CommissionRuleType, UpdateCommissionRuleBodyType>(
      CR.ADMIN_UPDATE(id),
      body,
    ),

  softDelete: (id: string) => api.delete<MessageResType>(CR.ADMIN_DELETE(id)),
};

export default commissionRuleService;
