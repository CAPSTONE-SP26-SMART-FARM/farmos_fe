---
name: add-realtime-listener
description: Subscribe Socket.IO event ở FE, invalidate React Query khi nhận event, cleanup listener khi unmount. Trigger khi user nói "FE nhận event X realtime", "subscribe socket Y", "update list realtime khi ...".
---

# Skill — Add Realtime Listener (Socket.IO + React Query)

> Đọc trước: [../../rules/11-realtime-socket.md](../../rules/11-realtime-socket.md).

## When to use

- BE đã emit event (xem skill BE [add-realtime-event](../../../../farm_os_be/.claude/skills/add-realtime-event/SKILL.md)).
- FE cần nhận và refresh data hoặc show notification.

## Steps

### 1. Lấy socket instance

Từ `useSocket()` hook hoặc `useSocketStore`. Socket đã connect ở App root sau khi login.

### 2. Subscribe trong `useEffect`

```tsx
useEffect(() => {
  if (!socket) return;

  const handler = (payload: FarmMemberInvitedPayload) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FARM_MEMBERS_LIST });
    toast.info(`${payload.inviterName} vừa mời ${payload.memberName} vào farm`);
  };

  socket.on("farm.member.invited", handler);
  return () => {
    socket.off("farm.member.invited", handler);  // ← BẮT BUỘC cleanup
  };
}, [socket, queryClient]);
```

### 3. Define payload type

`src/types/realtime.ts`:
```ts
export interface FarmMemberInvitedPayload {
  farmId: string;
  inviterName: string;
  memberName: string;
  invitedAt: string;
}
```

Match shape BE Zod schema (xem `realtime.events.ts` BE).

### 4. Chọn invalidate strategy

| Tình huống | Action |
|---|---|
| List thay đổi (item mới/xóa) | `invalidateQueries({ queryKey: QUERY_KEYS.X_LIST })` |
| 1 item update | `invalidateQueries({ queryKey: [...QUERY_KEYS.X_DETAIL, id] })` |
| Chỉ notify, không refresh | `toast.info(...)` only |
| User offline lúc event | Polling fallback `staleTime: 30s` — không cần handle thủ công |

### 5. Đặt listener ở đâu?

- **Toàn app** (badge, notification): `App.tsx` hoặc dedicated `NotificationProvider`.
- **Per page** (refresh list khi đang xem): trong Page component.
- **Per detail**: trong Detail page với `id` deps.

KHÔNG đặt listener trong `_components/` con — khó cleanup khi unmount.

## Verify

- [ ] Cleanup `socket.off()` trong return của `useEffect`.
- [ ] `queryKey` invalidate chính xác (so với key trong `useQuery`).
- [ ] Payload type match BE schema.
- [ ] Không subscribe trùng (vd `socket.on` trong render — phải trong `useEffect`).
- [ ] Toast notification dùng `sonner`, tiếng Việt.

## Anti-patterns

- ❌ Quên `socket.off()` → memory leak, double-fire khi remount.
- ❌ Gọi `setState` từ handler khi component đã unmount → React warning.
- ❌ `window.location.reload()` thay vì `invalidateQueries`.
- ❌ Subscribe ở mọi page — chỉ subscribe nơi cần refresh.
- ❌ Event name CamelCase — phải match BE format `domain.entity.action`.
