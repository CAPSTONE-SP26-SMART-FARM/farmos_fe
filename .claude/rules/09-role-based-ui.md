# 11 - Role-based UI Pattern

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Các role trong hệ thống

```ts
// src/constants/role.ts
enum RoleName {
  Admin = "admin",
  Owner = "owner",
  Manager = "manager",
  Doctor = "doctor",
}
```

**Không hardcode string role** — luôn import `RoleName` từ constants.

---

## Lấy role hiện tại

```tsx
import { useAuthStore } from "@/stores/authStore";
import { RoleName } from "@/constants/role";

function SomeComponent() {
  const { user } = useAuthStore();

  const isAdmin = user?.role === RoleName.Admin;
  const isOwner = user?.role === RoleName.Owner;
}
```

---

## Ẩn/hiện element theo role

### Pattern 1: Inline conditional (đơn giản)

```tsx
// Chỉ Admin mới thấy nút xóa
{user?.role === RoleName.Admin && (
  <Button variant="destructive" onClick={handleDelete}>
    <Trash2 /> Xóa người dùng
  </Button>
)}
```

### Pattern 2: Hook `useCurrentRole` (nhiều chỗ dùng)

```tsx
// hooks/useCurrentRole.ts
import { useAuthStore } from "@/stores/authStore";
import { RoleName } from "@/constants/role";

export function useCurrentRole() {
  const { user } = useAuthStore();
  return {
    role: user?.role,
    isAdmin: user?.role === RoleName.Admin,
    isOwner: user?.role === RoleName.Owner,
    isManager: user?.role === RoleName.Manager,
    isDoctor: user?.role === RoleName.Doctor,
    hasRole: (roles: RoleName[]) => roles.includes(user?.role as RoleName),
  };
}

// Dùng trong component
function DeviceActions({ device }: { device: Device }) {
  const { isOwner, isAdmin } = useCurrentRole();
  const canDelete = isOwner || isAdmin;

  return (
    <>
      {canDelete && (
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 /> Xóa
        </DropdownMenuItem>
      )}
    </>
  );
}
```

---

## Disable vs Hide

| Khi nào Hide | Khi nào Disable |
|-------------|----------------|
| User không có quyền thực hiện action | User có quyền nhưng điều kiện chưa thỏa (chưa chọn item, form chưa hợp lệ) |
| Feature cần role cao hơn | Action đang processing (isPending) |
| Subscription không đủ | |

```tsx
// ✅ Hide — không có quyền
{isAdmin && <DeleteButton />}

// ✅ Disable — có quyền nhưng chưa đủ điều kiện
<Button disabled={!selectedItems.length || isPending}>
  Xóa đã chọn ({selectedItems.length})
</Button>

// ❌ Sai — disable khi không có quyền (user sẽ không hiểu tại sao)
<Button disabled={!isAdmin}>Xóa</Button>
```

---

## Route-level protection (đã có sẵn)

Route guard xử lý tự động qua `ProtectedRoute` trong `routes.ts`:

```ts
// routes.ts — khai báo allowedRoles cho mỗi route
{
  path: "/dashboard/admin/users",
  component: AdminUsersPage,
  allowedRoles: [RoleName.Admin],
}
```

**Không cần** kiểm tra role trong page component nếu route đã được guard — chỉ kiểm tra role cho **UI element** bên trong page.

---

## Subscription Guard

Owner cần subscription active để dùng các feature chính:

```ts
// routes.ts
{
  path: "/dashboard/owner/iot-devices",
  component: OwnerIotDevicesPage,
  allowedRoles: [RoleName.Owner],
  requiresActiveSubscription: true,  // ← OwnerSubscriptionGuard bọc tự động
}
```

Không cần check subscription trong page component — guard xử lý tự động.

---

## UI khác nhau theo role trên cùng 1 component

Khi cùng 1 component nhưng render khác nhau theo role:

```tsx
// Tách thành component riêng theo role — không dùng nhiều if/else trong 1 component
// ❌ Sai — quá nhiều conditional
function DeviceCard({ device }: Props) {
  const { isOwner, isManager } = useCurrentRole();
  return (
    <Card>
      {isOwner && <OwnerActions />}
      {isManager && <ManagerActions />}
      {isOwner ? <OwnerStats /> : <ManagerStats />}
    </Card>
  );
}

// ✅ Đúng — tách component riêng
function OwnerDeviceCard({ device }: Props) { ... }
function ManagerDeviceCard({ device }: Props) { ... }

// Page của từng role dùng đúng component của role đó
// OwnerPage → OwnerDeviceCard
// ManagerPage → ManagerDeviceCard
```

---

## Rules tóm tắt

| Rule | |
|------|-|
| Không hardcode role string | Luôn dùng `RoleName` enum |
| Không có quyền | **Hide** element, không disable |
| Điều kiện chưa thỏa | **Disable** element |
| Route protection | Khai báo trong `routes.ts`, không check trong page |
| Subscription check | `requiresActiveSubscription: true` trong routes |
| Logic phức tạp | Tách `useCurrentRole` hook |
| Render khác nhau theo role | Tách component riêng theo role |
