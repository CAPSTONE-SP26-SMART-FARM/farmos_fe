import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useAdminChangeStatusDoctorRequest,
	useAdminDoctorRequestDetail,
} from "@/queries/useAdmin";
import type { DoctorRequestWithProfileAndUserResType } from "@/schemaValidatation/doctorProfile";
import {
	UpdateDoctorRequestStatusBodySchema,
	type UpdateDoctorRequestStatusBodyType,
} from "@/schemaValidatation/doctorProfile";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RegistrationStatusName } from "@/constants/profile";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface Props {
	id?: string;
	setId: (id: string | undefined) => void;
}

const UpdateRequest = ({ id, setId }: Props) => {
	const form = useForm<UpdateDoctorRequestStatusBodyType>({
		resolver: zodResolver(UpdateDoctorRequestStatusBodySchema),
		defaultValues: {
			status: RegistrationStatusName.Approved,
			reason: "",
		},
	});

	const detailQuery = useAdminDoctorRequestDetail(id ?? "");
	const request: DoctorRequestWithProfileAndUserResType | undefined = id
		? detailQuery.data?.data
		: undefined;

	const mutation = useAdminChangeStatusDoctorRequest();

	useEffect(() => {
		if (request) {
			form.reset({
				status: RegistrationStatusName.Approved,
				reason: request.reason ?? "",
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [request?.id]);

	const formatDateTime = (value: string | null | undefined) => {
		if (!value) return "—";
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return value;
		return d.toLocaleString();
	};

	const reset = () => {
		setId(undefined);
		form.reset();
	};

	const onSubmit = form.handleSubmit((data) => {
		if (!id) return;
		mutation.mutate(
			{
				id,
				status: data.status,
				reason: data.reason?.trim() || undefined,
			},
			{
				onSuccess: () => {
					reset();
				},
			},
		);
	});

	const disabled = mutation.isPending || !id;

	return (
		<Dialog
			open={Boolean(id)}
			onOpenChange={(open) => {
				if (!open) reset();
			}}
		>
			<DialogContent className="sm:max-w-3xl">
				<form onSubmit={onSubmit} className="space-y-4">
					<DialogHeader>
						<DialogTitle>Doctor request detail</DialogTitle>
						<DialogDescription>
							View the doctor&apos;s registration request and update its status.
						</DialogDescription>
					</DialogHeader>

					{detailQuery.isLoading ? (
						<div className="space-y-4">
							<Card>
								<CardHeader>
									<Skeleton className="h-5 w-40" />
									<Skeleton className="h-4 w-64" />
								</CardHeader>
								<CardContent className="space-y-3">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-5/6" />
									<Skeleton className="h-4 w-2/3" />
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<Skeleton className="h-5 w-56" />
									<Skeleton className="h-4 w-72" />
								</CardHeader>
								<CardContent className="space-y-3">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-5/6" />
									<Skeleton className="h-4 w-2/3" />
								</CardContent>
							</Card>
						</div>
					) : detailQuery.isError ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-destructive">
									Failed to load request
								</CardTitle>
								<CardDescription>
									Please close and reopen this dialog to try again.
								</CardDescription>
							</CardHeader>
						</Card>
					) : !request ? (
						<Card>
							<CardHeader>
								<CardTitle>No data</CardTitle>
								<CardDescription>Request was not found.</CardDescription>
							</CardHeader>
						</Card>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-4">
								<Card>
									<CardHeader>
										<CardTitle>Request</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3 text-sm">
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<div className="space-y-1">
												<div className="text-muted-foreground">Title</div>
												<div className="font-medium">{request.title}</div>
											</div>
											<div className="space-y-1">
												<div className="text-muted-foreground">Status</div>
												<div className="font-medium capitalize">
													{request.registrationStatus}
												</div>
											</div>
										</div>

										<div className="space-y-1">
											<div className="text-muted-foreground">Description</div>
											<div className="whitespace-pre-wrap">
												{request.description}
											</div>
										</div>

										{request.reason ? (
											<div className="space-y-1">
												<div className="text-muted-foreground">
													Previous reason
												</div>
												<div className="whitespace-pre-wrap">
													{request.reason}
												</div>
											</div>
										) : null}

										<Separator />

										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<div className="space-y-1">
												<div className="text-muted-foreground">Created at</div>
												<div className="font-medium">
													{formatDateTime(request.createdAt)}
												</div>
											</div>
											<div className="space-y-1">
												<div className="text-muted-foreground">Updated at</div>
												<div className="font-medium">
													{formatDateTime(request.updatedAt)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Update status</CardTitle>
										<CardDescription>
											Approve, reject, or suspend this request. Reason is
											required for reject / suspend.
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3 text-sm">
										<FieldGroup>
											<Controller
												name="status"
												control={form.control}
												render={({ field, fieldState }) => (
													<Field data-invalid={fieldState.invalid}>
														<FieldLabel>New status</FieldLabel>
														<Select
															value={field.value}
															onValueChange={field.onChange}
														>
															<SelectTrigger className="capitalize">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem
																	value={RegistrationStatusName.Approved}
																	className="capitalize"
																>
																	{RegistrationStatusName.Approved}
																</SelectItem>
																<SelectItem
																	value={RegistrationStatusName.Rejected}
																	className="capitalize"
																>
																	{RegistrationStatusName.Rejected}
																</SelectItem>
																<SelectItem
																	value={RegistrationStatusName.Suspended}
																	className="capitalize"
																>
																	{RegistrationStatusName.Suspended}
																</SelectItem>
															</SelectContent>
														</Select>
														{fieldState.invalid && (
															<FieldError errors={[fieldState.error]} />
														)}
													</Field>
												)}
											/>

											<Controller
												name="reason"
												control={form.control}
												render={({ field, fieldState }) => (
													<Field data-invalid={fieldState.invalid}>
														<FieldLabel>Reason</FieldLabel>
														<Textarea
															{...field}
															placeholder="Optional for approve, required for reject / suspend"
															rows={3}
														/>
														{fieldState.invalid && (
															<FieldError errors={[fieldState.error]} />
														)}
													</Field>
												)}
											/>
										</FieldGroup>
									</CardContent>
								</Card>
							</div>

							<div className="space-y-4">
								<Card>
									<CardHeader>
										<CardTitle>Doctor profile</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3 text-sm">
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<div className="space-y-1">
												<div className="text-muted-foreground">Doctor type</div>
												<div className="font-medium capitalize">
													{request.doctorProfile.doctorType}
												</div>
											</div>
											<div className="space-y-1">
												<div className="text-muted-foreground">
													Specialization
												</div>
												<div className="font-medium">
													{request.doctorProfile.specialization}
												</div>
											</div>
										</div>

										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											<div className="space-y-1">
												<div className="text-muted-foreground">
													License number
												</div>
												<div className="font-medium">
													{request.doctorProfile.licenseNumber}
												</div>
											</div>
											<div className="space-y-1">
												<div className="text-muted-foreground">
													License expiry
												</div>
												<div className="font-medium">
													{request.doctorProfile.licenseExpiryDate}
												</div>
											</div>
										</div>

										{request.doctorProfile.bio ? (
											<div className="space-y-1">
												<div className="text-muted-foreground">Bio</div>
												<div className="whitespace-pre-wrap">
													{request.doctorProfile.bio}
												</div>
											</div>
										) : null}
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>User</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3 text-sm">
										<div className="space-y-1">
											<div className="text-muted-foreground">Email</div>
											<div className="font-medium">{request.user.email}</div>
										</div>
										<div className="space-y-1">
											<div className="text-muted-foreground">Full name</div>
											<div className="font-medium">
												{request.user.fullName ?? "—"}
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2">
						<DialogClose asChild>
							<Button
								type="button"
								variant="outline"
								disabled={mutation.isPending}
							>
								Close
							</Button>
						</DialogClose>
						<Button type="submit" disabled={disabled}>
							{mutation.isPending ? "Updating..." : "Update status"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default UpdateRequest;
