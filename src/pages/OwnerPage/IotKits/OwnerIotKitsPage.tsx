import EmptyState from "@/components/common/EmptyState";
import IotKitCard from "@/components/common/IotKitCard";
import LoadingCard from "@/components/common/LoadingCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import useDebounce from "@/hooks/useDebounce";
import { useOwnerIotKits } from "@/queries/useIotKit";
import type { ListIotKitsQueryType } from "@/schemaValidatation/iotKit";
import { PackageOpen, Search, Stethoscope, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import ServicePackagesPurchaseSection from "@/pages/OwnerPage/Subscriptions/components/ServicePackagesPurchaseSection";

const VALID_TABS = ["kits", "vouchers"] as const;
type TabKey = (typeof VALID_TABS)[number];

export default function OwnerIotKitsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: TabKey = (VALID_TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as TabKey)
    : "kits";

  const handleTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "price" | "name">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebounce(search, 500);

  const query: ListIotKitsQueryType = useMemo(
    () => ({
      page,
      limit: 12,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    }),
    [page, debouncedSearch, sortBy, sortOrder],
  );

  const listQuery = useOwnerIotKits(query);
  const kits = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge className="mb-2">Chủ trang trại</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Mua thêm dịch vụ
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Mở rộng hạn mức thiết bị IoT hoặc nạp thêm lượt tư vấn bác sĩ
              cho nông trại của bạn.
            </p>
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="kits" className="gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            Mua bộ Kit IoT
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="gap-1.5">
            <Stethoscope className="h-4 w-4" />
            Mua vé tư vấn bác sĩ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kits" className="mt-0">

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <CardTitle>Danh mục bộ Kit</CardTitle>
          <CardDescription>
            Chọn bộ kit phù hợp với nhu cầu mở rộng diện tích của bạn.
          </CardDescription>
          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo tên bộ Kit"
                className="pl-9"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as typeof sortBy);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Mới nhất</SelectItem>
                <SelectItem value="price">Giá</SelectItem>
                <SelectItem value="name">Tên</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOrder}
              onValueChange={(value) => {
                setSortOrder(value as typeof sortOrder);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Giảm dần</SelectItem>
                <SelectItem value="asc">Tăng dần</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {listQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : kits.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="Chưa có bộ Kit nào"
              description="Hiện chưa có bộ Kit IoT nào được bán. Vui lòng quay lại sau."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {kits.map((kit) => (
                <IotKitCard
                  key={kit.id}
                  kit={kit}
                  onSelect={() =>
                    navigate(`/dashboard/owner/iot-kits/${kit.id}`)
                  }
                  onPurchase={() =>
                    navigate(`/dashboard/owner/iot-kits/${kit.id}`)
                  }
                />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>
                Trang {meta.page} / {meta.totalPages} ({meta.totalItems} mục)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="vouchers" className="mt-0">
          <ServicePackagesPurchaseSection
            title="Mua vé tư vấn bác sĩ"
            description="Chọn gói lượt tư vấn bác sĩ phù hợp. Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
