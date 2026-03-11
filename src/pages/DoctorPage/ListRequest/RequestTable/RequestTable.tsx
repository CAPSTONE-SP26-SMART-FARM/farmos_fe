import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
} from "@tanstack/react-table";
import type {
	DoctorRequestResType,
	DoctorRequestType,
	ListDoctorRequestsQueryType,
	ListDoctorRequestsResType,
} from "@/schemaValidatation/doctorProfile";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import ProPagination from "@/components/common/pro-pagination";
import { useDoctorListRequest } from "@/queries/useDoctor";
import { type RegistrationStatusNameType } from "@/constants/profile";
import useDebounce from "@/hooks/useDebounce";
import AddRequest from "../AddRequest/AddRequest";

export const columns: ColumnDef<DoctorRequestResType>[] = [
	{
		accessorKey: "id",
		header: "ID",
		cell: ({ row }) => <div>{row.getValue("id")}</div>,
	},
	{
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => <div>{row.getValue("title")}</div>,
	},
	{
		accessorKey: "reason",
		header: "Reason",
		cell: ({ row }) => <div>{row.getValue("reason")}</div>,
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <div>{row.getValue("status")}</div>,
	},
	{
		accessorKey: "action",
		header: "Action",
		cell: ({ row }) => (
			<div>
				<Button>
					<Info />
				</Button>
			</div>
		),
	},
];
const RequestTable = () => {
	const navigate = useNavigate();
	const [searchParam] = useSearchParams();
	const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
	const pageIndex = page - 1;
	const [filters, setFilters] = useState<Partial<ListDoctorRequestsQueryType>>({
		status: undefined,
		search: "",
	});

	const debouncedSearch = useDebounce(filters.search || "", 500);

	const listRequestDoctor = useDoctorListRequest({
		...filters,
		page,
		limit: 10,
	});
	console.log(filters);

	const data: DoctorRequestType[] = listRequestDoctor.data?.data.data ?? [];
	const totalPages = listRequestDoctor?.data?.data.meta.totalPages ?? 0;
	const totalRecords = listRequestDoctor?.data?.data.meta.totalItems ?? 0;
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [pagination, setPagination] = useState({
		pageIndex, // Gía trị mặc định ban đầu, không có ý nghĩa khi data được fetch bất đồng bộ
		pageSize: 10, //default page size
	});
	console.log(columnFilters);
	useEffect(() => {
		const searchFilter = columnFilters.find((filter) => filter.id === "title");
		const statusFilter = columnFilters.find((filter) => filter.id === "status");
		setFilters({
			status: (statusFilter?.value as RegistrationStatusNameType) || undefined,
			search: (searchFilter?.value as string) || "",
		});
	}, [columnFilters]);

	useEffect(() => {
		if (page > 1 && filters.status !== undefined) {
			navigate("/dashboard/doctor/my-request?page=1", { replace: true });
		}
	}, [debouncedSearch, filters, page, navigate]); // Chỉ chạy khi giá trị đã debounce thay đổi

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onPaginationChange: setPagination,
		manualPagination: true, // Chúng ta sẽ quản lý phân trang thủ công
		manualFiltering: true,
		autoResetPageIndex: false,
		pageCount: 100,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			pagination,
		},
	});

	// Function để clear filters
	const clearFilters = () => {
		table.resetColumnFilters();
	};

	useEffect(() => {
		table.setPagination({
			pageIndex,
			pageSize: 10,
		});
	}, [table, pageIndex]);
	return (
		<div className="w-full">
			<div className="flex items-center py-4 gap-2">
				<Input
					placeholder="Filter title..."
					value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
					onChange={(event) =>
						table.getColumn("title")?.setFilterValue(event.target.value ?? "")
					}
					className="max-w-sm"
				/>

				<Select
					onValueChange={(value) =>
						table.getColumn("status")?.setFilterValue(value ? value : undefined)
					}
					defaultValue="all"
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="ACTIVE">Active</SelectItem>
						<SelectItem value="INACTIVE">Inactive</SelectItem>
						<SelectItem value="BANNED">Banned</SelectItem>
						<SelectItem value="PENDING_VERIFICATION">
							Pending Verification
						</SelectItem>
					</SelectContent>
				</Select>

				<div className="ml-auto flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={clearFilters}
						// disabled={
						// 	!filters.email &&
						// 	filters.role === "all" &&
						// 	filters.status === "all"
						// }
						// className={`transition-all ${
						// 	filters.email ||
						// 	filters.role !== "all" ||
						// 	filters.status !== "all"
						// 		? "font-medium opacity-100"
						// 		: "opacity-50 font-normal"
						// }`}
					>
						Clear filters
						<X className="ml-2 h-4 w-4" />
					</Button>

					<AddRequest />
				</div>
			</div>
			<div className="rounded-md border">
				{/* {listRequestDoctor.isLoading && <SkeletonTableBasic />} */}
				{
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				}
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="text-xs text-muted-foreground py-4 flex-1 ">
					Show <strong>{table.getPaginationRowModel().rows.length}</strong> in{" "}
					<strong>{totalRecords}</strong> result
				</div>
				<div>
					<ProPagination
						currentPage={page}
						totalPages={totalPages}
						buildHref={(page: number | null | undefined) => {
							const params = new URLSearchParams(searchParam);
							if (page) {
								params.set("page", String(page));
							} else {
								params.delete("page");
							}
							return {
								pathname: location.pathname,
								search: params.toString(),
							};
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default RequestTable;
