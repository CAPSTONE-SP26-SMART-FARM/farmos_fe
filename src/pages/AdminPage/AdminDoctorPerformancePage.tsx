import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useMemo, useState } from "react";

type TimeRangeValue = "7d" | "30d" | "90d" | "custom";

const performanceRows = [
	{ doctor: "Dr. Tran Van A", resolved: 58, processing: 7, avgHours: 21, slaMet: 57, slaTotal: 60 },
	{ doctor: "Dr. Hoang Thi B", resolved: 47, processing: 9, avgHours: 27, slaMet: 43, slaTotal: 47 },
	{ doctor: "Dr. Nguyen Van C", resolved: 39, processing: 6, avgHours: 24, slaMet: 37, slaTotal: 39 },
];

const SLA_TARGET_HOURS = 24;

function AdminDoctorPerformancePage() {
	const [timeRange, setTimeRange] = useState<TimeRangeValue>("30d");
	const [fromDate, setFromDate] = useState("2026-02-01");
	const [toDate, setToDate] = useState("2026-03-01");

	const summary = useMemo(() => {
		const resolved = performanceRows.reduce((acc, r) => acc + r.resolved, 0);
		const processing = performanceRows.reduce((acc, r) => acc + r.processing, 0);
		const slaMet = performanceRows.reduce((acc, r) => acc + r.slaMet, 0);
		const slaTotal = performanceRows.reduce((acc, r) => acc + r.slaTotal, 0);
		const slaPct = slaTotal > 0 ? Math.round((slaMet / slaTotal) * 100) : 0;
		return { resolved, processing, slaMet, slaTotal, slaPct };
	}, []);

	return (
		<div className="space-y-6">
			<div>
				<Badge className="mb-2">Admin Portal</Badge>
				<h1 className="text-2xl font-bold">Doctor Performance</h1>
				<p className="text-muted-foreground">
					Theo dõi hiệu suất xử lý ticket của Doctor theo từng mốc thời gian.
				</p>
			</div>

			{/* SLA là gì + công thức */}
			<Card className="border-dashed">
				<CardHeader>
					<CardTitle className="text-base">Chỉ số SLA là gì?</CardTitle>
					<CardDescription>
						SLA (Service Level Agreement) = tỷ lệ ticket được đóng trong thời hạn cam kết.
						<br />
						<strong>Công thức:</strong> SLA (%) = (Số ticket đóng trong hạn / Tổng ticket đã đóng trong kỳ) × 100.
						<br />
						Ví dụ: mục tiêu {SLA_TARGET_HOURS}h — nếu trong kỳ có 60 ticket đóng mà 57 ticket đóng trong {SLA_TARGET_HOURS}h thì SLA = 95%.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Bộ lọc thời gian</CardTitle>
					<CardDescription>Xem hiệu suất theo khoảng thời gian (dữ liệu mẫu).</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						{(["7d", "30d", "90d", "custom"] as TimeRangeValue[]).map((range) => (
							<Button
								key={range}
								type="button"
								variant={timeRange === range ? "default" : "outline"}
								onClick={() => setTimeRange(range)}
							>
								{range === "custom" ? "Custom" : range.toUpperCase()}
							</Button>
						))}
					</div>
					{timeRange === "custom" && (
						<div className="grid gap-3 md:grid-cols-3">
							<Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
							<Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
							<Button variant="outline">Áp dụng</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Tổng Resolved</CardDescription>
						<CardTitle className="text-2xl">{summary.resolved}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Đang xử lý</CardDescription>
						<CardTitle className="text-2xl">{summary.processing}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>SLA đạt (ticket)</CardDescription>
						<CardTitle className="text-2xl">{summary.slaMet} / {summary.slaTotal}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>SLA tổng (%)</CardDescription>
						<CardTitle className="text-2xl">{summary.slaPct}%</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Performance theo Doctor</CardTitle>
					<CardDescription>Hiệu suất xử lý ticket của từng Doctor (SLA mục tiêu: {SLA_TARGET_HOURS}h).</CardDescription>
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
									<th className="p-3">SLA (đạt/tổng)</th>
									<th className="p-3">SLA %</th>
								</tr>
							</thead>
							<tbody>
								{performanceRows.map((row) => {
									const slaPct = row.slaTotal > 0 ? Math.round((row.slaMet / row.slaTotal) * 100) : 0;
									return (
										<tr key={row.doctor} className="border-t">
											<td className="p-3">{row.doctor}</td>
											<td className="p-3">{row.resolved}</td>
											<td className="p-3">{row.processing}</td>
											<td className="p-3">{row.avgHours}</td>
											<td className="p-3">{row.slaMet} / {row.slaTotal}</td>
											<td className="p-3">
												<Badge variant={slaPct >= 92 ? "default" : "secondary"}>
													{slaPct}%
												</Badge>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default AdminDoctorPerformancePage;
