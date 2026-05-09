import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetFarmMemberDetail } from "@/queries/useOwner";
import type { FarmMemberResType } from "@/schemaValidatation/farmMember";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  Phone,
  Shield,
  Tractor,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getRoleLabelVi, RoleName } from "@/constants/role";

interface Props {
  member: FarmMemberResType;
  onBack: () => void;
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
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-16 w-full"
        />
      ))}
    </CardContent>
  </Card>
);

export default function MemberDetailPanel({ member, onBack }: Props) {
  const [show, setShow] = useState(false);

  const { data, isLoading } = useOwnerGetFarmMemberDetail(member.id);
  const detail = data?.data ?? member;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const RoleIcon =
    detail.role === RoleName.Manager ? (
      <UserCog className="h-5 w-5 text-blue-600" />
    ) : (
      <Tractor className="h-5 w-5 text-green-600" />
    );

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Badge className="mb-1">Chi tiết tài khoản</Badge>
            <h1 className="text-2xl font-bold">{detail.user.fullName}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 px-3 py-1"
          >
            {RoleIcon}
            {getRoleLabelVi(detail.role)}
          </Badge>
          <Badge
            variant={detail.user.isActive ? "default" : "destructive"}
            className="px-3 py-1"
          >
            {detail.user.isActive ? "Hoạt động" : "Ngưng hoạt động"}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <DetailSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {RoleIcon}
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
