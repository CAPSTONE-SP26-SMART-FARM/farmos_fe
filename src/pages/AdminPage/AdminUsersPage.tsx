import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const userRows = [
	{ name: "Admin Root", role: "Admin", status: "Active", email: "admin@farmos.local" },
	{ name: "Owner Demo", role: "Owner", status: "Active", email: "owner@farmos.local" },
	{ name: "Manager Demo", role: "Manager", status: "Active", email: "manager@farmos.local" },
	{ name: "Doctor Demo", role: "Doctor", status: "Pending", email: "doctor@farmos.local" },
];

function AdminUsersPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<Badge className="mb-2">Admin Portal</Badge>
					<h1 className="text-2xl font-bold">User Management</h1>
					<p className="text-muted-foreground">
						Quản lý tài khoản người dùng theo role và trạng thái hoạt động.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">Export</Button>
					<Button>Create User</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>User List</CardTitle>
					<CardDescription>Danh sách tài khoản theo role và trạng thái hoạt động.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/60">
								<tr className="text-left">
									<th className="p-3">Name</th>
									<th className="p-3">Email</th>
									<th className="p-3">Role</th>
									<th className="p-3">Status</th>
								</tr>
							</thead>
							<tbody>
								{userRows.map((row) => (
									<tr key={row.email} className="border-t">
										<td className="p-3">{row.name}</td>
										<td className="p-3">{row.email}</td>
										<td className="p-3">{row.role}</td>
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

export default AdminUsersPage;
