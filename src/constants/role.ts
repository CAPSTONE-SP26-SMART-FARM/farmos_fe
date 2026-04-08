export const RoleName = {
  Owner: "owner",
  Manager: "manager",
  Farmer: "farmer",
  Doctor: "doctor",
  Admin: "admin",
} as const;

export type RoleNameType = (typeof RoleName)[keyof typeof RoleName];

export const RoleRegister = {
  Owner: "owner",
  Manager: "manager",
  Farmer: "farmer",
  Doctor: "doctor",
  Admin: "admin",
} as const;
export type RoleRegisterType = (typeof RoleRegister)[keyof typeof RoleRegister];

//<=======================>

export const HTTPMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
} as const;
