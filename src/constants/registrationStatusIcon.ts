import {
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";
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
