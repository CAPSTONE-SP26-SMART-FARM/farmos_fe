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
import { useDoctorMyAssignmentDetail } from "@/queries/useDoctor";
import type { AssignmentWithOwnerResType } from "@/schemaValidatation/doctorAssignment";

interface Props {
	id?: string;
	setId: (id: string | undefined) => void;
}

const DoctorAssignmentDetailDialog = ({ id, setId }: Props) => {
	const detailQuery = useDoctorMyAssignmentDetail(id ?? "");
	const detail: AssignmentWithOwnerResType | undefined = detailQuery.data?.data;

	const reset = () => setId(undefined);

	const formatDateTime = (value: string | null | undefined) => {
		if (!value) return "—";
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return value;
		return d.toLocaleString();
	};

	return (
		<Dialog
			open={Boolean(id)}
			onOpenChange={(open) => {
				if (!open) reset();
			}}
		>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Assignment detail</DialogTitle>
					<DialogDescription>
						Thông tin assignment (doctor ↔ owner) của bạn.
					</DialogDescription>
				</DialogHeader>

				{detailQuery.isLoading ? (
					<div className="space-y-4">
						<Card>
							<CardHeader>
								<Skeleton className="h-5 w-48" />
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
							<CardTitle className="text-destructive">Failed to load</CardTitle>
							<CardDescription>Please try again.</CardDescription>
						</CardHeader>
					</Card>
				) : !detail ? (
					<Card>
						<CardHeader>
							<CardTitle>No data</CardTitle>
							<CardDescription>Assignment was not found.</CardDescription>
						</CardHeader>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Assignment</CardTitle>
								<CardDescription className="break-all">
									ID: {detail.id}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div className="space-y-1">
										<div className="text-muted-foreground">Status</div>
										<div className="font-medium capitalize">
											{detail.status}
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-muted-foreground">Primary</div>
										<div className="font-medium">
											{detail.isPrimary ? "Yes" : "No"}
										</div>
									</div>
								</div>

								{detail.notes ? (
									<div className="space-y-1">
										<div className="text-muted-foreground">Notes</div>
										<div className="whitespace-pre-wrap">{detail.notes}</div>
									</div>
								) : null}

								<Separator />

								<div className="space-y-1">
									<div className="text-muted-foreground">Assigned at</div>
									<div className="font-medium">
										{formatDateTime(detail.assignedAt)}
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Owner</CardTitle>
								<CardDescription className="break-all">
									ID: {detail.owner.id}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<div>
									<div className="text-muted-foreground">Email</div>
									<div className="font-medium">{detail.owner.email}</div>
								</div>
								<div>
									<div className="text-muted-foreground">Full name</div>
									<div className="font-medium">
										{detail.owner.fullName ?? "—"}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Close</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DoctorAssignmentDetailDialog;

