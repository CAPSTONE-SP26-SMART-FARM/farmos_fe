import TableRequestShell, {
  baseColumnRequest,
} from "@/components/common/TableRequestShell/TableRequestShell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminListDoctorRequest } from "@/queries/useAdmin";
import type { DoctorRequestResType } from "@/schemaValidatation/doctorProfile";
import type { ColumnDef } from "@tanstack/react-table";
import { Info, MoreVertical } from "lucide-react";
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
    header: "",
    cell: ({ row }) => {
      const { setRequestIdDetail } = useContext(RequestDoctorOfAdminContext);
      const onClick = () => {
        setRequestIdDetail(row.original.id);
      };
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>
              <Info className="h-4 w-4 mr-2" />
              View Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <UpdateRequest
        id={requestIdDetail}
        setId={setRequestIdDetail}
      />
    </RequestDoctorOfAdminContext.Provider>
  );
};

export default TableRequestDoctor;
