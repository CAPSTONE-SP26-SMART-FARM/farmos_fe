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
    cell: ({ row }) => {
      const Icon = statusIcon[row.original.registrationStatus];
      return <Icon />;
    },
  },
];
