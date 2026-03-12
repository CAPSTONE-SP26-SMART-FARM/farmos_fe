import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "../ui/table";
const TableSkeleton = () => {
	return Array.from({ length: 5 }).map((_, i) => (
		<TableRow key={i}>
			{Array.from({ length: 5 }).map((__, j) => (
				<TableCell key={j}>
					<Skeleton className="h-10 w-full" />
				</TableCell>
			))}
		</TableRow>
	));
};

export default TableSkeleton;
