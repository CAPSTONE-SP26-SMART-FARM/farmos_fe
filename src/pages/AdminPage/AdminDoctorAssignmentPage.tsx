import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import ListAssignmentDoctor from "./AssignmentDoctor/ListAssignmentDoctor";
import AssignDoctorDialog from "./AssignmentDoctor/AssignDoctorDialog";

function AdminDoctorAssignmentPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<Badge className="mb-2">Admin Portal</Badge>
					<h1 className="text-2xl font-bold">Doctor Assignment</h1>
					<p className="text-muted-foreground">
						Gán Doctor cho Owner/Farm và theo dõi phân bổ nguồn lực.
					</p>
				</div>
				<AssignDoctorDialog />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Assignment Matrix</CardTitle>
					<CardDescription>Danh sách gán Doctor cho Owner.</CardDescription>
				</CardHeader>
				<CardContent>
					<ListAssignmentDoctor />
				</CardContent>
			</Card>
		</div>
	);
}

export default AdminDoctorAssignmentPage;
