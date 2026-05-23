---
name: create-page
description: Scaffold một page mới trong src/pages/[Role]Page/[Feature]/ với cấu trúc chuẩn (Page + _components/ + Table + Columns + Form + Dialogs). Trigger khi user nói "tạo page X", "scaffold trang Y cho role Z", "create feature folder cho ...".
---

# Skill — Create Page Skeleton

## When to use

- User cần bootstrap 1 feature page mới.
- Bước scaffold của [implement-feature](../implement-feature/SKILL.md).

## Input cần xác định

1. **Role**: `admin | owner | manager | doctor` → `src/pages/[Role]Page/`.
2. **Feature name** (PascalCase, plural cho list): vd `DoctorWithdrawals`, `CropSeasons`.
3. **Entity name** (PascalCase singular): vd `DoctorWithdrawal`.
4. **CRUD nào cần?** (mặc định list + create + edit + delete + detail).

## Steps

### 1. Tạo folder

```
src/pages/[Role]Page/[Feature]/
├── [Feature]Page.tsx              ← orchestration, max 350 dòng
└── _components/
    ├── [Feature]Table.tsx          ← <DataTable> wrapper
    ├── [entity]-columns.tsx        ← ColumnDef<Entity>[] tách riêng
    ├── [Entity]RowActions.tsx      ← dropdown 3 chấm (Edit, Delete, ...)
    ├── Create[Entity]Dialog.tsx
    ├── Edit[Entity]Dialog.tsx
    ├── Delete[Entity]Alert.tsx     ← AlertDialog
    └── [Entity]Form.tsx            ← form dùng chung Create + Edit
```

> Tách `columns` và `RowActions` thành file riêng — bắt buộc khi table > 5 cột hoặc có actions phức tạp.

### 2. Page template

`[Feature]Page.tsx` trách nhiệm:
- Gọi `useQuery` lấy list.
- State local: `dialogOpen`, `editingId`, `search`, `filter`.
- Compose: Header (title + create button) → Filter row → Table → Pagination → Dialogs.
- Breadcrumb setup nếu cần.

KHÔNG đặt JSX list/table > 150 dòng inline — tách `_components/`.

### 3. Register route

`src/routes/[role]Routes.tsx`:
```tsx
{
  path: "withdrawals",
  element: <ProtectedRoute role={RoleName.Doctor}><DoctorWithdrawalsPage /></ProtectedRoute>,
}
```

Xem [../../rules/09-role-based-ui.md](../../rules/09-role-based-ui.md) cho guard pattern.

### 4. Verify

- [ ] Mỗi file < 500 dòng (page < 350).
- [ ] `_components/` chỉ nhận data qua props, không `useQuery` trực tiếp.
- [ ] Mutations qua `useMutation` hook ở `src/queries/`, không gọi service từ component.

## Anti-patterns

- ❌ Đặt page ngoài `[Role]Page/` (vd `src/pages/Withdrawals/`).
- ❌ Inline columns + actions trong `[Feature]Page.tsx` → vi phạm giới hạn dòng.
- ❌ Import từ page khác (`pages/AdminPage/.../`) → dùng `components/common/` thay thế.
