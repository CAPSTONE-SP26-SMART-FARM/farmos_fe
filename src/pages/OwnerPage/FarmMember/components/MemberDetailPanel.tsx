import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetFarmMemberDetail } from "@/queries/useOwner";
import type { FarmMemberResType } from "@/schemaValidatation/farmMember";
import { format } from "date-fns";
import {
  Building2,
  Calendar,
  Mail,
  Phone,
  Shield,
  Tractor,
  UserCog,
} from "lucide-react";
import { getRoleLabelVi, RoleName } from "@/constants/role";

interface Props {
  member: FarmMemberResType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm");
  } catch {
    return d;
  }
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 rounded-md p-3 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

const DetailSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-48" />
    <Separator />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-16 w-full"
        />
      ))}
    </div>
  </div>
);

export default function MemberDetailDialog({ member, open, onOpenChange }: Props) {
  const { data, isLoading } = useOwnerGetFarmMemberDetail(member?.id ?? "");
  const detail = data?.data ?? member;

  if (!member || !detail) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết tài khoản</DialogTitle>
          </DialogHeader>
          <DetailSkeleton />
        </DialogContent>
      </Dialog>
    );
  }

  const RoleIcon =
    detail.role === RoleName.Manager ? (
      <UserCog className="h-5 w-5 text-blue-600" />
    ) : (
      <Tractor className="h-5 w-5 text-green-600" />
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {RoleIcon}
            {detail.user.fullName}
          </DialogTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="gap-1.5">
              {getRoleLabelVi(detail.role)}
            </Badge>
            <Badge variant={detail.user.isActive ? "default" : "destructive"}>
              {detail.user.isActive ? "Hoạt động" : "Ngưng hoạt động"}
            </Badge>
          </div>
        </DialogHeader>

        {isLoading ? (
          <DetailSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoCell
              icon={<Mail className="h-3 w-3" />}
              label="Email"
              value={detail.user.email}
            />
            <InfoCell
              icon={<Phone className="h-3 w-3" />}
              label="Số điện thoại"
              value={detail.user.phone ?? "—"}
            />
            <InfoCell
              icon={<Shield className="h-3 w-3" />}
              label="Vai trò"
              value={
                <Badge variant="secondary">
                  {getRoleLabelVi(detail.role)}
                </Badge>
              }
            />
            <InfoCell
              icon={<Building2 className="h-3 w-3" />}
              label="Nông trại"
              value={
                <span>
                  {detail.farm.name}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({detail.farm.code})
                  </span>
                </span>
              }
            />
            <InfoCell
              icon={<Calendar className="h-3 w-3" />}
              label="Ngày gán"
              value={formatDate(detail.assignedAt)}
            />
            <InfoCell
              icon={<Calendar className="h-3 w-3" />}
              label="Ngày tạo tài khoản"
              value={formatDate(detail.user.createdAt)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
