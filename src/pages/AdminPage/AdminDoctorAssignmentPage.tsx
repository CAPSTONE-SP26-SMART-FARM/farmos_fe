import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const assignmentRows = [
	{
		owner: "Green Valley Farm",
		doctor: "Dr. Tran Van A",
		farms: 2,
		openTickets: 6,
	},
	{
		owner: "Sunrise Agriculture",
		doctor: "Dr. Hoang Thi B",
		farms: 3,
		openTickets: 4,
	},
	{
		owner: "Delta Organics",
		doctor: "Unassigned",
		farms: 1,
		openTickets: 2,
	},
];

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
				<Button>Assign Doctor</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Assignment Matrix</CardTitle>
					<CardDescription>Phân bổ Doctor theo Owner/Farm.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/60">
								<tr className="text-left">
									<th className="p-3">Owner</th>
									<th className="p-3">Assigned Doctor</th>
									<th className="p-3">Farms</th>
									<th className="p-3">Open Tickets</th>
									<th className="p-3">Action</th>
								</tr>
							</thead>
							<tbody>
								{assignmentRows.map((row) => (
									<tr key={row.owner} className="border-t">
										<td className="p-3">{row.owner}</td>
										<td className="p-3">{row.doctor}</td>
										<td className="p-3">{row.farms}</td>
										<td className="p-3">{row.openTickets}</td>
										<td className="p-3">
											<Button size="sm" variant="outline">
												Assign / Reassign
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default AdminDoctorAssignmentPage;
