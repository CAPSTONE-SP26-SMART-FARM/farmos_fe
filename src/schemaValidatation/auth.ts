import { TypeOfVerificationCode } from "@/constants/auth";
import { UserSchema } from "@/types/user";
import { z } from "zod";

export const RegisterBodySchema = UserSchema.pick({
	email: true,
	fullName: true,
	phone: true,
})
	.extend({
		password: z.string().min(6).max(100),
		confirmPassword: z.string().min(6).max(100),
		code: z.string().length(6),
		role: z.enum(["owner", "doctor"]),
	})
	.strict()
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				code: "custom",
				message: "Password and confirm password must match",
				path: ["confirmPassword"],
			});
		}
	});

export const RegisterResSchema = UserSchema.omit({
	passwordHash: true,
	totpSecret: true,
});

export const OTPMessageResSchema = z.object({
	message: z.string(),
});

export const VerificationCodeSchema = z.object({
	id: z.uuid(),
	email: z.email(),
	code: z.string().length(6),
	type: z.enum([
		TypeOfVerificationCode.REGISTER,
		TypeOfVerificationCode.FORGOT_PASSWORD,
		TypeOfVerificationCode.LOGIN,
		TypeOfVerificationCode.DISABLE_2FA,
	]),
	expiresAt: z.iso.datetime(),
	createdAt: z.iso.datetime(),
});

export const SendOTPBodySchema = VerificationCodeSchema.pick({
	email: true,
	type: true,
}).strict();

export const LoginBodySchema = UserSchema.pick({
	email: true,
})
	.extend({
		password: z.string().min(6).max(100),
		totpCode: z.string().length(6).optional(),
		code: z.string().length(6).optional(),
	})
	.strict()
	.superRefine(({ totpCode, code }, ctx) => {
		const message =
			"Bạn chỉ nên truyền mã xác thực 2FA hoặc mã OTP. Không được truyền cả 2";
		if (totpCode !== undefined && code !== undefined) {
			ctx.addIssue({
				path: ["totpCode"],
				message,
				code: "custom",
			});
			ctx.addIssue({
				path: ["code"],
				message,
				code: "custom",
			});
		}
	});

export const LoginResSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
});

export const RefreshTokenBodySchema = z
	.object({
		refreshToken: z.string(),
	})
	.strict();

export const RefreshTokenResSchema = LoginResSchema;

export const DeviceSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	userAgent: z.string(),
	ip: z.string(),
	lastActive: z.iso.datetime(),
	createdAt: z.iso.datetime(),
	isActive: z.boolean(),
});

export const RefreshTokenSchema = z.object({
	token: z.string(),
	userId: z.string().uuid(),
	deviceId: z.string().uuid(),
	expiresAt: z.iso.datetime(),
	createdAt: z.iso.datetime(),
});

export const LogoutBodySchema = RefreshTokenBodySchema;

export const ForgotPasswordBodySchema = z
	.object({
		email: z.email(),
		code: z.string().length(6),
		newPassword: z.string().min(6).max(100),
		confirmNewPassword: z.string().min(6).max(100),
	})
	.strict()
	.superRefine(({ confirmNewPassword, newPassword }, ctx) => {
		if (confirmNewPassword !== newPassword) {
			ctx.addIssue({
				code: "custom",
				message: "Mật khẩu và mật khẩu xác nhận phải giống nhau",
				path: ["confirmNewPassword"],
			});
		}
	});

export const DisableTwoFactorBodySchema = z
	.object({
		totpCode: z.string().length(6).optional(),
		code: z.string().length(6).optional(),
	})
	.strict()
	.superRefine(({ totpCode, code }, ctx) => {
		const message =
			"Bạn phải cung cấp mã xác thực 2FA hoặc mã OTP. Không được cung cấp cả 2";
		if ((totpCode !== undefined) === (code !== undefined)) {
			ctx.addIssue({
				path: ["totpCode"],
				message,
				code: "custom",
			});
			ctx.addIssue({
				path: ["code"],
				message,
				code: "custom",
			});
		}
	});

export const TwoFactorSetupResSchema = z.object({
	secret: z.string(),
	uri: z.string(),
});

export const UpdateProfileSchema = UserSchema.pick({
	fullName: true,
	phone: true,
	avatarUrl: true,
});

export const UpdateProfileResSchema = UserSchema.omit({
	passwordHash: true,
	totpSecret: true,
});

//* <== Type Export ==>
export type UpdateProfileType = z.infer<typeof UpdateProfileSchema>;
export type UpdateProfileResType = z.infer<typeof UpdateProfileResSchema>;

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;
export type RegisterResType = z.infer<typeof RegisterResSchema>;
export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>;
export type SendOTPBodyType = z.infer<typeof SendOTPBodySchema>;
export type LoginBodyType = z.infer<typeof LoginBodySchema>;
export type LoginResType = z.infer<typeof LoginResSchema>;
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;
export type RefreshTokenResType = LoginResType;
export type DeviceType = z.infer<typeof DeviceSchema>;
export type LogoutBodyType = RefreshTokenBodyType;
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>;
export type DisableTwoFactorBodyType = z.infer<
	typeof DisableTwoFactorBodySchema
>;
export type TwoFactorSetupResType = z.infer<typeof TwoFactorSetupResSchema>;
export type OTPMessageResType = z.infer<typeof OTPMessageResSchema>;
