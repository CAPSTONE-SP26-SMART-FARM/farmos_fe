# 11 - TypeScript Pattern

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Config TypeScript

- Strict mode bật — `"strict": true` trong `tsconfig.app.json`
- Không dùng `any` — dùng `unknown` nếu chưa biết type, sau đó narrow down
- Không dùng type assertion `as X` trừ khi không còn cách nào khác

---

## API Response Types

Tất cả response từ API phải có type trong `src/types/`:

```ts
// src/types/api.ts — wrapper type chuẩn
export interface ApiResponseType<T = unknown> {
  data: T;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}
```

```ts
// src/types/iotDevice.ts
export interface IotDevice {
  id: string;
  name: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  zoneId: string;
  farmId: string;
  serialNumber: string;
  purchaseDate: string;  // ISO string từ API
  createdAt: string;
  updatedAt: string;
}

export type DeviceType = "sensor" | "actuator" | "camera";
export type DeviceStatus = "available" | "purchase" | "maintenance";

// Paginated list
export type IotDeviceListResponse = PaginatedResponse<IotDevice>;
```

**Rules:**
- Dates từ API luôn là `string` (ISO) — chỉ convert sang `Date` khi cần tính toán
- Status enum dùng `type` với union string, không dùng `enum` TypeScript (compile ra số)
- ID luôn là `string` — không dùng `number` dù backend trả về number

---

## Discriminated Union — Props theo variant

Khi component có behavior khác nhau dựa trên mode:

```tsx
// ✅ Đúng — discriminated union, TypeScript hiểu rõ props nào available
type DeviceDialogProps =
  | { mode: "create"; onSuccess: () => void }
  | { mode: "edit"; deviceId: string; onSuccess: () => void };

function DeviceDialog(props: DeviceDialogProps) {
  if (props.mode === "edit") {
    // TypeScript biết props.deviceId tồn tại ở đây
    const { data } = useDeviceDetail(props.deviceId);
  }
}

// ❌ Sai — optional props gây confusion
interface DeviceDialogProps {
  mode: "create" | "edit";
  deviceId?: string;  // Không biết khi nào cần
}
```

---

## Generic Components

Dùng generics cho components tái sử dụng với nhiều data type:

```tsx
// DataTable generic — dùng được với mọi entity
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  emptyMessage = "Không có dữ liệu",
}: DataTableProps<T>) {
  // ...
}

// Dùng
<DataTable<IotDevice> data={devices} columns={deviceColumns} />
```

---

## Utility Types thường dùng

```ts
// Partial — update form (không bắt buộc tất cả field)
type UpdateDeviceBody = Partial<CreateDeviceBodyType> & { id: string };

// Pick — chỉ lấy 1 số field từ type lớn
type DeviceCardProps = Pick<IotDevice, "id" | "name" | "status" | "deviceType">;

// Omit — loại bỏ field không cần
type DeviceFormValues = Omit<IotDevice, "id" | "createdAt" | "updatedAt" | "farmId">;

// Record — map object với key/value type rõ ràng
const STATUS_LABEL: Record<DeviceStatus, string> = {
  available: "Có thể dùng",
  purchase: "Đã cho thuê",
  maintenance: "Bảo trì",
};
```

---

## Type Guard

Dùng để narrow type từ `unknown` hoặc union type:

```ts
// Type guard function
function isApiError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}

// Dùng trong error handler
if (isApiError(error)) {
  const status = error.response?.status;  // TypeScript biết đây là number
}
```

---

## Type cho Props phổ biến

```tsx
// Children
interface WithChildren {
  children: React.ReactNode;
}

// className override (pattern shadcn)
interface WithClassName {
  className?: string;
}

// Callback chuẩn
type OnSelect<T> = (item: T) => void;
type OnChange<T> = (value: T) => void;

// Ví dụ
interface SelectProps<T> extends WithClassName {
  options: T[];
  value: T | null;
  onChange: OnChange<T>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
}
```

---

## Không làm

```ts
// ❌ any
const data: any = await fetchData();

// ❌ as — force cast
const device = response as IotDevice;

// ❌ @ts-ignore
// @ts-ignore
someWeirdCall();

// ❌ enum TypeScript (compile ra number, khó debug)
enum Status { Active, Inactive }

// ✅ Thay bằng union type
type Status = "active" | "inactive";
const STATUS = { Active: "active", Inactive: "inactive" } as const;
```

---

## Rules tóm tắt

| Rule | |
|------|-|
| Không `any` | Dùng `unknown` rồi narrow |
| Date từ API | `string`, convert khi cần |
| Status/enum | Union string type, không TypeScript enum |
| Props nhiều mode | Discriminated union |
| Component tái dùng | Generic với constraint |
| Không `as` cast | Dùng type guard thay thế |
| Record cho label map | `Record<StatusType, string>` |
