import TableRequestShell, {
	baseColumnRequest,
} from "@/components/common/TableRequestShell/TableRequestShell";
import { Button } from "@/components/ui/button";
import { useAdminListDoctorRequest } from "@/queries/useAdmin";
import type { DoctorRequestResType } from "@/schemaValidatation/doctorProfile";
import type { ColumnDef } from "@tanstack/react-table";
import { Info } from "lucide-react";
import { createContext, useContext, useState } from "react";
import UpdateRequest from "./UpdateRequest";

const RequestDoctorOfAdminContext = createContext<{
	setRequestIdDetail: (id: string | undefined) => void;
	requestIdDetail: string | undefined;
}>({
	setRequestIdDetail: (id: string | undefined) => {},
	requestIdDetail: undefined,
});

export const columnsRequestDoctorOfAdmin: ColumnDef<DoctorRequestResType>[] = [
	...baseColumnRequest,
	{
		accessorKey: "action",
		header: "Action",
		cell: ({ row }) => {
			const { setRequestIdDetail } = useContext(RequestDoctorOfAdminContext);
			const onClick = () => {
				setRequestIdDetail(row.original.id);
			};
			return (
				<Button variant="ghost" onClick={onClick}>
					<Info />
				</Button>
			);
		},
	},
];

const TableRequestDoctor = () => {
	const [requestIdDetail, setRequestIdDetail] = useState<string | undefined>(
		undefined,
	);
	return (
		<RequestDoctorOfAdminContext.Provider
			value={{
				requestIdDetail,
				setRequestIdDetail,
			}}
		>
			<TableRequestShell
				columns={columnsRequestDoctorOfAdmin}
				useQueryHook={useAdminListDoctorRequest}
			/>
			<UpdateRequest id={requestIdDetail} setId={setRequestIdDetail} />
		</RequestDoctorOfAdminContext.Provider>
	);
};

export default TableRequestDoctor;
