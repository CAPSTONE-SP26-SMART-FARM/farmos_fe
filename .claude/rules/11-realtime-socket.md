# 10 - Realtime & Socket Pattern

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Stack realtime

- **socket.io-client 4.8.3** — kết nối với backend Socket.IO
- Socket instance: `@/lib/socket.ts`
- Socket store: `@/stores/socketStore.ts`
- Custom hooks: `@/hooks/useSocket.ts`, `@/hooks/useTicketSubscription.ts`

---

## Khi nào dùng Socket

| Dùng Socket | Không cần Socket |
|-------------|-----------------|
| Notification realtime (mới xuất hiện không cần refresh) | Danh sách data thông thường |
| Trạng thái IoT device thay đổi liên tục | Form submit response |
| Chat / ticket comment cập nhật ngay | Pagination, filter |
| Progress của long-running task | CRUD thông thường |

---

## Pattern cơ bản — Subscribe và invalidate query

Cách đúng khi nhận socket event: **không tự update state**, thay vào đó **invalidate React Query** để refetch.

```tsx
// hooks/useDeviceStatusSocket.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import { QUERY_KEYS } from "@/constants/endpoints";

export function useDeviceStatusSocket(farmId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!farmId) return;

    // Subscribe event
    socket.on(`device:status:${farmId}`, (payload: { deviceId: string }) => {
      // Invalidate đúng query — không setState thủ công
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.iotDevices.detail(payload.deviceId),
      });
      qc.invalidateQueries({
        queryKey: ["iot-devices", "list"],
      });
    });

    return () => {
      // Cleanup — luôn phải off khi unmount
      socket.off(`device:status:${farmId}`);
    };
  }, [farmId, qc]);
}
```

---

## Tránh race condition — Socket vs Query

Khi socket event và query refetch xảy ra gần nhau, có thể nhận data cũ:

```tsx
// ✅ Dùng invalidateQueries + refetchQueries cùng nhau nếu cần ngay lập tức
socket.on("device:updated", async (payload) => {
  await qc.invalidateQueries({ queryKey: QUERY_KEYS.iotDevices.detail(payload.id) });
  // invalidate sẽ trigger refetch tự động nếu query đang được observe
});

// ❌ Sai — update cache thủ công, dễ out-of-sync
socket.on("device:updated", (payload) => {
  qc.setQueryData(QUERY_KEYS.iotDevices.detail(payload.id), payload);
});
```

---

## Notification Socket Pattern

```tsx
// hooks/useNotificationSocket.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import { useNotificationStore } from "@/stores/notificationStore";

export function useNotificationSocket(userId: string) {
  const qc = useQueryClient();
  const { incrementUnread } = useNotificationStore();

  useEffect(() => {
    if (!userId) return;

    socket.on(`notification:${userId}`, () => {
      // 1. Tăng badge count ngay lập tức (optimistic UI)
      incrementUnread();
      // 2. Invalidate query để load notification mới
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => socket.off(`notification:${userId}`);
  }, [userId, qc, incrementUnread]);
}
```

---

## Dùng socket hook trong layout (không trong page)

Socket connection cho notification và global events phải mount ở **DashboardLayout** — không mount ở từng page riêng (tránh reconnect mỗi khi navigate).

```tsx
// components/layout/DashboardLayout/DashboardLayout.tsx
export function DashboardLayout() {
  const { user } = useAuthStore();

  // Mount 1 lần ở layout level
  useNotificationSocket(user?.id ?? "");
  useDeviceStatusSocket(user?.farmId ?? "");

  return (
    <div>
      <Sidebar />
      <main><Outlet /></main>
    </div>
  );
}
```

Page-level socket chỉ dùng khi event chỉ relevant với page đó:

```tsx
// pages/OwnerPage/Tickets/OwnerTicketsPage.tsx
export function OwnerTicketsPage() {
  // Chỉ subscribe khi đang ở trang tickets
  useTicketSubscription();
  // ...
}
```

---

## Socket connection state

```tsx
// Kiểm tra socket có connected không trước khi dùng
import { useSocketStore } from "@/stores/socketStore";

function SomeComponent() {
  const { isConnected } = useSocketStore();

  return (
    <div>
      {!isConnected && (
        <StatusBanner status="warning" message="Mất kết nối realtime. Dữ liệu có thể chưa cập nhật." />
      )}
    </div>
  );
}
```

---

## Rules tóm tắt

| Rule | |
|------|-|
| Socket event → invalidate query | Không tự update state hay cache |
| Cleanup trong `useEffect` return | Luôn `socket.off(eventName)` khi unmount |
| Global events | Mount ở DashboardLayout, không ở page |
| Page-specific events | Mount ở page, tự cleanup |
| Race condition | Dùng `invalidateQueries` thay `setQueryData` |
| Connection state | Show banner khi mất kết nối |
