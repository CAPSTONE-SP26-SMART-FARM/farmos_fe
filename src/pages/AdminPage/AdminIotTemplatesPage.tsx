import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const iotTemplateRows = [
	{
		template: "Tomato - Seeding",
		moisture: "55-70%",
		temperature: "24-28C",
		ph: "5.8-6.5",
	},
	{
		template: "Tomato - Growth",
		moisture: "50-65%",
		temperature: "22-30C",
		ph: "5.8-6.8",
	},
	{
		template: "Lettuce - Growth",
		moisture: "60-75%",
		temperature: "18-24C",
		ph: "6.0-6.8",
	},
];

function AdminIotTemplatesPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<Badge className="mb-2">Admin Portal</Badge>
					<h1 className="text-2xl font-bold">IoT Templates</h1>
					<p className="text-muted-foreground">
						Cấu hình và quản lý ngưỡng IoT theo loại cây trồng và giai đoạn sinh trưởng.
					</p>
				</div>
				<Button>Create Template</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>IoT Threshold Templates</CardTitle>
					<CardDescription>Template ngưỡng theo cây trồng và giai đoạn.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/60">
								<tr className="text-left">
									<th className="p-3">Template</th>
									<th className="p-3">Soil Moisture</th>
									<th className="p-3">Temperature</th>
									<th className="p-3">pH</th>
								</tr>
							</thead>
							<tbody>
								{iotTemplateRows.map((row) => (
									<tr key={row.template} className="border-t">
										<td className="p-3">{row.template}</td>
										<td className="p-3">{row.moisture}</td>
										<td className="p-3">{row.temperature}</td>
										<td className="p-3">{row.ph}</td>
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

export default AdminIotTemplatesPage;
