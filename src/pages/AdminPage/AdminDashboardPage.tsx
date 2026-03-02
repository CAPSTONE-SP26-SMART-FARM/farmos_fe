import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const kpis = [
	{ label: "Total Owners", value: "42", delta: "+6 this month" },
	{ label: "Pending Doctor Approvals", value: "9", delta: "3 urgent" },
	{ label: "Active Tickets", value: "124", delta: "18 high priority" },
	{ label: "IoT Alerts", value: "31", delta: "12 unresolved" },
];

function AdminDashboardPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<Badge className="mb-2">Admin Portal</Badge>
					<h1 className="text-2xl font-bold">Admin Dashboard</h1>
					<p className="text-muted-foreground">
						Tổng quan hệ thống, gói dịch vụ, ticket và trạng thái vận hành.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">Export</Button>
					<Button>New Action</Button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{kpis.map((kpi) => (
					<Card key={kpi.label}>
						<CardHeader className="pb-2">
							<CardDescription>{kpi.label}</CardDescription>
							<CardTitle className="text-2xl">{kpi.value}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-muted-foreground">{kpi.delta}</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Platform Health</CardTitle>
						<CardDescription>Trạng thái tổng quan của hệ thống FarmOS.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="flex items-center justify-between rounded-md border p-3">
							<span>API Availability</span>
							<Badge>99.4%</Badge>
						</div>
						<div className="flex items-center justify-between rounded-md border p-3">
							<span>MQTT Broker Uptime</span>
							<Badge>99.1%</Badge>
						</div>
						<div className="flex items-center justify-between rounded-md border p-3">
							<span>Active Alert Streams</span>
							<Badge variant="secondary">12 streams</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Admin Priorities</CardTitle>
						<CardDescription>Công việc ưu tiên trong 24h tới.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p className="rounded-md border p-3">Approve 3 pending Doctor applications.</p>
						<p className="rounded-md border p-3">Review 2 escalated disease tickets.</p>
						<p className="rounded-md border p-3">
							Publish 1 new IoT template for lettuce growth stage.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default AdminDashboardPage;
