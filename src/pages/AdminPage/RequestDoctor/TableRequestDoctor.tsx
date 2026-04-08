import TableRequestShell from "@/components/common/TableRequestShell/TableRequestShell";
import { baseColumnRequest } from "@/components/common/TableRequestShell/columns";
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
import { useMemo, useState } from "react";
import UpdateRequest from "./UpdateRequest";

const createColumnsRequestDoctorOfAdmin = (
  onViewDetail: (id: string) => void,
): ColumnDef<DoctorRequestResType>[] => [
  ...baseColumnRequest,
  {
    accessorKey: "action",
    header: "",
    cell: ({ row }) => (
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
          <DropdownMenuItem onClick={() => onViewDetail(row.original.id)}>
            <Info className="h-4 w-4 mr-2" />
            View Detail
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const TableRequestDoctor = () => {
  const [requestIdDetail, setRequestIdDetail] = useState<string | undefined>(
    undefined,
  );
  const columns = useMemo(
    () =>
      createColumnsRequestDoctorOfAdmin((id) => {
        setRequestIdDetail(id);
      }),
    [],
  );

  return (
    <>
      <TableRequestShell
        columns={columns}
        useQueryHook={useAdminListDoctorRequest}
      />
      <UpdateRequest
        id={requestIdDetail}
        setId={setRequestIdDetail}
      />
    </>
  );
};

export default TableRequestDoctor;
