import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const packageRows = [
	{ name: "Starter", duration: "12 months", kits: 10, tickets: 20, status: "Active" },
	{ name: "Growth", duration: "12 months", kits: 25, tickets: 50, status: "Active" },
	{ name: "Scale", duration: "12 months", kits: 50, tickets: 120, status: "Draft" },
];

function AdminPackagesPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<Badge className="mb-2">Admin Portal</Badge>
					<h1 className="text-2xl font-bold">Subscription Packages</h1>
					<p className="text-muted-foreground">
						Quản lý gói đăng ký theo thời lượng, số IoT kits và số doctor tickets.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">Export</Button>
					<Button>Create Package</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Package List</CardTitle>
					<CardDescription>Danh sách gói dịch vụ và thông số vận hành.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/60">
								<tr className="text-left">
									<th className="p-3">Package</th>
									<th className="p-3">Duration</th>
									<th className="p-3">IoT Kits</th>
									<th className="p-3">Doctor Tickets</th>
									<th className="p-3">Status</th>
								</tr>
							</thead>
							<tbody>
								{packageRows.map((row) => (
									<tr key={row.name} className="border-t">
										<td className="p-3">{row.name}</td>
										<td className="p-3">{row.duration}</td>
										<td className="p-3">{row.kits}</td>
										<td className="p-3">{row.tickets}</td>
										<td className="p-3">
											<Badge variant={row.status === "Active" ? "default" : "secondary"}>
												{row.status}
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

export default AdminPackagesPage;
