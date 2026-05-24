# 01 - Context Project

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS** — nền tảng quản lý nông nghiệp thông minh (SaaS).

---

## Tổng quan hệ thống

FarmOS là nền tảng SaaS đa vai trò phục vụ quản lý trang trại:

- **Admin**: Quản lý toàn hệ thống — gói subscription, người dùng, hóa đơn, thống kê
- **Owner**: Chủ trang trại — quản lý farm, mùa vụ, IoT device, thanh toán, nhân sự
- **Manager**: Quản lý vùng trồng — giám sát mùa vụ, task, nhật ký hoạt động
- **Doctor**: Chuyên gia nông nghiệp — tư vấn, duyệt ticket yêu cầu hỗ trợ

## Mô hình kinh doanh

- Owner thuê subscription để mở khóa tính năng (không phải mua)
- IoT device: `status = purchase` nghĩa là đã cho thuê, `status = available` nghĩa là có thể dùng
- Mùa vụ gắn với zone (vùng trồng), zone thuộc farm, farm thuộc Owner

## Ngôn ngữ UI

- Toàn bộ label, toast, error message hiển thị bằng **tiếng Việt**
- Type/interface đặt tên bằng tiếng Anh theo convention

## Cấu trúc thư mục tổng quan

```
src/
├── assets/             # Static assets
├── components/
│   ├── ui/             # shadcn/ui primitives (KHÔNG sửa trực tiếp)
│   ├── common/         # Shared components dùng toàn app (EmptyState, TableSkeleton, StatusBanner...)
│   ├── auth/           # Guard components (ProtectedRoute, OwnerSubscriptionGuard)
│   ├── layout/         # Layout wrappers (DashboardLayout, MainLayout, SimpleLayout)
│   └── notifications/  # Notification system
├── constants/
│   ├── endpoints.ts    # Tất cả API endpoint constants + QUERY_KEYS
│   ├── role.ts         # RoleName enum
│   └── index.ts        # Re-exports
├── hooks/              # Custom React hooks (useDebounce, useQueryParams, useSocket...)
├── lib/
│   ├── axios.ts        # Axios instance (interceptors, token refresh queue, api.get/post/put/patch/delete)
│   ├── queryClient.ts  # React Query config (staleTime 5min, gcTime 30min)
│   ├── utils.ts        # cn(), general utilities
│   ├── format.ts       # Date/number formatting
│   └── error-message.ts # Error message translations (VI)
├── pages/              # Route-level page components
│   └── [Role]Page/
│       └── [Feature]/
│           ├── [Feature]Page.tsx       # Page chính (orchestration)
│           └── _components/            # Sub-components chỉ dùng trong feature này
├── queries/            # React Query hooks (useQuery + useMutation per entity)
├── routes/             # Route definitions + AppRoutes renderer
├── schemaValidatation/ # Zod schemas cho form validation (note: typo folder name là intentional)
├── services/           # Axios service functions per entity
├── stores/             # Zustand global state (auth, farm, notification, socket, breadcrumb)
└── types/              # TypeScript interfaces/types
```

## Convention đặt tên

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Page component | `[Role][Feature]Page.tsx` | `OwnerCropSeasonsPage.tsx` |
| Service file | `[entity]Service.ts` | `cropSeasonService.ts` |
| Query hook file | `use[Entity].ts` | `useCropSeason.ts` |
| Schema file | `[entity].ts` trong `schemaValidatation/` | `cropSeason.ts` |
| Zustand store | `[entity]Store.ts` | `farmStore.ts` |
| Sub-component | `_components/[ComponentName].tsx` | `_components/ZoneSwitcher.tsx` |
