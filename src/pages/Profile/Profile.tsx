import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/queries/useAuth";
import {
	UpdateProfileSchema,
	type UpdateProfileType,
} from "@/schemaValidatation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useMemo, useRef, useState } from "react";
import envConfig from "@/config";

const Profile = () => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [uploading, setUploading] = useState(false);
	const [file, setFile] = useState<File | null>(null);

	const form = useForm<UpdateProfileType>({
		resolver: zodResolver(UpdateProfileSchema),
		defaultValues: {
			avatarUrl: null,
			fullName: "",
			phone: "",
		},
	});
	const { mutateAsync: update, isPending } = useUpdateProfile();

	const avatar = form.watch("avatarUrl");
	const previewAvatarFromFile = useMemo(() => {
		if (file) {
			return URL.createObjectURL(file);
		}
		return avatar ?? undefined;
	}, [file, avatar]);

	const handleSubmit = async (data: UpdateProfileType) => {
		try {
			setUploading(true);

			let nextAvatarUrl = data.avatarUrl ?? null;

			// Nếu có file mới, upload lên Cloudinary trước rồi dùng URL trả về
			if (file) {
				const formData = new FormData();
				formData.append("file", file);
				formData.append(
					"upload_preset",
					envConfig.CLOUDINARY_UPLOAD_PRESET,
				);

				const res = await fetch(
					`https://api.cloudinary.com/v1_1/${envConfig.CLOUDINARY_CLOUD_NAME}/image/upload`,
					{
						method: "POST",
						body: formData,
					},
				);
				const uploadResult = await res.json();
				const url = uploadResult.secure_url as string | undefined;

				if (url) {
					nextAvatarUrl = url;
				}
			}

			await update({
				...data,
				avatarUrl: nextAvatarUrl,
			});
		} catch (_error) {
			// có thể toast lỗi ở đây nếu cần
		} finally {
			setUploading(false);
		}
	};

	const handlePickAvatar = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
		event,
	) => {
		const selected = event.target.files?.[0];
		if (!selected) return;

		setFile(selected);
		// Clear lỗi validate avatar (nếu có) khi user chọn ảnh
		form.clearErrors("avatarUrl");

		// Cho phép chọn lại cùng một file
		event.target.value = "";
	};

	return (
		<div className="min-h-screen flex justify-center items-start bg-background p-4">
			<Card className="w-full max-w-lg">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						Farm OS Update profile
					</CardTitle>
					<CardDescription className="text-center">
						Update profile to become a doctor of platform
					</CardDescription>
				</CardHeader>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<CardContent className="space-y-3">
						<FieldGroup>
							<Controller
								name="avatarUrl"
								control={form.control}
								render={({ fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel>Avatar</FieldLabel>
										<div className="flex items-center gap-4">
											<div className="h-16 w-16 overflow-hidden rounded-full border bg-muted">
												{previewAvatarFromFile ? (
													<img
														src={previewAvatarFromFile}
														alt="Avatar preview"
														className="h-full w-full object-cover"
													/>
												) : (
													<div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
														No image
													</div>
												)}
											</div>
											<div className="flex flex-col gap-2">
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={handlePickAvatar}
													disabled={uploading || isPending}
												>
													{uploading ? (
														<>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															Uploading...
														</>
													) : (
														"Upload avatar"
													)}
												</Button>
												<Input
													ref={fileInputRef}
													type="file"
													accept="image/*"
													onChange={handleFileChange}
													className="hidden"
												/>
											</div>
										</div>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								name="fullName"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="form-rhf-demo-description">
											Fullname
										</FieldLabel>
										<Input {...field} id="form-rhf-demo-description" />
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								name="phone"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="form-rhf-demo-description">
											phone
										</FieldLabel>
										<Input
											{...field}
											value={field.value ?? ""}
											id="form-rhf-demo-description"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
					</CardContent>
					<CardFooter className="flex flex-col gap-4 mt-4">
						<Button type="submit" className="w-full" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								"Update"
							)}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
};

export default Profile;
