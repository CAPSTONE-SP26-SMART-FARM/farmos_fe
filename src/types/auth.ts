import type { RoleNameType } from "@/constants/role";

export interface TokenPayload {
	userId: string;
	deviceId: string;
	role: RoleNameType;
	exp: number;
	iat: number;
	uuid: string;
}
