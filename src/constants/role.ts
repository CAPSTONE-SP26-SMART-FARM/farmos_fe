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

export const RoleLabelVi: Record<RoleNameType, string> = {
  [RoleName.Admin]: "Quản trị viên",
  [RoleName.Owner]: "Chủ trang trại",
  [RoleName.Manager]: "Quản lý",
  [RoleName.Doctor]: "Bác sĩ",
  [RoleName.Farmer]: "Nông dân",
};

export const getRoleLabelVi = (role?: string | null): string => {
  if (!role) return "";
  const key = role.toLowerCase() as RoleNameType;
  return RoleLabelVi[key] ?? role;
};

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
