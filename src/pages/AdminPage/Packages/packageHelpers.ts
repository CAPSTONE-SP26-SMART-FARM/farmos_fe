export type PackageStatus = "Active" | "Draft";

export type SubscriptionPackage = {
  id: string;
  name: string;
  durationMonths: number;
  iotKits: number;
  doctorTickets: number;
  priceVnd: number;
  description: string;
  status: PackageStatus;
  updatedAt: string;
};

export const createPackage = (
  seed?: Partial<SubscriptionPackage>,
): SubscriptionPackage => ({
  id: seed?.id ?? crypto.randomUUID(),
  name: seed?.name ?? "",
  durationMonths: seed?.durationMonths ?? 12,
  iotKits: seed?.iotKits ?? 10,
  doctorTickets: seed?.doctorTickets ?? 20,
  priceVnd: seed?.priceVnd ?? 10_000_000,
  description: seed?.description ?? "",
  status: seed?.status ?? "Active",
  updatedAt: seed?.updatedAt ?? new Date().toISOString(),
});

export const initialPackages: SubscriptionPackage[] = [
  createPackage({
    name: "Khởi động",
    durationMonths: 12,
    iotKits: 10,
    doctorTickets: 20,
    priceVnd: 9_900_000,
    description:
      "Gói khởi động cho quy mô nhỏ với 1 nông trại và tối đa 10 bộ IoT.",
    status: "Active",
  }),
  createPackage({
    name: "Tăng trưởng",
    durationMonths: 12,
    iotKits: 25,
    doctorTickets: 50,
    priceVnd: 19_900_000,
    description: "Gói tăng trưởng cho 2-3 nông trại, kèm nhiều vé tư vấn.",
    status: "Active",
  }),
  createPackage({
    name: "Mở rộng",
    durationMonths: 12,
    iotKits: 50,
    doctorTickets: 120,
    priceVnd: 39_900_000,
    description: "Gói quy mô lớn, phù hợp chủ đầu tư có nhiều khu trang trại.",
    status: "Draft",
  }),
];

export const PACKAGE_STATUS_LABEL: Record<PackageStatus, string> = {
  Active: "Đang hoạt động",
  Draft: "Bản nháp",
};

export const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
