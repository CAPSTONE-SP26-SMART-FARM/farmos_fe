# FarmOS Frontend Development Guide

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components
- **Zustand** - Client state management
- **TanStack React Query v5** - Server state & data fetching
- **React Router v7** - Routing
- **Axios** - HTTP client

---

## Project Structure

```
src/
├── assets/              # Static assets (images, fonts)
├── components/
│   ├── auth/            # Auth components (ProtectedRoute, RefreshToken)
│   ├── common/          # Shared components across the app
│   ├── layout/          # Layout components
│   │   ├── DashboardLayout/
│   │   ├── MainLayout/
│   │   └── SimpleLayout/
│   └── ui/              # shadcn/ui components (DO NOT EDIT)
├── constants/           # App constants & API endpoints
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries (axios, queryClient)
├── pages/               # Page components
│   ├── HomePage/
│   │   ├── HomePage.tsx
│   │   └── components/  # Components ONLY for HomePage
│   ├── LoginPage/
│   └── Dashboard/
├── routes/              # Route configuration
├── services/            # API service functions
├── stores/              # Zustand stores
└── types/               # TypeScript type definitions
```

---

## Component Organization Rules

### 1. Page-Specific Components

Components inside a page folder are **only for that page**.

```
src/pages/HomePage/
├── HomePage.tsx           # Main page component
└── components/
    ├── HeroSection.tsx    # Only used in HomePage
    ├── FeatureCard.tsx    # Only used in HomePage
    └── CTABanner.tsx      # Only used in HomePage
```

**Usage in HomePage.tsx:**

```tsx
import HeroSection from "./components/HeroSection";
import FeatureCard from "./components/FeatureCard";

function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeatureCard />
    </div>
  );
}
```

### 2. Shared Components

If a component is used in **2+ pages**, move it to `src/components/common/`.

```
src/components/common/
├── DataTable.tsx         # Used in multiple pages
├── StatCard.tsx          # Used in multiple dashboards
└── LoadingSpinner.tsx    # Used everywhere
```

### 3. UI Components (shadcn/ui)

Located in `src/components/ui/`. **Do not edit these files directly.**

To add new shadcn components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
```

---

## Creating a New Page

### Step 1: Create Page Folder

```
src/pages/SensorDashboard/
├── SensorDashboard.tsx
└── components/
    ├── SensorChart.tsx
    └── SensorCard.tsx
```

### Step 2: Create Page Component

```tsx
// src/pages/SensorDashboard/SensorDashboard.tsx

function SensorDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Sensor Dashboard</h1>
      {/* Page content */}
    </div>
  );
}

export default SensorDashboard;
```

### Step 3: Add Route

```tsx
// src/routes/routes.ts

import SensorDashboard from "@/pages/SensorDashboard/SensorDashboard";

// Add to the appropriate role section
{
  path: "/dashboard/farmer/sensors",
  component: SensorDashboard,
  allowedRoles: ["Farmer"],
},
```

---

## State Management

### Zustand (Client State)

For UI state, auth, preferences:

```tsx
// src/stores/exampleStore.ts
import { create } from "zustand";

interface ExampleState {
  count: number;
  increment: () => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### React Query (Server State)

For API data fetching:

```tsx
// src/hooks/useSensors.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { QUERY_KEYS } from "@/constants/endpoints";

export const useSensors = (farmId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.sensors.list(farmId),
    queryFn: () => api.get(`/sensors?farmId=${farmId}`),
  });
};
```

---

## API Services

### Creating a Service

```tsx
// src/services/sensorService.ts
import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";

export const sensorService = {
  getAll: (farmId: string) =>
    api.get(`${API_ENDPOINTS.SENSORS.BASE}?farmId=${farmId}`),

  getById: (id: string) => api.get(API_ENDPOINTS.SENSORS.BY_ID(id)),

  getData: (id: string) => api.get(API_ENDPOINTS.SENSORS.DATA(id)),
};
```

### Using in Components

```tsx
import { useQuery } from "@tanstack/react-query";
import { sensorService } from "@/services/sensorService";
import { QUERY_KEYS } from "@/constants/endpoints";

function SensorList({ farmId }: { farmId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.sensors.list(farmId),
    queryFn: () => sensorService.getAll(farmId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading sensors</div>;

  return (
    <ul>
      {data?.map((sensor) => (
        <li key={sensor.id}>{sensor.name}</li>
      ))}
    </ul>
  );
}
```

---

## Role-Based Access

### Routes Configuration

Each role has its own dashboard path:

| Role    | Base Path            |
| ------- | -------------------- |
| Owner   | `/dashboard/owner`   |
| Manager | `/dashboard/manager` |
| Farmer  | `/dashboard/farmer`  |
| Rancher | `/dashboard/rancher` |
| Doctor  | `/dashboard/doctor`  |

### Protected Routes

```tsx
// In routes.ts
{
  path: "/dashboard/farmer/sensors",
  component: SensorDashboard,
  allowedRoles: ["Farmer", "Manager"], // Multiple roles allowed
},
```

---

## Styling Guidelines

### Use Tailwind Classes

```tsx
// ✅ Good
<div className="flex items-center gap-4 p-4 bg-card rounded-lg">

// ❌ Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### Use shadcn/ui Components

```tsx
// ✅ Use shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Sensor Data</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Refresh</Button>
  </CardContent>
</Card>;
```

---

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Add shadcn component
npx shadcn@latest add [component-name]
```

---

## File Naming Conventions

| Type       | Convention                      | Example                    |
| ---------- | ------------------------------- | -------------------------- |
| Components | PascalCase                      | `SensorCard.tsx`           |
| Hooks      | camelCase with `use` prefix     | `useSensors.ts`            |
| Services   | camelCase with `Service` suffix | `sensorService.ts`         |
| Stores     | camelCase with `Store` suffix   | `authStore.ts`             |
| Types      | PascalCase                      | `Sensor.ts` or in `types/` |
| Constants  | SCREAMING_SNAKE_CASE            | `API_ENDPOINTS`            |

---

## Quick Reference

### Import Aliases

```tsx
import { Button } from "@/components/ui/button"; // @/ = src/
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/axios";
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
navigate("/dashboard/farmer");
navigate(-1); // Go back
```
