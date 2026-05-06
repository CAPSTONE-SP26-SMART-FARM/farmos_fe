import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { useFarmStore } from "@/stores/farmStore";
import { Building2, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import FarmDetailCard from "./components/FarmDetailCard";
import FarmFormDialog from "./components/FarmFormDialog";
import ZonesPane from "./components/ZonesPane";

function FarmLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-24 w-full"
          />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function EmptyFarmState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Chưa có nông trại nào</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Hãy tạo nông trại để bắt đầu quản lý khu vực, nhân sự và mùa vụ.
        </p>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo nông trại
        </Button>
      </CardContent>
    </Card>
  );
}

export default function OwnerFarmPage() {
  const { data, isLoading } = useOwnerGetMyFarm();
  const farm = data?.data;
  const setFarm = useFarmStore((s) => s.setFarm);

  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");

  useEffect(() => {
    if (farm) setFarm(farm);
  }, [farm, setFarm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge className="mb-2">Cổng chủ trang trại</Badge>
          <h1 className="text-2xl font-bold">Quản lý trang trại</h1>
          <p className="text-muted-foreground">
            Thông tin nông trại, khu vực và phân công quản lý.
          </p>
        </div>
        {farm && activeTab === "detail" && (
          <Button onClick={() => setUpdateOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Chỉnh sửa nông trại
          </Button>
        )}
      </div>

      {isLoading ? (
        <FarmLoadingSkeleton />
      ) : !farm ? (
        <EmptyFarmState onCreate={() => setCreateOpen(true)} />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="detail">Chi tiết nông trại</TabsTrigger>
            <TabsTrigger value="zones">Khu vực</TabsTrigger>
          </TabsList>
          <TabsContent
            value="detail"
            className="space-y-4 animate-in fade-in duration-300"
          >
            <FarmDetailCard farm={farm} />
          </TabsContent>
          <TabsContent
            value="zones"
            className="animate-in fade-in duration-300"
          >
            <ZonesPane farm={farm} />
          </TabsContent>
        </Tabs>
      )}

      <FarmFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      {farm && (
        <FarmFormDialog
          mode="update"
          farm={farm}
          open={updateOpen}
          onOpenChange={setUpdateOpen}
        />
      )}
    </div>
  );
}
