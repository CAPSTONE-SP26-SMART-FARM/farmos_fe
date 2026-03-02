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

const ticketAnalyticsRows = [
	{
		doctor: "Dr. Tran Van A",
		processing: 7,
		resolved: 58,
		escalated: 1,
		avgResolution: "21h",
	},
	{
		doctor: "Dr. Hoang Thi B",
		processing: 9,
		resolved: 47,
		escalated: 3,
		avgResolution: "27h",
	},
	{
		doctor: "Dr. Nguyen Van C",
		processing: 6,
		resolved: 39,
		escalated: 2,
		avgResolution: "24h",
	},
	{
		doctor: "Dr. Le Thi D",
		processing: 4,
		resolved: 33,
		escalated: 1,
		avgResolution: "29h",
	},
];

function AdminTicketAnalyticsPage() {
	const [timeRange, setTimeRange] = useState<TimeRangeValue>("30d");
	const [fromDate, setFromDate] = useState("2026-02-01");
	const [toDate, setToDate] = useState("2026-03-01");

	const ticketSummary = useMemo(() => {
		const processing = ticketAnalyticsRows.reduce((acc, row) => acc + row.processing, 0);
		const resolved = ticketAnalyticsRows.reduce((acc, row) => acc + row.resolved, 0);
		const escalated = ticketAnalyticsRows.reduce((acc, row) => acc + row.escalated, 0);
		return { processing, resolved, escalated };
	}, []);

	return (
		<div className="space-y-6">
			<div>
				<Badge className="mb-2">Admin Portal</Badge>
				<h1 className="text-2xl font-bold">Ticket Analytics</h1>
				<p className="text-muted-foreground">
					Phân tích ticket theo bộ lọc thời gian: số lượng đang xử lý và đã xử lý
					của từng Doctor.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Ticket Analytics by Doctor</CardTitle>
					<CardDescription>
						Theo dõi số ticket đã xử lý và đang xử lý theo bộ lọc thời gian.
					</CardDescription>
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
							<Button variant="outline">Apply Filter</Button>
						</div>
					)}

					<div className="grid gap-3 md:grid-cols-3">
						<div className="rounded-md border p-3">
							<p className="text-xs text-muted-foreground">Processing Tickets</p>
							<p className="text-2xl font-semibold">{ticketSummary.processing}</p>
						</div>
						<div className="rounded-md border p-3">
							<p className="text-xs text-muted-foreground">Resolved Tickets</p>
							<p className="text-2xl font-semibold">{ticketSummary.resolved}</p>
						</div>
						<div className="rounded-md border p-3">
							<p className="text-xs text-muted-foreground">Escalated Tickets</p>
							<p className="text-2xl font-semibold">{ticketSummary.escalated}</p>
						</div>
					</div>

					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/60">
								<tr className="text-left">
									<th className="p-3">Doctor</th>
									<th className="p-3">Processing</th>
									<th className="p-3">Resolved</th>
									<th className="p-3">Escalated</th>
									<th className="p-3">Avg Resolution</th>
								</tr>
							</thead>
							<tbody>
								{ticketAnalyticsRows.map((row) => (
									<tr key={row.doctor} className="border-t">
										<td className="p-3">{row.doctor}</td>
										<td className="p-3">{row.processing}</td>
										<td className="p-3">{row.resolved}</td>
										<td className="p-3">{row.escalated}</td>
										<td className="p-3">{row.avgResolution}</td>
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

export default AdminTicketAnalyticsPage;
