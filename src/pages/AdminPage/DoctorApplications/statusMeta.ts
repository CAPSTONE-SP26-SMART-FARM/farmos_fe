import {
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  variant: BadgeVariant;
  className: string;
  dotClass: string;
}

export const REGISTRATION_STATUS_META: Record<
  RegistrationStatusNameType,
  StatusMeta
> = {
  [RegistrationStatusName.Pending]: {
    label: "Chờ duyệt",
    icon: Clock,
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  [RegistrationStatusName.Approved]: {
    label: "Đã duyệt",
    icon: CheckCircle2,
    variant: "default",
    className:
      "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  [RegistrationStatusName.Rejected]: {
    label: "Đã từ chối",
    icon: XCircle,
    variant: "destructive",
    className:
      "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300",
    dotClass: "bg-rose-500",
  },
  [RegistrationStatusName.Suspended]: {
    label: "Tạm ngưng",
    icon: PauseCircle,
    variant: "outline",
    className:
      "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-500/15 dark:text-slate-300",
    dotClass: "bg-slate-500",
  },
};

export const DOCTOR_TYPE_LABEL: Record<string, string> = {
  internal: "Bác sĩ nội bộ",
  partner: "Bác sĩ đối tác",
  coordinator: "Điều phối viên",
};
