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
