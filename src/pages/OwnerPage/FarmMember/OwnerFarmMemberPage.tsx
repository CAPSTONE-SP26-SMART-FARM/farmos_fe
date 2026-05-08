import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import type { FarmMemberResType } from "@/schemaValidatation/farmMember";
import { useState } from "react";
import AddMemberPanel from "./components/AddMemberPanel";
import MemberDetailPanel from "./components/MemberDetailPanel";
import MemberListSection from "./components/MemberListSection";

function OwnerFarmMemberPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [viewingMember, setViewingMember] = useState<FarmMemberResType | null>(
    null,
  );

  const { data, isLoading, isError } = useOwnerGetMyFarm();
  const farm = data?.data;

  if (showAdd && farm) {
    return (
      <AddMemberPanel
        farmCode={farm.code}
        onBack={() => setShowAdd(false)}
      />
    );
  }

  if (viewingMember) {
    return (
      <MemberDetailPanel
        member={viewingMember}
        onBack={() => setViewingMember(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng chủ trang trại</Badge>
          <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
          <p className="text-muted-foreground">
            Quản lý tài khoản được phân công cho trang trại của bạn.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : isError || !farm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Không thể tải dữ liệu trang trại. Vui lòng tạo trang trại trước.
            </p>
          </CardContent>
        </Card>
      ) : (
        <MemberListSection
          farmId={farm.id}
          onAddMember={() => setShowAdd(true)}
          onViewMember={setViewingMember}
        />
      )}
    </div>
  );
}

export default OwnerFarmMemberPage;
