import type {
  CreateFeatureBodyType,
  FeatureMenuType,
  UpdateFeatureBodyType,
} from "@/schemaValidatation/feature";

export type FormState = {
  code: string;
  name: string;
  description: string;
  valueType: CreateFeatureBodyType["valueType"];
  unit: string;
  defaultValue: string;
};

export const INITIAL_FORM: FormState = {
  code: "",
  name: "",
  description: "",
  valueType: "TEXT",
  unit: "",
  defaultValue: "",
};

// Khi tạo feature cho ticket: code khoá theo pattern `TICKET_<DOMAIN>_CREDITS`,
// kiểu dữ liệu là INT (số lượt), đơn vị mặc định "ticket". Khớp với BE regex
// `TICKET_CREDITS_FEATURE_CODE_REGEX` để wire vào ticket category.
export const TICKET_INITIAL_FORM: FormState = {
  code: "",
  name: "",
  description: "",
  valueType: "INT",
  unit: "ticket",
  defaultValue: "0",
};

export const TICKET_FEATURE_CODE_PREFIX = "TICKET_";
export const TICKET_FEATURE_CODE_SUFFIX = "_CREDITS";
export const TICKET_FEATURE_DOMAIN_REGEX = /^[A-Z][A-Z0-9_]*$/;

export function buildTicketFeatureCode(domain: string): string {
  const normalized = domain.trim().toUpperCase();
  if (!normalized) return "";
  return `${TICKET_FEATURE_CODE_PREFIX}${normalized}${TICKET_FEATURE_CODE_SUFFIX}`;
}

export function extractTicketFeatureDomain(code: string): string {
  if (
    !code.startsWith(TICKET_FEATURE_CODE_PREFIX) ||
    !code.endsWith(TICKET_FEATURE_CODE_SUFFIX)
  ) {
    return "";
  }
  return code.slice(
    TICKET_FEATURE_CODE_PREFIX.length,
    code.length - TICKET_FEATURE_CODE_SUFFIX.length,
  );
}

export function toCreatePayload(form: FormState): CreateFeatureBodyType {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    valueType: form.valueType,
    description: form.description.trim() || undefined,
    unit: form.unit.trim() || undefined,
    defaultValue: form.defaultValue.trim() || undefined,
  };
}

export function toUpdatePayload(form: FormState): UpdateFeatureBodyType {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    unit: form.unit.trim() || undefined,
    defaultValue: form.defaultValue.trim() || undefined,
  };
}

export function toFormState(feature: FeatureMenuType): FormState {
  return {
    code: feature.code,
    name: feature.name,
    description: feature.description ?? "",
    valueType: feature.valueType,
    unit: feature.unit ?? "",
    defaultValue: feature.defaultValue ?? "",
  };
}
