# FarmOS Frontend Development Guide

> **Last updated:** April 8, 2026 — aligned with backend API conventions and latest project structure.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Architecture Overview](#architecture-overview)
5. [Component Organization Rules](#component-organization-rules)
6. [Creating a New Page (Step-by-Step)](#creating-a-new-page-step-by-step)
7. [Routing & Role-Based Access](#routing--role-based-access)
8. [State Management](#state-management)
9. [API Integration Layer](#api-integration-layer)
10. [Schema Validation (Zod)](#schema-validation-zod)
11. [React Query Hooks](#react-query-hooks)
12. [Authentication Flow](#authentication-flow)
13. [Styling Guidelines](#styling-guidelines)
14. [File & Naming Conventions](#file--naming-conventions)
15. [Backend Alignment Checklist](#backend-alignment-checklist)
16. [Lint & Type Check](#lint--type-check)
17. [shadcn/ui Components](#shadcnui-components)
18. [Environment Variables](#environment-variables)
19. [Commands Reference](#commands-reference)
20. [Animation Patterns](#animation-patterns)
21. [Quick Reference Cheatsheet](#quick-reference-cheatsheet)

---

## Tech Stack

| Category           | Technology                                   | Version |
| ------------------ | -------------------------------------------- | ------- |
| **Framework**      | React                                        | 19      |
| **Language**       | TypeScript (strict mode)                     | ~5.9    |
| **Build Tool**     | Vite                                         | 7       |
| **Styling**        | Tailwind CSS (v4 plugin)                     | 4       |
| **UI Library**     | shadcn/ui (New York style, Radix primitives) | latest  |
| **Icons**          | Lucide React                                 | latest  |
| **Client State**   | Zustand (persisted via middleware)           | 5       |
| **Server State**   | TanStack React Query                         | 5       |
| **Data Tables**    | TanStack React Table                         | 8       |
| **Routing**        | React Router                                 | 7       |
| **HTTP Client**    | Axios (with interceptors)                    | 1       |
| **Form Handling**  | React Hook Form + @hookform/resolvers        | 7       |
| **Validation**     | Zod (runtime schemas + TS type inference)    | 4       |
| **Notifications**  | Sonner                                       | 2       |
| **Animation**      | Framer Motion                                | 12      |
| **Date Utilities** | date-fns                                     | 4       |
| **Auth Utilities** | jwt-decode                                   | 4       |
| **Query Strings**  | query-string                                 | 9       |
| **Theme**          | next-themes (light / dark)                   | 0.4     |

---

## Project Structure

```
src/
├── api/                    # (Reserved) API layer placeholder
│   ├── endpoints/
│   └── types/
├── assets/                 # Static assets (images, fonts, SVGs)
├── components/
│   ├── auth/               # Auth components
│   │   ├── ProtectedRoute.tsx    # Role-based route guard
│   │   └── RefreshToken.tsx      # Auto token refresh (interval-based)
│   ├── common/             # Shared components used in 2+ pages
│   │   ├── pro-pagination.tsx    # Advanced paginated navigation
│   │   ├── ScrollToTop.tsx       # Scroll restoration on route change
│   │   ├── TableSkeleton.tsx     # Loading skeleton for tables
│   │   ├── theme-provider.tsx    # Dark/light theme context
│   │   ├── theme-toggle.tsx      # Theme switch button
│   │   └── TableRequestShell/    # Reusable request table shell
│   ├── layout/             # Layout wrappers
│   │   ├── DashboardLayout/      # Sidebar + breadcrumb + main area
│   │   ├── MainLayout/           # Bare Outlet wrapper (public pages)
│   │   ├── SimpleLayout/         # Bare Outlet wrapper (auth pages)
│   │   └── NotFound/             # 404 page
│   └── ui/                 # shadcn/ui components ⚠️ DO NOT EDIT DIRECTLY
│       ├── accordion.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── confirm-dialog.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── field.tsx
│       ├── input-group.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── table.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── constants/              # App-wide constants & enums
│   ├── auth.ts             # Auth types, user status, verification codes
│   ├── endpoints.ts        # API_ENDPOINTS + QUERY_KEYS (centralized)
│   ├── index.ts            # Barrel export
│   ├── profile.ts          # Doctor types, registration status
│   └── role.ts             # RoleName, HTTPMethod constants
├── hooks/                  # Custom React hooks
│   ├── use-mobile.ts       # Mobile breakpoint detector (768px)
│   ├── useDebounce.tsx     # Debounced value (default 500ms)
│   ├── usePaginateRange.tsx # Pagination range with ellipsis
│   └── useQueryParams.tsx  # URL search params → object
├── lib/                    # Core utilities
│   ├── axios.ts            # Axios instance + interceptors + api helpers
│   ├── queryClient.ts      # React Query client config
│   └── utils.ts            # cn(), type guards, JWT decode
├── pages/                  # Page components (see Page Organization below)
│   ├── AdminPage/
│   ├── DoctorPage/
│   ├── ForgotPasswordPage/
│   ├── HomePage/
│   ├── LoginPage/
│   ├── ManagerPage/
│   ├── OwnerPage/
│   └── RegisterPage/
├── queries/                # React Query hooks (useQuery / useMutation)
│   ├── index.ts
│   ├── useAdmin.ts
│   ├── useAuth.ts
│   ├── useCropSeason.ts
│   ├── useDoctor.ts
│   ├── useOwner.ts
│   └── useZone.ts
├── routes/                 # Route configuration
│   ├── AppRoutes.tsx       # Route renderer with ProtectedRoute wrapper
│   ├── routes.ts           # All route definitions (by role)
│   └── types.ts            # RouteChild, RouteConfig, AppRoutes types
├── schemaValidatation/     # Zod schemas for API request/response
│   ├── auth.ts
│   ├── doctorAssignment.ts
│   ├── doctorProfile.ts
│   ├── farmManagement.ts
│   ├── farmMember.ts
│   ├── zone.ts
│   └── zoneMember.ts
├── services/               # API service functions (HTTP calls)
│   ├── index.ts            # Barrel export
│   ├── adminService.ts
│   ├── authService.ts
│   ├── cropSeasonService.ts
│   ├── doctorService.ts
│   ├── ownerService.ts
│   └── zoneService.ts
├── stores/                 # Zustand stores (client state)
│   ├── authStore.ts        # User, tokens, auth state (persisted)
│   └── farmStore.ts        # Selected farm state
├── types/                  # TypeScript type definitions
│   ├── api.ts              # ApiResponseType, ApiErrorResponse (Zod)
│   ├── auth.ts             # TokenPayload interface
│   ├── cropSeason.ts       # Crop season domain types
│   ├── user.ts             # UserResType (from Zod schema)
│   └── zone.ts             # Zone types (re-exported)
├── App.tsx                 # Root component → <AppRoutes />
├── App.css                 # Global styles
├── main.tsx                # Entry point (providers, router, toaster)
└── index.css               # Tailwind base + CSS variables
```

---

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env
# Edit .env → set VITE_API_URL=http://localhost:3000

# 3. Start development server
pnpm dev

# 4. Validate before committing
pnpm lint          # ESLint check
pnpm build         # Type check (tsc -b) + Vite build
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  main.tsx                                                     │
│  ┌─ ThemeProvider                                            │
│  │  ┌─ QueryClientProvider (React Query)                    │
│  │  │  ┌─ BrowserRouter                                     │
│  │  │  │  ├─ App → AppRoutes                                │
│  │  │  │  ├─ Toaster (Sonner)                               │
│  │  │  │  └─ RefreshToken (auto-refresh interval)           │
│  │  │  └─                                                    │
│  │  └─                                                       │
│  └─                                                          │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Page Component
  → uses React Query hook (queries/)
    → calls service function (services/)
      → Axios instance (lib/axios.ts)
        → Backend API (auto Bearer token via interceptor)
          → Response unwrapped: { statusCode, message, data }
            → Zod schema validates response (schemaValidatation/)
              → Typed data returned to component
```

### State Separation

| Concern        | Solution                  | Where                     |
| -------------- | ------------------------- | ------------------------- |
| Server data    | React Query               | `queries/` + `services/`  |
| Auth state     | Zustand (persisted)       | `stores/authStore.ts`     |
| Farm selection | Zustand                   | `stores/farmStore.ts`     |
| Form state     | React Hook Form + Zod     | Inline in page components |
| UI ephemeral   | `useState` / `useReducer` | Inline in components      |
| Theme          | next-themes               | `components/common/`      |

---

## Component Organization Rules

### 1. Page-Specific Components → Inside the page folder

Each page lives in its own folder. Page-specific sub-components go in that folder (flat or in a `components/` subfolder).

```
src/pages/HomePage/
├── HomePage.tsx                 # Main page component
└── components/
    ├── HeroSection.tsx          # ONLY used in HomePage
    ├── FeatureCard.tsx          # ONLY used in HomePage
    └── CTASection.tsx           # ONLY used in HomePage
```

```tsx
// HomePage.tsx
import HeroSection from "./components/HeroSection";
import FeatureCard from "./components/FeatureCard";
```

### 2. Dashboard Sub-Pages → Each section gets its own folder

For role-based dashboard pages (Admin, Manager, Owner, Doctor), each sidebar item is a separate folder with its main page file and related components.

```
src/pages/AdminPage/
├── AdminPage.tsx               # Entry point (re-exports default page)
├── Dashboard/
│   └── AdminDashboardPage.tsx
├── Farms/
│   ├── AdminFarmsPage.tsx      # Main page
│   ├── FarmTable.tsx           # Page-specific component
│   ├── FarmDetailPanel.tsx     # Page-specific component
│   └── FarmDetailDialog.tsx    # Page-specific component
├── IotTemplates/
│   └── AdminIotTemplatesPage.tsx
├── Packages/
│   └── AdminPackagesPage.tsx
├── Users/
│   └── AdminUsersPage.tsx
├── DoctorApplications/
│   └── AdminDoctorApplicationsPage.tsx
├── DoctorAssignment/
│   └── AdminDoctorAssignmentPage.tsx
├── DoctorPerformance/
│   └── AdminDoctorPerformancePage.tsx
├── TicketAnalytics/
│   └── AdminTicketAnalyticsPage.tsx
└── RequestDoctor/
    ├── ListRequest.tsx
    ├── TableRequestDoctor.tsx
    └── UpdateRequest.tsx
```

### 3. Shared Components → `src/components/common/`

If a component is used in **2 or more pages**, extract it to `src/components/common/`.

```
src/components/common/
├── pro-pagination.tsx      # Used in multiple list pages
├── TableSkeleton.tsx       # Used wherever tables load
├── ScrollToTop.tsx         # Used in layout
└── theme-provider.tsx      # App-wide theme
```

### 4. UI Components → `src/components/ui/` ⚠️ DO NOT EDIT

All shadcn/ui primitives. Add new ones via CLI only:

```bash
npx shadcn@latest add [component-name]
```

---

## Creating a New Page (Step-by-Step)

### Example: Creating `AdminSensorTemplatesPage`

**Step 1: Create the folder and page file**

```
src/pages/AdminPage/SensorTemplates/
└── AdminSensorTemplatesPage.tsx
```

**Step 2: Write the page component**

```tsx
// src/pages/AdminPage/SensorTemplates/AdminSensorTemplatesPage.tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AdminSensorTemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">Admin Portal</Badge>
        <h1 className="text-2xl font-bold">Sensor Templates</h1>
        <p className="text-muted-foreground">
          Manage sensor configuration templates.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Template List</CardTitle>
        </CardHeader>
        <CardContent>{/* Content here */}</CardContent>
      </Card>
    </div>
  );
}

export default AdminSensorTemplatesPage;
```

**Step 3: Add the Zod schema (if API-connected)**

```ts
// src/schemaValidatation/sensorTemplate.ts
import { z } from "zod";

export const SensorTemplateResSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum([
    "soil_moisture_sensor",
    "light_intensity_sensor",
    "air_humidity_sensor",
    "air_temperature_sensor",
  ]),
  // ... other fields matching BE response
});

export type SensorTemplateResType = z.infer<typeof SensorTemplateResSchema>;
```

**Step 4: Add API endpoint and query key**

```ts
// In src/constants/endpoints.ts
// Add to API_ENDPOINTS:
SENSOR_TEMPLATES: {
  BASE: "/sensor-template",
  BY_ID: (id: string) => `/sensor-template/${id}`,
},

// Add to QUERY_KEYS:
sensorTemplates: {
  all: ["sensor-templates"],
  list: (filters?: Record<string, unknown>) => ["sensor-templates", "list", filters],
  detail: (id: string) => ["sensor-templates", id],
},
```

**Step 5: Create the service**

```ts
// src/services/sensorTemplateService.ts
import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import queryString from "query-string";
import type { SensorTemplateResType } from "@/schemaValidatation/sensorTemplate";

const EP = API_ENDPOINTS.SENSOR_TEMPLATES;

export const sensorTemplateService = {
  list: (query: { page: number; limit: number; search?: string }) =>
    api.get<{ data: SensorTemplateResType[]; meta: PagingMetaType }>(
      `${EP.BASE}?${queryString.stringify(query, { skipNull: true, skipEmptyString: true })}`,
    ),
  getById: (id: string) => api.get<SensorTemplateResType>(EP.BY_ID(id)),
};
```

**Step 6: Create the React Query hook**

```ts
// src/queries/useSensorTemplate.ts
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { sensorTemplateService } from "@/services/sensorTemplateService";

export const useSensorTemplateList = (query: {
  page: number;
  limit: number;
  search?: string;
}) =>
  useQuery({
    queryKey: QUERY_KEYS.sensorTemplates.list(query),
    queryFn: () => sensorTemplateService.list(query),
  });
```

**Step 7: Register the route**

```ts
// src/routes/routes.ts
import AdminSensorTemplatesPage from "@/pages/AdminPage/SensorTemplates/AdminSensorTemplatesPage";

// Inside the Admin DashboardLayout children:
{
  path: "/dashboard/admin/sensor-templates",
  component: AdminSensorTemplatesPage,
  allowedRoles: ["admin"],
},
```

**Step 8: Validate**

```bash
pnpm lint
pnpm build    # includes tsc -b type check
```

---

## Routing & Role-Based Access

### Layouts

| Layout | Purpose | Authentication |
| --- | --- | --- |
| `MainLayout` | Public pages (Home) | None |
| `SimpleLayout` | Auth pages (Login, Register) | `isRestricted: true` — redirects logged-in users |
| `DashboardLayout` | All dashboard views | `allowedRoles: [...]` — requires auth + role match |

### Route Definitions

```ts
// src/routes/routes.ts
const routes: AppRoutes = [
  { layout: MainLayout, children: [{ path: "/", component: HomePage }] },
  { layout: SimpleLayout, isRestricted: true, children: [...authPages] },
  { layout: DashboardLayout, children: [...adminRoutes] },
  { layout: DashboardLayout, children: [...ownerRoutes] },
  { layout: DashboardLayout, children: [...managerRoutes] },
  { layout: DashboardLayout, children: [...doctorRoutes] },
];
```

### Role → Base Path Mapping

| Role    | Base Path            | DB Enum   |
| ------- | -------------------- | --------- |
| Admin   | `/dashboard/admin`   | `admin`   |
| Owner   | `/dashboard/owner`   | `owner`   |
| Manager | `/dashboard/manager` | `manager` |
| Farmer  | `/dashboard/farmer`  | `farmer`  |
| Doctor  | `/dashboard/doctor`  | `doctor`  |

### ProtectedRoute Behavior

```
1. isRestricted route + user logged in → redirect to /dashboard/{role}
2. allowedRoles set + user NOT logged in → redirect to /login (toast error)
3. allowedRoles set + user role NOT in list → redirect to /dashboard/{user.role} (toast error)
4. No restrictions → render children
```

### Route Types

```ts
// src/routes/types.ts
export interface RouteChild {
  path: string;
  component: ComponentType;
  allowedRoles?: string[]; // lowercase role names: "admin", "owner", etc.
}

export interface RouteConfig {
  layout: ComponentType;
  isRestricted?: boolean; // For auth pages only
  children: RouteChild[];
}

export type AppRoutes = RouteConfig[];
```

---

## State Management

### Zustand — Client State

For auth, user preferences, selected entities.

```ts
// src/stores/authStore.ts — Persisted to localStorage
interface AuthStore {
  user: UserResType | null;
  userToken: { accessToken: string; refreshToken: string };
  isAuth: boolean;
  isAuthenticated: boolean; // Alias for isAuth

  setUser: (user: UserResType) => void;
  setTokens: (tokens: LoginResType) => void;
  logout: () => void; // Clears localStorage + resets state
}
```

```ts
// src/stores/farmStore.ts — Not persisted
interface FarmStore {
  farm: FarmResType | null;
  setFarm: (farm: FarmResType) => void;
  clearFarm: () => void;
}
```

**Usage Pattern:**

```tsx
import { useAuthStore } from "@/stores/authStore";

function MyComponent() {
  // ✅ Select only what you need (avoids unnecessary re-renders)
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // ❌ Don't destructure the entire store
  // const { user, logout } = useAuthStore();
}
```

### React Query — Server State

For API data. All hooks live in `src/queries/`.

**Default Configuration** (from `lib/queryClient.ts`):

| Setting                | Value           | Explanation                       |
| ---------------------- | --------------- | --------------------------------- |
| `staleTime`            | 5 minutes       | Data considered fresh for 5m      |
| `gcTime`               | 30 minutes      | Cache garbage collected after 30m |
| `retry`                | 2× for 5xx only | No retry on 4xx client errors     |
| `refetchOnWindowFocus` | `false`         | No refetch on tab focus           |
| Mutation `retry`       | `false`         | Never retry writes                |

---

## API Integration Layer

### Layer Overview

```
constants/endpoints.ts    → API_ENDPOINTS (URL paths) + QUERY_KEYS
services/*Service.ts      → HTTP functions using api helpers from lib/axios.ts
queries/use*.ts           → React Query hooks wrapping services
schemaValidatation/*.ts   → Zod schemas for request/response types
types/*.ts                → TypeScript types (often inferred from Zod)
```

### Axios Instance (`lib/axios.ts`)

- **Base URL**: `import.meta.env.VITE_API_URL`
- **Timeout**: 30 seconds
- **Request Interceptor**: Attaches `Authorization: Bearer <token>` from `localStorage`
- **Response Interceptor**:
  - On 401: Attempts token refresh (queues other failing requests)
  - Skips refresh for `/auth/login` and `/auth/refresh` endpoints
  - Does **NOT** force logout on refresh failure (user decides)

### Type-Safe API Helpers

```ts
// lib/axios.ts exports
const api = {
  get:    <T>(url, config?)       → Promise<ApiResponseType<T>>
  post:   <T, D>(url, data?, config?) → Promise<ApiResponseType<T>>
  put:    <T, D>(url, data?, config?) → Promise<ApiResponseType<T>>
  delete: <T>(url, config?)       → Promise<ApiResponseType<T>>
  patch:  <T, D>(url, data?, config?) → Promise<ApiResponseType<T>>
};
```

### API Response Types (aligned with BE)

```ts
// src/types/api.ts
interface ApiResponseType<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
}

interface ApiErrorResponse {
  statusCode: number;
  message: string;
}

interface ApiErrorUnprocessableEntityResponse<T> extends ApiErrorResponse {
  errors: Array<{ field: keyof T; message: string }>;
}
```

### Service Pattern

```ts
// src/services/exampleService.ts
import { API_ENDPOINTS } from "@/constants";
import { api } from "@/lib/axios";
import queryString from "query-string";

const EP = API_ENDPOINTS.EXAMPLE;

export const exampleService = {
  list: (query: ListQueryType) =>
    api.get<ListResType>(
      `${EP.BASE}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  getById: (id: string) => api.get<DetailResType>(EP.BY_ID(id)),

  create: (body: CreateBodyType) =>
    api.post<ResType, CreateBodyType>(EP.BASE, body),

  update: (id: string, body: UpdateBodyType) =>
    api.put<ResType, UpdateBodyType>(EP.BY_ID(id), body),

  delete: (id: string) => api.delete<MessageResType>(EP.BY_ID(id)),
};
```

### Adding a New Endpoint

1. Add URL to `API_ENDPOINTS` in `src/constants/endpoints.ts`
2. Add query key factory to `QUERY_KEYS` in same file
3. Create service in `src/services/`
4. Create React Query hook in `src/queries/`
5. Create Zod schema in `src/schemaValidatation/`

---

## Schema Validation (Zod)

All API request/response schemas live in `src/schemaValidatation/`. Types are inferred with `z.infer<>`.

### Pattern

```ts
// src/schemaValidatation/example.ts
import { z } from "zod";

// Response schema — mirrors BE API output
export const ExampleResSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string(),
});
export type ExampleResType = z.infer<typeof ExampleResSchema>;

// Create request body
export const CreateExampleBodySchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(["active", "inactive"]).default("active"),
});
export type CreateExampleBodyType = z.infer<typeof CreateExampleBodySchema>;

// List query params
export const ListExampleQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});
export type ListExampleQueryType = z.infer<typeof ListExampleQuerySchema>;

// Paginated list response (matching BE PagingResponseSchema)
export const ListExampleResSchema = z.object({
  data: z.array(ExampleResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});
export type ListExampleResType = z.infer<typeof ListExampleResSchema>;
```

### With React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateExampleBodySchema,
  type CreateExampleBodyType,
} from "@/schemaValidatation/example";

function CreateForm() {
  const form = useForm<CreateExampleBodyType>({
    resolver: zodResolver(CreateExampleBodySchema),
    defaultValues: { name: "", status: "active" },
  });

  const onSubmit = (data: CreateExampleBodyType) => {
    // call mutation
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* fields */}</form>;
}
```

---

## React Query Hooks

All hooks live in `src/queries/`.

### Critical Cache Invalidation (MUST)

- Every successful create/update/delete mutation must invalidate related query keys.
- Do not skip invalidation after mutation (including IoT templates).
- For update/delete with `id`, invalidate both list key and detail key when applicable.
- This is required to avoid stale data after create/update/delete actions.

```ts
// Required pattern for mutations
onSuccess: (_res, variables) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entity.list() });
  if (variables?.id) {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.entity.detail(variables.id),
    });
  }
};

// IoT example (must do after create/update/delete)
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.admin.iotDeviceTemplates.list(),
});
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.admin.sensorTemplates.list(),
});
```

### Query Hook Pattern

```ts
// src/queries/useExample.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { exampleService } from "@/services/exampleService";
import { toast } from "sonner";

// List hook
export const useExampleList = (query: {
  page: number;
  limit: number;
  search?: string;
}) =>
  useQuery({
    queryKey: QUERY_KEYS.examples.list(query),
    queryFn: () => exampleService.list(query),
  });

// Detail hook
export const useExampleDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.examples.detail(id),
    queryFn: () => exampleService.getById(id),
    enabled: !!id,
  });

// Create mutation
export const useCreateExample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exampleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.examples.all });
      toast.success("Created successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};

// Update mutation
export const useUpdateExample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBodyType }) =>
      exampleService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.examples.all });
      toast.success("Updated successfully");
    },
  });
};

// Delete mutation
export const useDeleteExample = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exampleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.examples.all });
      toast.success("Deleted successfully");
    },
  });
};
```

### Usage in Component

```tsx
function ExampleListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useExampleList({ page, limit: 10 });

  if (isLoading) return <TableSkeleton />;
  if (error) return <div>Error: {getErrorMessage(error)}</div>;

  return (
    <>
      {data?.data.data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      {/* data.data = ApiResponseType wrapper, data.data.data = actual list */}
    </>
  );
}
```

---

## Authentication Flow

### Login

```
1. User submits credentials (React Hook Form + Zod)
2. authService.login() → POST /auth/login
3. Response: { accessToken, refreshToken }
4. authStore.setTokens() → saves to localStorage + Zustand (persisted)
5. authService.getMe() → GET /auth/me
6. authStore.setUser() → saves user profile
7. Redirect to /dashboard/{role}
```

### Token Refresh (Automatic)

`RefreshToken` component runs an interval every **10 seconds**:

```
1. Decode accessToken → check exp
2. If token expires within 60s OR already expired:
   a. Call POST /auth/refresh with refreshToken
   b. Update both tokens in localStorage + Zustand
3. If refresh fails → log error (NO forced logout)
```

### Axios Interceptor Refresh (Backup)

If a request gets 401:

```
1. Queue all pending requests
2. Attempt refresh with stored refreshToken
3. On success → retry all queued requests with new token
4. On failure → reject all queued requests (no forced logout)
```

### Logout

```
1. authStore.logout():
   a. Clear localStorage (accessToken, refreshToken)
   b. Clear farmStore
   c. Reset auth state to initial
2. User redirected to /login by ProtectedRoute
```

---

## Styling Guidelines

### Tailwind CSS (v4)

- Avoid gradient colors in UI (`bg-gradient-*`, text gradients, radial/linear custom gradients).
- Prefer solid semantic tokens (`bg-card`, `bg-muted`, `text-foreground`, `border`) for consistency.

```tsx
// ✅ Use Tailwind utility classes
<div className="flex items-center gap-4 p-4 bg-card rounded-lg border">

// ✅ Use cn() for conditional classes
import { cn } from "@/lib/utils";
<div className={cn("p-4", isActive && "bg-primary text-primary-foreground")}>

// ❌ Never use inline styles
<div style={{ display: 'flex', padding: '16px' }}>

// ❌ Never use CSS modules or styled-components
```

### Using shadcn/ui Components

```tsx
// ✅ Import from @/components/ui/
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ✅ Use semantic variants
<Button variant="outline" size="sm">Edit</Button>
<Button variant="destructive">Delete</Button>
<Badge variant="secondary">Draft</Badge>
```

### Theme Support

- Dark/light via `next-themes` (`ThemeProvider` in `main.tsx`)
- Use Tailwind CSS variables: `bg-card`, `text-foreground`, `border`, `text-muted-foreground`
- Toggle via `theme-toggle.tsx` component

---

## File & Naming Conventions

| Type | Convention | Example |
| --- | --- | --- |
| **Page folders** | PascalCase | `AdminPage/`, `IotTemplates/` |
| **Page files** | PascalCase descriptive | `AdminIotTemplatesPage.tsx` |
| **Components** | PascalCase | `FarmTable.tsx`, `HeroSection.tsx` |
| **Hooks** | camelCase with `use` prefix | `useDebounce.tsx`, `useAdmin.ts` |
| **Services** | camelCase + `Service` suffix | `adminService.ts` |
| **Stores** | camelCase + `Store` suffix | `authStore.ts` |
| **Schemas** | camelCase (in `schemaValidatation/`) | `doctorProfile.ts` |
| **Constants** | SCREAMING_SNAKE_CASE | `API_ENDPOINTS`, `QUERY_KEYS` |
| **Types** | PascalCase + `Type` suffix | `UserResType`, `LoginBodyType` |
| **Zod schemas** | PascalCase + `Schema` suffix | `LoginBodySchema`, `UserResSchema` |
| **Query hooks** | `use` + Entity + Action | `useExampleList`, `useCreateExample` |
| **CSS** | Tailwind only — no custom CSS | `className="flex gap-2"` |

### Import Aliases

```tsx
import { Button } from "@/components/ui/button"; // @/ = src/
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/axios";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
```

---

## Backend Alignment Checklist

The backend (NestJS + Prisma + Zod) sets the API contract. The frontend MUST match.

### API Response Shape

Every BE response is wrapped by `ApiResponseInterceptor`:

```json
{
  "statusCode": 200,
  "message": "Success message from @ResponseMessage decorator",
  "data": { ... }
}
```

Error responses:

```json
{
  "statusCode": 400,
  "message": "Error description"
}
```

Validation errors (422):

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [{ "field": "name", "message": "Name is required" }]
}
```

### Pagination Contract

**Request** (query params):

```
?page=1&limit=10&search=keyword
```

**Response**:

```json
{
  "statusCode": 200,
  "message": "...",
  "data": {
    "data": [ ...items ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 42,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Domain Enums (Must Mirror in FE)

These enums come from `prisma/schema.prisma`. Use `as const` objects or Zod enums in FE.

| DB Enum    | Values                                          |
| ---------- | ----------------------------------------------- |
| `UserRole` | `admin`, `owner`, `manager`, `farmer`, `doctor` |
| `FarmType` | `cultivation`                                   |
| `ZoneType` | `cultivation`                                   |

> **Note (April 2026):** The backend Prisma schema still defines `rancher` role and `livestock`/`mixed` farm types, but the **frontend does not use them**. All FE enums, schemas, UI, and constants reference only the values listed above.

| `CropStage` | `germination`, `seedling`, `growth`, `harvest` | | `SensorType` | `soil_moisture`, `soil_ph`, `air_temperature`, `air_humidity`, `light_intensity`, `nh3_level`, `co2_level` | | `ProductionStatus` | `planning`, `sent`, `approved`, `rejected`, `active`, `completed`, `cancelled` | | `ProductionMilestoneStatus`| `pending`, `in_progress`, `completed` | | `TemplateType` | `crop_season`, `milestone`, `board_module`, `wifi_module`, `lora_module`, `soil_moisture_sensor`, `light_intensity_sensor`, `air_humidity_sensor`, `air_temperature_sensor`, `task` | | `TemplateItemType` | `activity`, `metric`, `condition` | | `ProductionRequestStatus` | `pending`, `approved`, `rejected` | | `DeviceStatus` | `active`, `inactive`, `maintenance`, `decommissioned` | | `SensorStatus` | `active`, `inactive`, `calibrating` | | `DoctorType` | `internal`, `partner`, `coordinator` | | `RegistrationStatus` | `pending`, `approved`, `rejected`, `suspended` |

### BE Module → FE Feature Mapping

| BE Module | FE Location |
| --- | --- |
| `auth` | `services/authService`, `queries/useAuth`, `stores/authStore` |
| `farm-management` | `services/ownerService`, `schemaValidatation/farmManagement` |
| `farm-member` | `services/ownerService`, `schemaValidatation/farmMember` |
| `zone-management` | `services/zoneService`, `types/zone` |
| `zone-member-management` | `services/zoneService`, `schemaValidatation/zoneMember` |
| `doctor-profile` | `services/doctorService`, `schemaValidatation/doctorProfile` |
| `doctor-assignment` | `services/adminService` + `doctorService`, `schemaValidatation/doctorAssignment` |
| `crop-season` | `services/cropSeasonService`, `types/cropSeason` |
| `iot-device-template` | `services/iotTemplateService`, `queries/useIotTemplate`, `schemaValidatation/iotTemplate` |
| `sensor-template` | `services/iotTemplateService`, `queries/useIotTemplate`, `schemaValidatation/iotTemplate` |
| `production-milestone` | TBD |
| `employee-task` / `employee-task-template` | TBD |
| `iot-device` | TBD |
| `sensor` | TBD |

### BE Role-Based Methods

The backend exposes different service methods per role:

```
listForAdmin()   → includes soft-deleted records
listForManager() → excludes soft-deleted records
listForOwner()   → same as manager (delegates)
```

The FE should call the appropriate endpoint per logged-in role.

---

## Lint & Type Check

### Commands

```bash
# ESLint (errors + warnings)
pnpm lint

# TypeScript type check (strict: true, noUnusedLocals, noUnusedParameters)
pnpm build          # runs `tsc -b && vite build`

# Type check only (no build output)
npx tsc -b --noEmit
```

### ESLint Configuration

File: `eslint.config.js` (flat config format)

```
Extends:
  - @eslint/js recommended
  - typescript-eslint recommended
  - eslint-plugin-react-hooks recommended
  - eslint-plugin-react-refresh vite

Custom Rules:
  - @typescript-eslint/no-explicit-any: warn
  - @typescript-eslint/no-unused-vars: warn
```

### TypeScript Strict Settings

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "erasableSyntaxOnly": true,
  "verbatimModuleSyntax": true
}
```

### Pre-Commit Checklist

Before pushing code:

1. `pnpm lint` — fix all **errors** (warnings are OK for now)
2. `npx tsc -b --noEmit` — zero type errors
3. No unused imports or variables (TS strict catches these)
4. All new schemas match BE API contract

---

## shadcn/ui Components

### Installed Components (25)

accordion, avatar, badge, breadcrumb, button, calendar, card, confirm-dialog, dialog, dropdown-menu, field, input-group, input, label, pagination, popover, select, separator, sheet, sidebar, skeleton, sonner, table, textarea, tooltip

### Adding a New Component

```bash
npx shadcn@latest add [component-name]
# Example:
npx shadcn@latest add checkbox
npx shadcn@latest add switch
npx shadcn@latest add tabs
```

### Configuration

File: `components.json`

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## Environment Variables

| Variable       | Description          | Example                 |
| -------------- | -------------------- | ----------------------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |

All env vars must be prefixed with `VITE_` to be accessible in client code via `import.meta.env`.

---

## Commands Reference

```bash
# Development
pnpm dev                    # Start Vite dev server (HMR)
pnpm build                  # Type check + production build
pnpm preview                # Preview production build locally

# Validation
pnpm lint                   # ESLint check
npx tsc -b --noEmit         # Type check only (no output)

# shadcn/ui
npx shadcn@latest add [name]    # Add a new UI component

# Dependencies
pnpm add [package]              # Add production dependency
pnpm add -D [package]           # Add dev dependency
```

---

## Animation Patterns

The project uses two animation approaches: **Tailwind CSS transitions** for dashboard panels, and **Framer Motion** for the marketing/home page.

### Page Entry Animation

All dashboard pages use Tailwind's `animate-in` utility for a subtle fade-in on mount:

```tsx
// Every dashboard page root element:
<div className="space-y-6 animate-in fade-in duration-300">
  {/* Page content */}
</div>
```

Used in: `FarmManagement.tsx`, `OwnerZonePage.tsx`, `OwnerFarmMemberPage.tsx`, `AdminFarmsPage.tsx`, `ZoneListView.tsx`.

### Panel Slide-In/Out Pattern (Owner Dashboard)

All detail/create/edit panels use a **consistent slide-in animation** with `requestAnimationFrame` for the enter and `setTimeout` for the exit. This is the **standard pattern** — copy it exactly for new panels.

```tsx
import { useEffect, useState } from "react";

// 1. State for animation visibility
const [show, setShow] = useState(false);

// 2. Trigger enter animation on mount (next frame)
useEffect(() => {
  const frame = requestAnimationFrame(() => setShow(true));
  return () => cancelAnimationFrame(frame);
}, []);

// 3. Exit: hide first, then navigate after CSS transition completes
const handleBack = () => {
  setShow(false);
  setTimeout(onBack, 300); // 300ms matches duration-300
};

// 4. Wrapper div with conditional classes
<div
  className={`space-y-6 transition-all duration-300 ease-out ${
    show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  }`}
>
  {/* Panel content */}
</div>;
```

**How it works:**

| Phase | `show` | CSS Classes Applied | Visual Result |
| --- | --- | --- | --- |
| Mount | false | `opacity-0 translate-y-4` | Hidden, shifted down 16px |
| Enter | true | `opacity-100 translate-y-0` | Fades in + slides up |
| Exit | false | `opacity-0 translate-y-4` | Fades out + slides down |
| Unmount | — | `setTimeout(onBack, 300)` fires | Parent removes component |

**Files using this pattern** (13 panels):

- `ZoneDetailPanel.tsx`, `CreateZonePanel.tsx`, `EditZonePanel.tsx`
- `AssignManagerPanel.tsx`, `AssignBulkManagerPanel.tsx`
- `AddMemberPanel.tsx`, `MemberDetailPanel.tsx`
- `CreateFarmForm.tsx`, `UpdateFarmForm.tsx`
- `CropSeasonListPanel.tsx`, `CropSeasonDetailPanel.tsx`
- `ProductionRequestDetailPanel.tsx`
- `AdminFarmDetailPanel.tsx`

### When to Use Which Pattern

| Scenario                         | Pattern                           |
| -------------------------------- | --------------------------------- |
| Dashboard page root              | `animate-in fade-in duration-300` |
| Panel that replaces current view | `show` state + `transition-all`   |
| Marketing/landing page sections  | Framer Motion `whileInView`       |
| Carousel / slide transitions     | Framer Motion `AnimatePresence`   |

### Framer Motion (HomePage Only)

Used exclusively in `src/pages/HomePage/components/` for scroll-triggered and looping animations.

**Scroll-triggered entry:**

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  {/* Content animates when scrolled into view */}
</motion.div>;
```

**Staggered children:**

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  <motion.div variants={itemVariants}>{/* Child 1 */}</motion.div>
  <motion.div variants={itemVariants}>{/* Child 2 */}</motion.div>
</motion.div>;
```

**Carousel with `AnimatePresence`:**

```tsx
import { motion, AnimatePresence } from "framer-motion";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
};

<AnimatePresence
  mode="wait"
  custom={direction}
>
  <motion.div
    key={activeIndex}
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.5, ease: "easeInOut" as const }}
  >
    {/* Slide content */}
  </motion.div>
</AnimatePresence>;
```

---

## Quick Reference Cheatsheet

### Import Aliases

```tsx
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/axios";
import { API_ENDPOINTS, QUERY_KEYS } from "@/constants";
import { cn } from "@/lib/utils";
```

### Toast Notifications

```tsx
import { toast } from "sonner";

toast.success("Operation successful!");
toast.error("Something went wrong");
toast.info("Information message");
```

### Navigation

```tsx
import { useNavigate } from "react-router";

const navigate = useNavigate();
navigate("/dashboard/admin/farms");
navigate(-1); // Go back
```

### Error Handling

```tsx
import { getErrorMessage } from "@/lib/queryClient";
import { isApiErrorResponse } from "@/lib/utils";

// In mutation onError:
onError: (error) => {
  toast.error(getErrorMessage(error));
};

// For form field errors (422):
if (isApiErrorUnprocessableEntityResponse(error)) {
  const fieldErrors = error.response.data.errors;
  fieldErrors.forEach(({ field, message }) => {
    form.setError(field, { message });
  });
}
```

### Conditional Rendering Patterns

```tsx
// Loading
if (isLoading) return <TableSkeleton />;

// Error
if (error) return <p className="text-destructive">{getErrorMessage(error)}</p>;

// Empty state
if (!data?.data.length)
  return <p className="text-muted-foreground">No data found.</p>;
```

### Pagination Pattern

```tsx
const [page, setPage] = useState(1);
const limit = 10;
const { data } = useExampleList({ page, limit });

// Render pagination
<ProPagination
  currentPage={page}
  totalPages={data?.data.meta.totalPages ?? 1}
  buildHref={(p) => `?page=${p}`}
/>;
```
