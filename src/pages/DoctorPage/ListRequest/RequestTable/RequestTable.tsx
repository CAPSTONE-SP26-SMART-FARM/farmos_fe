import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useMemo, useState } from "react";

import { useDoctorListRequest } from "@/queries/useDoctor";
import AddRequest from "../AddRequest/AddRequest";
import DetailRequest from "../DetailRequest/DetailRequest";
import TableRequestShell from "@/components/common/TableRequestShell/TableRequestShell";
import { baseColumnRequest } from "@/components/common/TableRequestShell/columns";
import type { DoctorRequestResType } from "@/schemaValidatation/doctorProfile";
import type { ColumnDef } from "@tanstack/react-table";

const createColumnsRequestDoctorOfDoctor = (
  onViewDetail: (id: string) => void,
): ColumnDef<DoctorRequestResType>[] => [
  ...baseColumnRequest,
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        onClick={() => onViewDetail(row.original.id)}
      >
        <Info />
      </Button>
    ),
  },
];

const RequestTable = () => {
  const [requestIdDetail, setRequestIdDetail] = useState<string | undefined>(
    undefined,
  );
  const columns = useMemo(
    () =>
      createColumnsRequestDoctorOfDoctor((id) => {
        setRequestIdDetail(id);
      }),
    [],
  );

  return (
    <>
      <TableRequestShell
        columns={columns}
        useQueryHook={useDoctorListRequest}
        toolbarRight={<AddRequest />}
      />
      <DetailRequest
        id={requestIdDetail}
        setId={setRequestIdDetail}
      />
    </>
  );
};

export default RequestTable;
