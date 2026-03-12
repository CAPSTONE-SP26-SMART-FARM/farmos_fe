import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import React from "react";
import TableRequestDoctor from "./TableRequestDoctor";

const ListRequestAdmin = () => {
	return (
		<main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
			<div className="space-y-2">
				<Card x-chunk="dashboard-06-chunk-0">
					<CardHeader>
						<CardTitle>My request</CardTitle>
						<CardDescription>
							Request to admin to become a doctor of platform
						</CardDescription>
					</CardHeader>
					<CardContent>
						<TableRequestDoctor />
					</CardContent>
				</Card>
			</div>
		</main>
	);
};

export default ListRequestAdmin;
