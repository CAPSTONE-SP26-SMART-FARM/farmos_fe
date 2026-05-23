# 02 - Techstack & Version Rules

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Phiên bản chính xác (package.json)

| Package | Version | Ghi chú |
|---------|---------|---------|
| react | 19.2.0 | Không dùng React Compiler — optimize thủ công |
| react-dom | 19.2.0 | |
| typescript | 5.9.3 | Strict mode |
| @tanstack/react-query | 5.90.20 | v5 API — dùng `gcTime` không phải `cacheTime` |
| zustand | 5.0.10 | v5 — không cần immer middleware mặc định |
| react-hook-form | 7.71.2 | |
| @hookform/resolvers | 5.2.2 | |
| zod | 4.3.6 | v4 — một số API thay đổi so với v3 |
| axios | 1.13.3 | |
| react-router / react-router-dom | 7.13.0 | v7 — dùng `useNavigate`, `useSearchParams` |
| tailwindcss | 4.1.18 | v4 — config qua CSS, không có `tailwind.config.js` |
| @tanstack/react-table | 8.21.3 | |
| recharts | 3.8.1 | |
| framer-motion | 12.29.2 | |
| sonner | 2.0.7 | Toast — import từ `@/components/ui/sonner` |
| lucide-react | 0.563.0 | Icons |
| date-fns | 4.1.0 | |
| socket.io-client | 4.8.3 | |
| next-themes | 0.4.6 | |

---

## Quyết định dùng hooks performance

> **React 19 KHÔNG ship React Compiler theo mặc định** → phải optimize thủ công.

### useMemo
Dùng khi:
- Tính toán expensive từ props/state (filter list, sort, aggregate)
- Tạo object/array phức tạp được truyền xuống child component
- Derived state từ server data

```tsx
// ✅ Đúng
const filteredItems = useMemo(
  () => items.filter(i => i.status === selectedStatus),
  [items, selectedStatus]
);

// ❌ Sai — primitive, không cần memo
const count = useMemo(() => items.length, [items]);
```

### useCallback
Dùng khi:
- Function được truyền xuống child component đã được `memo()`
- Function là dependency của `useEffect` / `useQuery`
- Event handler trong list item render nhiều lần

```tsx
// ✅ Đúng
const handleDelete = useCallback((id: string) => {
  deleteMutation.mutate(id);
}, [deleteMutation]);

// ❌ Sai — function không đi đâu cả
const handleClick = useCallback(() => setOpen(true), []);
```

### memo()
Dùng khi:
- Component render nhiều với props ít thay đổi
- Component trong danh sách (list item, table row)
- Component "leaf" nhận nhiều props từ parent thường xuyên re-render

```tsx
// ✅ Đúng
const DeviceCard = memo(({ device, onSelect }: DeviceCardProps) => {
  // ...
});

// ❌ Sai — component đã có local state, memo không giúp ích
const Counter = memo(() => {
  const [count, setCount] = useState(0);
  // ...
});
```

---

## Quy tắc import

```tsx
// Thứ tự import
import React, { useState, useMemo, useCallback } from "react"; // 1. React
import { useNavigate } from "react-router-dom";                 // 2. Third-party
import { useQuery } from "@tanstack/react-query";               // 3. Third-party
import { Button } from "@/components/ui/button";               // 4. @/components/ui
import { EmptyState } from "@/components/common/EmptyState";   // 5. @/components/common
import { useDevices } from "@/queries/useDevice";              // 6. @/queries
import { deviceService } from "@/services/deviceService";      // 7. @/services
import type { Device } from "@/types/device";                  // 8. @/types (type import)
```

---

## Zod v4 — thay đổi quan trọng

```tsx
// ✅ Zod v4
import { z } from "zod";
z.string().min(1, "Bắt buộc nhập");
z.coerce.number().min(0);
z.enum(["active", "inactive"]);

// Zod v4 không còn .nonempty() — dùng .min(1) thay thế
// Zod v4 thay đổi error message format — dùng zod-locale.ts của project
```

---

## React Query v5 — thay đổi quan trọng

```tsx
// ✅ v5
const { data, isLoading, isError } = useQuery({
  queryKey: [...],
  queryFn: () => service.getList(),
  gcTime: 1000 * 60 * 30,  // KHÔNG phải cacheTime
});

// Mutation error type
useMutation({
  mutationFn: ...,
  onError: (error: Error) => { ... },  // error type là Error không phải unknown
});
```

---

## Tailwind v4 — thay đổi quan trọng

- Không có `tailwind.config.js` — config qua CSS `@theme` trong `index.css`
- Dùng `cn()` từ `@/lib/utils` để merge class conditionally
- Arbitrary values: `w-[340px]`, `grid-cols-[1fr_2fr]`
- Container queries available với plugin

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />
```
