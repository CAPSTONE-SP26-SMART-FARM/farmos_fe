import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const performanceRows = [
	{ doctor: "Dr. Tran Van A", resolved: 58, processing: 7, avgHours: 21, sla: "95%" },
	{ doctor: "Dr. Hoang Thi B", resolved: 47, processing: 9, avgHours: 27, sla: "91%" },
	{ doctor: "Dr. Nguyen Van C", resolved: 39, processing: 6, avgHours: 24, sla: "93%" },
];

function AdminDoctorPerformancePage() {
	return (
		<div className="space-y-6">
			<div>
				<Badge className="mb-2">Admin Portal</Badge>
				<h1 className="text-2xl font-bold">Doctor Performance</h1>
				<p className="text-muted-foreground">
					Theo dõi hiệu suất xử lý ticket của Doctor theo từng mốc thời gian.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Performance Table</CardTitle>
					<CardDescription>Hiệu suất xử lý ticket của từng Doctor.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/60">
								<tr className="text-left">
									<th className="p-3">Doctor</th>
									<th className="p-3">Resolved</th>
									<th className="p-3">Processing</th>
									<th className="p-3">Avg Resolution (h)</th>
									<th className="p-3">SLA</th>
								</tr>
							</thead>
							<tbody>
								{performanceRows.map((row) => (
									<tr key={row.doctor} className="border-t">
										<td className="p-3">{row.doctor}</td>
										<td className="p-3">{row.resolved}</td>
										<td className="p-3">{row.processing}</td>
										<td className="p-3">{row.avgHours}</td>
										<td className="p-3">
											<Badge
												variant={
													Number(row.sla.replace("%", "")) >= 92
														? "default"
														: "secondary"
												}
											>
												{row.sla}
											</Badge>
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

export default AdminDoctorPerformancePage;
