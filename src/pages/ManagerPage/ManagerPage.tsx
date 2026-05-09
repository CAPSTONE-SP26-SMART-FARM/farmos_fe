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
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useManagerListAssignedZones } from "@/queries/useZone";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import type { ZoneType } from "@/types/zone";
import { format } from "date-fns";
import { Sprout } from "lucide-react";
import ManagerDashboardSection from "./Dashboard/ManagerDashboardSection";

type ManagerView = {
  title: string;
  description: string;
  modules: string[];
};

const managerViews: Record<string, ManagerView> = {
  dashboard: {
    title: "Bảng điều khiển quản lý",
    description:
      "Tổng quan khu vực phụ trách, tiến độ mùa vụ và cảnh báo quan trọng.",
    modules: [
      "Khu vực được giao",
      "Mùa vụ đang hoạt động",
      "Tiến độ công việc",
      "Cảnh báo quan trọng",
    ],
  },
  zones: {
    title: "Khu vực được giao",
    description:
      "Danh sách khu vực được giao và trạng thái vận hành từng khu vực.",
    modules: [
      "Danh sách khu vực",
      "Mùa vụ hiện tại",
      "Trạng thái rủi ro",
      "Tóm tắt chủ trang trại",
    ],
  },
  seasons: {
    title: "Lập kế hoạch mùa vụ",
    description:
      "Lập kế hoạch mùa vụ theo timeline, loại cây và mục tiêu sản lượng.",
    modules: [
      "Dòng thời gian mùa vụ",
      "Kế hoạch cây trồng",
      "Mốc sản xuất",
      "Mục tiêu sản lượng",
    ],
  },
  "iot-config": {
    title: "Cấu hình IoT",
    description:
      "Chọn mẫu ngưỡng IoT hoặc tùy chỉnh ngưỡng theo khu vực/mùa vụ.",
    modules: [
      "Chọn mẫu",
      "Ngưỡng tùy chỉnh",
      "Luật cảnh báo",
      "Lịch sử cấu hình",
    ],
  },
  tasks: {
    title: "Phân công công việc",
    description: "Tạo công việc theo giai đoạn và giao cho nhân sự phụ trách.",
    modules: ["Mẫu công việc", "Phân công", "Hạn hoàn thành", "Mức ưu tiên"],
  },
  progress: {
    title: "Tiến độ công việc",
    description: "Theo dõi tiến độ thực thi công việc và kết quả thực tế.",
    modules: [
      "Tỷ lệ hoàn thành",
      "Công việc trễ hạn",
      "Ghi chú hiện trường",
      "Sức khỏe giai đoạn",
    ],
  },
  sensors: {
    title: "Giám sát cảm biến",
    description: "Giám sát dữ liệu cảm biến theo khu vực và ngưỡng cảnh báo.",
    modules: [
      "Chỉ số trực tiếp",
      "Bất thường",
      "Biểu đồ xu hướng",
      "Cập nhật gần nhất",
    ],
  },
  incidents: {
    title: "Điều phối sự cố",
    description:
      "Điều phối xử lý sự cố và phối hợp bác sĩ khi có báo cáo bệnh.",
    modules: ["Sự cố đang mở", "Trạng thái bác sĩ", "Ca ưu tiên", "Chuyển cấp"],
  },
  reports: {
    title: "Báo cáo chủ trang trại",
    description: "Tổng hợp báo cáo định kỳ gửi chủ trang trại.",
    modules: [
      "Báo cáo tuần",
      "Báo cáo tháng",
      "Tổng kết sản lượng",
      "Kế hoạch hành động",
    ],
  },
  notifications: {
    title: "Thông báo",
    description: "Thông báo thời gian thực về công việc, cảm biến và sự cố.",
    modules: ["Cảnh báo mới", "Chưa đọc", "Khẩn cấp", "Đã xử lý"],
  },
};

const getManagerSection = (pathname: string) => {
  const slug = pathname.replace("/dashboard/manager", "").replace(/^\/+/, "");
  return slug || "dashboard";
};

const ZONE_TYPE_LABELS: Record<"cultivation", string> = {
  cultivation: "Canh tác",
};

function formatDate(date: string) {
  try {
    return format(new Date(date), "dd/MM/yyyy");
  } catch {
    return date;
  }
}

function AssignedZonesSection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const zoneTypeParam = searchParams.get("zoneType") ?? "all";
  const zoneTypeValue = zoneTypeParam === "cultivation" ? "cultivation" : "all";

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const zoneTypeFilter =
    zoneTypeValue === "cultivation" ? "cultivation" : undefined;

  const zonesQuery = useManagerListAssignedZones({
    page,
    limit: 10,
    search: search || undefined,
    zoneType: zoneTypeFilter,
  });

  const zones = zonesQuery.data?.data.data ?? [];
  const meta = zonesQuery.data?.data.meta;
  const totalItems = meta?.totalItems ?? 0;
  const hasFilter = Boolean(search) || zoneTypeValue !== "all";
  const pageCultivationCount = zones.filter(
    (zone) => zone.zoneType === "cultivation",
  ).length;

  const handleApplySearch = () => {
    const next = new URLSearchParams(searchParams);
    const q = searchInput.trim();

    if (q) {
      next.set("search", q);
    } else {
      next.delete("search");
    }

    next.delete("page");
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  };

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-medium">Tìm kiếm khu vực</p>
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nhập tên khu vực"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplySearch();
                  }
                }}
              />
            </div>

            <div className="w-full md:w-52 space-y-1.5">
              <p className="text-sm font-medium">Loại khu vực</p>
              <Select
                value={zoneTypeValue}
                onValueChange={(value) => {
                  const next = new URLSearchParams(searchParams);
                  if (value === "all") {
                    next.delete("zoneType");
                  } else {
                    next.set("zoneType", value);
                  }
                  next.delete("page");
                  setSearchParams(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="cultivation">Canh tác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleApplySearch}
              >
                Tìm
              </Button>
              {hasFilter && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                >
                  Xoá lọc
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">
              Tổng khu vực được giao
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {zonesQuery.isLoading ? "--" : totalItems}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">
              Canh tác (trang hiện tại)
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {zonesQuery.isLoading ? "--" : pageCultivationCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">
              Khu vực đang hiển thị
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {zonesQuery.isLoading ? "--" : zones.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Danh sách khu vực được giao
          </CardTitle>
          <CardDescription>
            {zonesQuery.isLoading ? "Đang tải..." : `${totalItems} khu vực`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {zonesQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Không thể tải danh sách khu vực. Vui lòng thử lại.
              </p>
            </div>
          ) : !zonesQuery.isLoading && zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Sprout className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {hasFilter
                  ? "Không có kết quả phù hợp"
                  : "Chưa có khu vực được giao"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {hasFilter
                  ? "Thử đổi từ khoá tìm kiếm hoặc xoá bộ lọc để xem toàn bộ khu vực."
                  : "Chủ trang trại cần giao khu vực cho bạn để bắt đầu quản lý mùa vụ."}
              </p>
            </div>
          ) : (
            <>
              <DataTable
                columns={
                  [
                    {
                      accessorKey: "name",
                      header: "Tên khu vực",
                      cell: ({ row }) => (
                        <span className="font-medium">{row.original.name}</span>
                      ),
                    },
                    {
                      accessorKey: "zoneType",
                      header: "Loại",
                      cell: ({ row }) => (
                        <Badge variant="secondary">
                          {ZONE_TYPE_LABELS[row.original.zoneType]}
                        </Badge>
                      ),
                    },
                    {
                      accessorKey: "areaSqm",
                      header: "Diện tích",
                      cell: ({ row }) =>
                        row.original.areaSqm != null
                          ? `${row.original.areaSqm} m²`
                          : "—",
                    },
                    {
                      accessorKey: "updatedAt",
                      header: "Cập nhật",
                      cell: ({ row }) => (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(row.original.updatedAt)}
                        </span>
                      ),
                    },
                  ] as ColumnDef<ZoneType>[]
                }
                data={zones}
                isLoading={zonesQuery.isLoading}
                actions={[
                  {
                    key: "crop-seasons",
                    label: "Mùa vụ",
                    icon: Sprout,
                    onSelect: (zone) =>
                      navigate({
                        pathname: "/dashboard/manager/crop-seasons",
                        search: `zoneId=${zone.id}`,
                      }),
                  },
                ]}
                emptyText="Chưa có khu vực được giao."
              />

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {meta.page} / {meta.totalPages} • {meta.totalItems}{" "}
                    khu vực
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasPreviousPage}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        const prevPage = Math.max(1, page - 1);
                        if (prevPage <= 1) {
                          next.delete("page");
                        } else {
                          next.set("page", String(prevPage));
                        }
                        setSearchParams(next);
                      }}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasNextPage}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set("page", String(page + 1));
                        setSearchParams(next);
                      }}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ManagerPage() {
  const { pathname } = useLocation();
  const section = getManagerSection(pathname);
  const view = managerViews[section] ?? managerViews.dashboard;
  const isZonesSection = section === "zones";
  const isDashboardSection = section === "dashboard";
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, [section]);

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng quản lý</Badge>
          <h1 className="text-2xl font-bold">{view.title}</h1>
          <p className="text-muted-foreground">{view.description}</p>
        </div>
        {!isZonesSection && !isDashboardSection && (
          <div className="flex gap-2">
            <Button variant="outline">Lọc</Button>
            <Button>Tạo mới</Button>
          </div>
        )}
      </div>

      {isDashboardSection ? (
        <ManagerDashboardSection />
      ) : isZonesSection ? (
        <AssignedZonesSection />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {view.modules.map((item) => (
              <Card
                key={item}
                className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <CardDescription>{item}</CardDescription>
                  <CardTitle className="text-2xl">--</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Khối giao diện mẫu cho quản lý.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Khu vực làm việc</CardTitle>
              <CardDescription>
                Màn hình `{section}` đã dựng cấu trúc, chờ tích hợp API và biểu
                đồ chi tiết.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sẽ thêm bảng, biểu mẫu và quy trình theo từng module của quản lý ở
              bước tiếp.
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default ManagerPage;
