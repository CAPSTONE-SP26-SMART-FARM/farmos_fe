import { Button } from "@/components/ui/button";
import { Info, type LucideIcon } from "lucide-react";
import { createContext, useContext, useState } from "react";

import { useDoctorListRequest } from "@/queries/useDoctor";
import { type RegistrationStatusNameType } from "@/constants/profile";
import AddRequest from "../AddRequest/AddRequest";
import { Clock, CheckCircle2, XCircle, PauseCircle } from "lucide-react";
import DetailRequest from "../DetailRequest/DetailRequest";
import TableRequestShell, {
	baseColumnRequest,
} from "@/components/common/TableRequestShell/TableRequestShell";
import type { DoctorRequestResType } from "@/schemaValidatation/doctorProfile";
import type { ColumnDef } from "@tanstack/react-table";

export const statusIcon: Record<RegistrationStatusNameType, LucideIcon> = {
	pending: Clock,
	approved: CheckCircle2,
	rejected: XCircle,
	suspended: PauseCircle,
};

const RequestTableContext = createContext<{
	setRequestIdDetail: (id: string | undefined) => void;
	requestIdDetail: string | undefined;
}>({
	setRequestIdDetail: (id: string | undefined) => {},
	requestIdDetail: undefined,
});

export const columnsRequestDoctorOfDoctor: ColumnDef<DoctorRequestResType>[] = [
	...baseColumnRequest,
	{
		accessorKey: "action",
		header: "Action",
		cell: ({ row }) => {
			const { setRequestIdDetail } = useContext(RequestTableContext);
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
const RequestTable = () => {
	const [requestIdDetail, setRequestIdDetail] = useState<string | undefined>(
		undefined,
	);

	return (
		<RequestTableContext.Provider
			value={{ requestIdDetail, setRequestIdDetail }}
		>
			<TableRequestShell
				columns={columnsRequestDoctorOfDoctor}
				useQueryHook={useDoctorListRequest}
				toolbarRight={<AddRequest />}
			/>
			<DetailRequest id={requestIdDetail} setId={setRequestIdDetail} />
		</RequestTableContext.Provider>
	);
};

export default RequestTable;
