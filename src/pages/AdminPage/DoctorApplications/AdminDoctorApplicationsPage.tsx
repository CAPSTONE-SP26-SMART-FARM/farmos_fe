import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const doctorApplicationRows = [
	{
		name: "Dr. Tran Van A",
		specialty: "Plant Disease",
		submittedAt: "2026-02-18",
		status: "Pending",
	},
	{
		name: "Dr. Hoang Thi B",
		specialty: "Crop Nutrition",
		submittedAt: "2026-02-20",
		status: "Pending",
	},
	{
		name: "Dr. Nguyen Van C",
		specialty: "Soil Science",
		submittedAt: "2026-02-22",
		status: "Under Review",
	},
];

function AdminDoctorApplicationsPage() {
	return (
		<div className="space-y-6">
			<div>
				<Badge className="mb-2">Admin Portal</Badge>
				<h1 className="text-2xl font-bold">Doctor Applications</h1>
				<p className="text-muted-foreground">
					Xét duyệt hồ sơ đăng ký Doctor và xử lý trạng thái hồ sơ.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Pending Applications</CardTitle>
					<CardDescription>Hồ sơ đăng ký Doctor cần xét duyệt.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{doctorApplicationRows.map((row) => (
						<div key={row.name} className="rounded-md border p-4">
							<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
								<p className="font-medium">{row.name}</p>
								<Badge variant={row.status === "Pending" ? "secondary" : "outline"}>
									{row.status}
								</Badge>
							</div>
							<p className="text-sm text-muted-foreground">
								Specialty: {row.specialty} | Submitted: {row.submittedAt}
							</p>
							<div className="mt-3 flex gap-2">
								<Button size="sm">Approve</Button>
								<Button size="sm" variant="outline">
									Review Detail
								</Button>
								<Button size="sm" variant="ghost">
									Reject
								</Button>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export default AdminDoctorApplicationsPage;
