// ============================================================
// DoctorType — maps to enum doctor_type in DB
// ============================================================
export const DoctorTypeName = {
	Internal: "internal", // Bác sĩ nội bộ (nhân viên)
	Partner: "partner", // Bác sĩ đối tác (freelance)
	Coordinator: "coordinator", // Bác sĩ điều phối viên
} as const;

export type DoctorTypeNameType =
	(typeof DoctorTypeName)[keyof typeof DoctorTypeName];

// ============================================================
// RegistrationStatus — maps to enum registration_status in DB
// ============================================================
export const RegistrationStatusName = {
	Pending: "pending", // Chờ admin phê duyệt
	Approved: "approved", // Đã được phê duyệt
	Rejected: "rejected", // Bị từ chối
	Suspended: "suspended", // Tạm ngưng
} as const;

export type RegistrationStatusNameType =
	(typeof RegistrationStatusName)[keyof typeof RegistrationStatusName];
