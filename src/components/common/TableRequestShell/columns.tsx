import {
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DoctorRequestResType } from "@/schemaValidatation/doctorProfile";
import {
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";

export const statusIcon: Record<RegistrationStatusNameType, LucideIcon> = {
  [RegistrationStatusName.Pending]: Clock,
  [RegistrationStatusName.Approved]: CheckCircle2,
  [RegistrationStatusName.Rejected]: XCircle,
  [RegistrationStatusName.Suspended]: PauseCircle,
};

export const baseColumnRequest: ColumnDef<DoctorRequestResType>[] = [
  {
    accessorKey: "id",
    header: "Mã",
    cell: ({ row }) => <div>{row.getValue("id")}</div>,
  },
  {
    accessorKey: "title",
    header: "Tiêu đề",
    cell: ({ row }) => <div>{row.getValue("title")}</div>,
  },
  {
    accessorKey: "reason",
    header: "Lý do",
    cell: ({ row }) => <div>{row.getValue("reason")}</div>,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const Icon = statusIcon[row.original.registrationStatus];
      return <Icon />;
    },
  },
];
