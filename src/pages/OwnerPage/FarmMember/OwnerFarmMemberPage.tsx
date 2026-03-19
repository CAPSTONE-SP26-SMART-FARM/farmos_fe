import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import type { FarmMemberResType } from "@/schemaValidatation/farmMember";
import { UserPlus, Users, UserCog, Tractor } from "lucide-react";
import { useState } from "react";
import AddMemberPanel from "./components/AddMemberPanel";
import MemberDetailPanel from "./components/MemberDetailPanel";
import MemberListSection from "./components/MemberListSection";

const MEMBER_SUMMARY_CARDS = [
  { title: "Total Employees", value: "--", icon: Users },
  { title: "Managers", value: "--", icon: UserCog },
  { title: "Farmers", value: "--", icon: Tractor },
  { title: "New This Month", value: "--", icon: UserPlus },
] as const;

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
          <Badge className="mb-2">Owner Portal</Badge>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage employees assigned to your farm.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MEMBER_SUMMARY_CARDS.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <card.icon className="h-3.5 w-3.5" />
                {card.title}
              </CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                UI placeholder for employee metrics.
              </p>
            </CardContent>
          </Card>
        ))}
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
              Failed to load farm data. Please create a farm first.
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
