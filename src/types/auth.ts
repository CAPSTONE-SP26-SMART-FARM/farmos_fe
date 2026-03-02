import z from "zod";

export const loginBodySchema = z.object({
	email: z.string().min(4).max(6),
	password: z.string().min(3).max(10),
	expiresInMins: z.number().optional(),
});

export type LoginBodyType = z.infer<typeof loginBodySchema>;

export const registerBodySchema = z.object({
	email: z.string().email(),
	password: z.string().min(6).max(20),
	fullName: z.string().min(2).max(50),
	role: z.enum(["Owner", "Manager", "Worker"]).optional(),
});

export type RegisterBodyType = z.infer<typeof registerBodySchema>;

export const refreshTokenBodySchema = z.object({
	refreshToken: z.string(),
	expiresInMins: z.number().optional(),
});

export type RefreshTokenBodyType = z.infer<typeof refreshTokenBodySchema>;

export const authResponseSchema = z.object({
	id: z.number(),
	username: z.string(),
	email: z.string().email(),
	firstName: z.string(),
	lastName: z.string(),
	gender: z.string(),
	image: z.string(),
	accessToken: z.string(),
	refreshToken: z.string(),
	user: z
		.object({
			id: z.string(),
			email: z.string().email(),
			role: z.string(),
			fullName: z.string().optional(),
		})
		.optional(),
});

export type AuthResponseType = z.infer<typeof authResponseSchema>;

export const userProfileSchema = z.object({
	id: z.number(),
	username: z.string(),
	email: z.string().email(),
	firstName: z.string(),
	lastName: z.string(),
	gender: z.string(),
	image: z.string(),
});

export type UserProfileType = z.infer<typeof userProfileSchema>;

export const refreshTokenResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
});

export type RefreshTokenResponseType = z.infer<
	typeof refreshTokenResponseSchema
>;

export const forgotPasswordBodySchema = loginBodySchema.pick({
	email: true,
});

export type ForgotPasswordBodyType = z.infer<typeof forgotPasswordBodySchema>;
