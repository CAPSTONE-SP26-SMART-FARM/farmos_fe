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
				<Badge className="mb-2">Cổng quản trị</Badge>
				<h1 className="text-2xl font-bold">Hiệu suất bác sĩ</h1>
				<p className="text-muted-foreground">
					Theo dõi hiệu suất xử lý vé hỗ trợ của bác sĩ theo từng mốc thời gian.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Bảng hiệu suất</CardTitle>
					<CardDescription>Hiệu suất xử lý vé hỗ trợ của từng bác sĩ.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/60">
								<tr className="text-left">
									<th className="p-3">Bác sĩ</th>
									<th className="p-3">Đã xử lý</th>
									<th className="p-3">Đang xử lý</th>
									<th className="p-3">TG xử lý TB (giờ)</th>
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
