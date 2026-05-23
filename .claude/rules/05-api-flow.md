# 03 - API Implementation Flow

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Flow chuẩn implement một API mới

```
Endpoint Constant → Zod Schema → Service → Query Hook → Page / Component
```

Thực hiện **theo đúng thứ tự** này, từng bước một.

---

## Bước 1: Endpoint Constant (`src/constants/endpoints.ts`)

Thêm endpoint mới vào đúng nhóm entity, theo pattern hiện có:

```ts
// src/constants/endpoints.ts

export const API_ENDPOINTS = {
  // ... existing endpoints
  IOT_DEVICE: {
    LIST: "/iot-devices",
    DETAIL: (id: string) => `/iot-devices/${id}`,
    CREATE: "/iot-devices",
    UPDATE: (id: string) => `/iot-devices/${id}`,
    DELETE: (id: string) => `/iot-devices/${id}`,
    // Role-specific
    OWNER: {
      LIST: "/owner/iot-devices",
      ASSIGN: (id: string) => `/owner/iot-devices/${id}/assign`,
    },
  },
};

// Thêm QUERY_KEYS cùng file
export const QUERY_KEYS = {
  // ... existing keys
  iotDevices: {
    list: (query?: object) => ["iot-devices", "list", { query }],
    detail: (id: string) => ["iot-devices", "detail", id],
    ownerList: (query?: object) => ["iot-devices", "owner", "list", { query }],
  },
};
```

**Rules:**
- Endpoint string là plain string hoặc function trả về string — không có logic khác
- QUERY_KEYS trả về array, luôn đặt params vào cuối để partial invalidation hoạt động
- Group theo entity, có sub-group theo role nếu cần (`OWNER`, `MANAGER`, `ADMIN`)

---

## Bước 2: Zod Schema (`src/schemaValidatation/[entity].ts`)

Chỉ tạo schema cho **form input** (body gửi lên) — không schema cho response.

```ts
// src/schemaValidatation/iotDevice.ts
import { z } from "zod";

export const createIotDeviceSchema = z.object({
  name: z.string().min(1, "Tên thiết bị không được để trống"),
  deviceType: z.enum(["sensor", "actuator", "camera"], {
    required_error: "Vui lòng chọn loại thiết bị",
  }),
  zoneId: z.string().min(1, "Vui lòng chọn vùng trồng"),
  serialNumber: z.string().min(1, "Serial number không được để trống"),
  purchaseDate: z.date({ required_error: "Vui lòng chọn ngày" }),
});

export const updateIotDeviceSchema = createIotDeviceSchema.partial().extend({
  id: z.string(),
});

// Export infer types để dùng trong component
export type CreateIotDeviceBodyType = z.infer<typeof createIotDeviceSchema>;
export type UpdateIotDeviceBodyType = z.infer<typeof updateIotDeviceSchema>;
```

**Rules:**
- Tên schema: `[action][Entity]Schema` — camelCase
- Tên type: `[Action][Entity]BodyType` — PascalCase với suffix `BodyType`
- Error message bằng tiếng Việt
- Dùng `.partial()` cho update schema khi các field đều optional
- Không dùng `.nonempty()` (Zod v4 removed) → dùng `.min(1)`

---

## Bước 3: Service (`src/services/[entity]Service.ts`)

```ts
// src/services/iotDeviceService.ts
import queryString from "query-string";
import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import type { CreateIotDeviceBodyType, UpdateIotDeviceBodyType } from "@/schemaValidatation/iotDevice";
import type { IotDevice, IotDeviceListResponse } from "@/types/iotDevice";

const QS_OPTIONS: queryString.StringifyOptions = {
  skipEmptyString: true,
  skipNull: true,
};

export const iotDeviceService = {
  // Admin/Manager
  list: (query?: object) =>
    api.get<IotDeviceListResponse>(
      `${API_ENDPOINTS.IOT_DEVICE.LIST}?${queryString.stringify(query ?? {}, QS_OPTIONS)}`
    ),

  detail: (id: string) =>
    api.get<IotDevice>(API_ENDPOINTS.IOT_DEVICE.DETAIL(id)),

  create: (body: CreateIotDeviceBodyType) =>
    api.post<IotDevice>(API_ENDPOINTS.IOT_DEVICE.CREATE, {
      ...body,
      purchaseDate: body.purchaseDate.toISOString(), // transform date nếu cần
    }),

  update: (id: string, body: UpdateIotDeviceBodyType) =>
    api.put<IotDevice>(API_ENDPOINTS.IOT_DEVICE.UPDATE(id), body),

  delete: (id: string) =>
    api.delete<void>(API_ENDPOINTS.IOT_DEVICE.DELETE(id)),

  // Owner-specific
  ownerList: (query?: object) =>
    api.get<IotDeviceListResponse>(
      `${API_ENDPOINTS.IOT_DEVICE.OWNER.LIST}?${queryString.stringify(query ?? {}, QS_OPTIONS)}`
    ),
};
```

**Rules:**
- Service chỉ gọi `api.*` — không có logic UI, không import hooks
- Transform data (date → ISO, số → string) ở đây, không ở component
- Query string luôn dùng `queryString.stringify` với `skipEmptyString + skipNull`
- Type-safe với generics `api.get<T>()`, `api.post<T, D>()`

---

## Bước 4: Query Hook (`src/queries/use[Entity].ts`)

```ts
// src/queries/useIotDevice.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { iotDeviceService } from "@/services/iotDeviceService";
import { onMutationError } from "@/lib/axios";
import { QUERY_KEYS } from "@/constants/endpoints";
import type { CreateIotDeviceBodyType } from "@/schemaValidatation/iotDevice";

// LIST
export const useIotDeviceList = (query?: object) =>
  useQuery({
    queryKey: QUERY_KEYS.iotDevices.list(query),
    queryFn: () => iotDeviceService.list(query),
  });

// DETAIL
export const useIotDeviceDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.iotDevices.detail(id),
    queryFn: () => iotDeviceService.detail(id),
    enabled: !!id,
  });

// CREATE
export const useCreateIotDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateIotDeviceBodyType) => iotDeviceService.create(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["iot-devices"] });
      toast.success("Tạo thiết bị IoT thành công!");
    },
    onError: (error) => onMutationError(error, "Tạo thiết bị IoT thất bại"),
  });
};

// UPDATE
export const useUpdateIotDevice = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateIotDeviceBodyType) => iotDeviceService.update(id, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: QUERY_KEYS.iotDevices.detail(id) });
      await qc.invalidateQueries({ queryKey: ["iot-devices", "list"] });
      toast.success("Cập nhật thiết bị thành công!");
    },
    onError: (error) => onMutationError(error, "Cập nhật thiết bị thất bại"),
  });
};

// DELETE
export const useDeleteIotDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => iotDeviceService.delete(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["iot-devices"] });
      toast.success("Xóa thiết bị thành công!");
    },
    onError: (error) => onMutationError(error, "Xóa thiết bị thất bại"),
  });
};

// OWNER-specific
export const useOwnerIotDeviceList = (query?: object) =>
  useQuery({
    queryKey: QUERY_KEYS.iotDevices.ownerList(query),
    queryFn: () => iotDeviceService.ownerList(query),
  });
```

**Rules:**
- Mỗi hook chỉ làm 1 việc (list / detail / create / update / delete)
- `enabled: !!id` khi query phụ thuộc vào dynamic param
- Toast message bằng tiếng Việt
- Dùng `onMutationError` từ `@/lib/axios` cho error handling
- Invalidate đúng query keys sau mutation — dùng prefix array để invalidate nhóm
- Không để logic UI trong hook

---

## Bước 5: Page / Component

```tsx
// src/pages/OwnerPage/IotDevices/OwnerIotDevicesPage.tsx
import { useCallback, useMemo, useState } from "react";
import { useOwnerIotDeviceList } from "@/queries/useIotDevice";
import { useDeleteIotDevice } from "@/queries/useIotDevice";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { IotDeviceTable } from "./_components/IotDeviceTable";
import { CreateIotDeviceDialog } from "./_components/CreateIotDeviceDialog";

export default function OwnerIotDevicesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useOwnerIotDeviceList({ search });
  const { mutate: deleteDevice } = useDeleteIotDevice();

  const devices = useMemo(() => data?.data ?? [], [data]);

  const handleDelete = useCallback((id: string) => {
    deleteDevice(id);
  }, [deleteDevice]);

  if (isLoading) return <TableSkeleton />;
  if (isError) return <ErrorState />;
  if (devices.length === 0) return <EmptyState message="Chưa có thiết bị IoT nào" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Thiết bị IoT</h1>
        <Button onClick={() => setOpen(true)}>Thêm thiết bị</Button>
      </div>
      <IotDeviceTable devices={devices} onDelete={handleDelete} />
      <CreateIotDeviceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
```

**Rules tại Page:**
- Page chỉ orchestrate: kết nối query hook ↔ sub-components
- Xử lý 3 trạng thái bắt buộc: `isLoading` → `TableSkeleton/LoadingCard`, `isError` → `ErrorState`, empty → `EmptyState`
- State local chỉ cho UI (dialog open/close, tab selection, search input)
- Logic tính toán dùng `useMemo`, callback dùng `useCallback`
- Không gọi `service.*` trực tiếp trong component

---

## Tóm tắt luồng invalidation

```
Mutation thành công
  → invalidate đúng queryKey
  → React Query tự refetch
  → UI cập nhật tự động
```

Không cần setState thủ công để cập nhật list sau CRUD.

---

## Pattern mở rộng — Parallel Queries

Khi page cần load nhiều entity cùng lúc (không phụ thuộc nhau):

```tsx
// ✅ Đúng — gọi song song, không waterfall
function OwnerDashboardPage() {
  const devicesQuery = useOwnerIotDeviceList();
  const zonesQuery = useOwnerZoneList();
  const cropSeasonsQuery = useOwnerCropSeasonList();

  // Tổng hợp loading state
  const isLoading = devicesQuery.isLoading || zonesQuery.isLoading || cropSeasonsQuery.isLoading;
  const isError = devicesQuery.isError || zonesQuery.isError || cropSeasonsQuery.isError;

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState />;

  return (
    <div>
      <KpiCards devices={devicesQuery.data?.data} zones={zonesQuery.data?.data} />
      <CropSeasonTable seasons={cropSeasonsQuery.data?.data} />
    </div>
  );
}
```

---

## Pattern mở rộng — Dependent Queries (Waterfall có chủ ý)

Khi query B cần kết quả từ query A:

```tsx
// Query A: lấy farm của owner
const farmQuery = useOwnerFarm();
const farmId = farmQuery.data?.data?.id;

// Query B: chỉ chạy khi có farmId
const zonesQuery = useQuery({
  queryKey: QUERY_KEYS.zones.byFarm(farmId!),
  queryFn: () => zoneService.listByFarm(farmId!),
  enabled: !!farmId,   // ← chờ farmId có giá trị
});
```

---

## Pattern mở rộng — Optimistic Update (Delete)

Dùng khi muốn UI phản hồi ngay không cần chờ API:

```tsx
export const useDeleteIotDevice = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => iotDeviceService.delete(id),

    // Chạy TRƯỚC khi gọi API
    onMutate: async (deletedId) => {
      // Cancel inflight queries tránh overwrite optimistic update
      await qc.cancelQueries({ queryKey: ["iot-devices"] });

      // Snapshot data hiện tại để rollback nếu lỗi
      const previous = qc.getQueryData(["iot-devices", "list"]);

      // Update cache ngay lập tức
      qc.setQueryData(["iot-devices", "list"], (old: any) => ({
        ...old,
        data: old?.data?.filter((d: Device) => d.id !== deletedId),
      }));

      return { previous };
    },

    // Rollback nếu API lỗi
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(["iot-devices", "list"], context.previous);
      }
      toast.error("Xóa thiết bị thất bại");
    },

    // Luôn sync lại sau cùng dù thành công hay thất bại
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["iot-devices"] });
    },

    onSuccess: () => {
      toast.success("Xóa thiết bị thành công!");
    },
  });
};
```

**Khi nào dùng optimistic update:**
- Action Delete trên list (row biến mất ngay)
- Toggle status (on/off switch)
- Action thường xuyên, ít khi lỗi

**Khi nào KHÔNG dùng:**
- Create (cần ID từ server)
- Action phức tạp có side effect
- Action hiếm dùng (không đáng implement)
