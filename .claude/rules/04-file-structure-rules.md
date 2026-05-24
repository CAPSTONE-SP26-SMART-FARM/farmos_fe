# 03 - File Structure Rules

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Giới hạn dòng

- **Page component (`[Feature]Page.tsx`): tối đa 350 dòng** — nếu vượt, tách ngay thành `_components/`
- **Các file còn lại: tối đa 500 dòng** — nếu vượt, tách thành file con
- Mỗi file chỉ có **một trách nhiệm duy nhất**
- Không được import circular (A import B import A)

---

## Quy tắc Icon

- **Chỉ được dùng `lucide-react`** — thư viện icon duy nhất trong project
- Không tự thêm icon từ thư viện khác (`react-icons`, `heroicons`, v.v.)
- Không dùng emoji, Unicode ký tự đặc biệt, hay SVG inline thay thế icon
- Không import SVG file thủ công làm icon

```tsx
// ✅ Đúng
import { Trash2, PencilLine, Plus, ChevronDown } from "lucide-react";

// ❌ Sai
import { FaTrash } from "react-icons/fa";
<svg xmlns="..." viewBox="...">...</svg>
```

---

## `src/components/ui/` — shadcn/ui primitives

**Được phép:** Đọc và dùng trong component khác

**Không được phép:**
- Sửa trực tiếp bất kỳ file nào trong thư mục này
- Extend/wrap với logic business ở đây

Mọi customization phải tạo wrapper trong `src/components/common/`.

---

## `src/components/common/` — Shared UI components

**Được phép:**
- Component dùng chung toàn app
- Import từ `@/components/ui/`, `@/lib/utils`, `@/types/`
- Props-driven, không có query hook / service call bên trong

**Không được phép:**
- Gọi API trực tiếp trong đây
- Import từ `@/queries/`, `@/services/`, `@/stores/`
- Chứa business logic

**Khi nào tạo component ở đây:**
- Component dùng ở 2+ page khác nhau
- Component là pattern UI chung (skeleton, empty state, badge, pagination)

---

## `src/pages/[Role]Page/[Feature]/` — Page components

**Cấu trúc bắt buộc:**
```
[Feature]/
├── [Feature]Page.tsx          # Page chính — max 350 dòng
└── _components/               # Sub-components chỉ dùng trong feature này
    ├── [Feature]Table.tsx
    ├── [entity]-columns.tsx   # Column definitions tách riêng
    ├── [Entity]RowActions.tsx # Row actions tách riêng
    ├── Create[Feature]Dialog.tsx
    ├── Edit[Feature]Dialog.tsx
    ├── Delete[Feature]Alert.tsx
    └── [Feature]Form.tsx      # Form dùng chung cho cả Create và Edit
```

**`[Feature]Page.tsx` — được phép:**
- Import và sử dụng query hooks
- Quản lý UI state local (dialog open, tab, search)
- Compose sub-components
- Xử lý routing (`useNavigate`, `useSearchParams`)
- Breadcrumb setup

**`[Feature]Page.tsx` — không được phép:**
- Gọi `service.*` trực tiếp
- Chứa JSX quá 150 dòng inline (tách thành `_components/`)
- Import component từ page khác (dùng `common/` thay thế)

**`_components/` — được phép:**
- Nhận data qua props từ page
- Gọi mutation hooks (`useMutation`) trực tiếp nếu cần
- Import từ `@/components/ui/`, `@/components/common/`
- Có form state local với react-hook-form

**`_components/` — không được phép:**
- Gọi `useQuery` trực tiếp (data fetching ở page)
- Import từ page cùng cấp (chỉ nhận qua props)

---

## `src/queries/use[Entity].ts` — React Query hooks

**Được phép:**
- `useQuery` cho fetching
- `useMutation` cho mutations
- `useQueryClient` cho invalidation
- Import service, types, constants

**Không được phép:**
- JSX bất kỳ dạng nào
- Import React Router hooks — navigate ở component
- Import Zustand stores trực tiếp (ngoại lệ: `useAuthStore`)
- Side effects ngoài `onSuccess`/`onError`

---

## `src/services/[entity]Service.ts` — API service layer

**Được phép:**
- Gọi `api.get/post/put/patch/delete` từ `@/lib/axios`
- Transform data (date format, type coercion)
- Build query string với `queryString.stringify`

**Không được phép:**
- Import React hooks bất kỳ loại nào
- Import từ `@/queries/`, `@/stores/`, `@/pages/`
- Chứa UI logic, toast, navigate
- Try-catch wrapper (để ở query hook hoặc axios interceptor)

---

## `src/schemaValidatation/[entity].ts` — Zod schemas

**Được phép:**
- Define schema với Zod
- Export `z.infer<typeof schema>` types
- Compose schemas với `.extend()`, `.partial()`, `.merge()`

**Không được phép:**
- Import React hooks
- Import service/query hooks
- Chứa logic validation runtime ngoài Zod

---

## `src/stores/[entity]Store.ts` — Zustand stores

**Được phép:**
- Define global client-side state
- Actions để update state

**Không được phép:**
- Gọi API trực tiếp trong store
- Import query hooks, React components
- Store server state (dùng React Query thay thế)

**Nguyên tắc:**
- Zustand = client state (auth tokens, selected farm, UI preferences)
- React Query = server state (danh sách devices, crop seasons, v.v.)

---

## `src/constants/endpoints.ts` — Endpoints & Query Keys

**Được phép:**
- String literals cho endpoints
- Functions trả về string (dynamic endpoints)
- Array literals cho query keys

**Không được phép:**
- Logic business, conditional, loop
- Import từ service/query/component
