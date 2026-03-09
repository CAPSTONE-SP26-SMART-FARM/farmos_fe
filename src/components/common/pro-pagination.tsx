import type { To } from "react-router";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "../ui/pagination";

import { ChevronLeft, ChevronRight } from "lucide-react";
import usePaginateRange from "@/hooks/usePaginateRange";
import { Button } from "../ui/button";

interface Props<T extends Record<string, any> = Record<string, any>> {
	queryConfig?: T;
	totalPages: number;
	currentPage: number;
	buildHref: (page: number | undefined | null) => To;
}

const ProPagination = ({
	queryConfig,
	totalPages,
	currentPage,
	buildHref,
}: Props) => {
	const pages = usePaginateRange(totalPages, currentPage);

	return (
		<Pagination className="mt-8">
			<PaginationContent>
				<PaginationItem>
					{currentPage === 1 ? (
						<Button size={"sm"} disabled variant={"ghost"}>
							<ChevronLeft /> Pre
						</Button>
					) : (
						<PaginationPrevious to={buildHref(currentPage - 1)} />
					)}
				</PaginationItem>

				{pages.map((item, idx) =>
					typeof item === "string" ? (
						<PaginationItem key={`${item}-${idx}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={item}>
							<PaginationLink
								to={buildHref(item)}
								isActive={item === currentPage}
							>
								{item}
							</PaginationLink>
						</PaginationItem>
					),
				)}

				<PaginationItem>
					{currentPage === totalPages ? (
						<Button size={"sm"} disabled variant={"ghost"}>
							Next <ChevronRight />
						</Button>
					) : (
						<PaginationNext to={buildHref(currentPage + 1)} />
					)}
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
};

export default ProPagination;
