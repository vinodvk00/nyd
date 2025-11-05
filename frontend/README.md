# Time Tracking Analytics Dashboard

A modern Next.js 16 dashboard for visualizing time tracking analytics with beautiful charts and interactive UI components.

## Overview

This frontend application provides an intuitive analytics dashboard for time tracking data fetched from the backend API. It combines Shadcn/ui for general-purpose components with Tremor React for data visualization, creating a seamless and responsive user experience.

**Key Features:**
- Interactive analytics dashboard with 6 visualization types
- Real-time data synchronization with SWR
- Dark mode support with next-themes
- Responsive design for all screen sizes
- Smooth animations with Framer Motion
- Modern UI with Shadcn/ui components
- Advanced charts with Tremor React

## Design System

### UI Philosophy

The dashboard follows a clean, modern design approach with:
- **Clarity First:** Data should be easy to read and understand
- **Consistent Spacing:** Uniform padding and margins throughout
- **Visual Hierarchy:** Clear distinction between primary and secondary information
- **Accessibility:** WCAG 2.1 compliant color contrasts and keyboard navigation

### Component Library Strategy

This project uses **two complementary component libraries**:

#### **Shadcn/ui** - General Purpose UI
Use for structural and interactive elements:
- Layout containers (Card, Tabs)
- Form controls (Button, Select, Calendar)
- Navigation elements (Dropdown Menu)
- Status indicators (Badge)
- Loading states (Skeleton)

#### **Tremor React** - Data Visualization
Use for analytics and metrics:
- Charts (Area, Bar, Line, Donut)
- KPI displays (Metric, Text)
- Trend indicators (BadgeDelta)
- Data lists (BarList)

### Color Scheme & Theming

**Base Palette:** Neutral (gray scale)

The application uses CSS variables for theming, defined in `app/globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* ... additional theme variables */
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark mode overrides */
}
```

**Tremor Chart Colors:** Blue, emerald, violet, amber (configurable per chart)

### Typography

- **Headings:** Default Next.js font (Geist Sans)
- **Body:** Default Next.js font
- **Monospace:** Geist Mono (for code/numbers if needed)

## Tech Stack

### Core Framework
- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety

### Styling & Design
- **TailwindCSS v4** - Utility-first CSS framework
- **@tailwindcss/postcss** - PostCSS integration
- **CSS Variables** - Dynamic theming

### UI Components

**Shadcn/ui (v2 - New York Style)**
- Installation: Copy-paste components (not an npm dependency)
- Components: Card, Button, Tabs, Select, Badge, Calendar, Dropdown Menu, Skeleton

**Tremor React v3.18.7**
- Installation: `npm install @tremor/react`
- Components: AreaChart, BarChart, LineChart, DonutChart, BarList, Metric, Text, BadgeDelta

### State & Data Fetching
- **SWR 2.3.6** - Data fetching and caching with automatic revalidation
- **React Hooks** - Local state management

### Additional Libraries
- **next-themes 0.4.6** - Dark mode support
- **framer-motion 12.23.24** - Smooth animations and transitions
- **date-fns 4.1.0** - Date manipulation and formatting
- **lucide-react 0.552.0** - Icon library
- **clsx & tailwind-merge** - Conditional styling utilities
- **class-variance-authority** - Component variant management

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18.x or higher
- **Backend API** running at `http://localhost:3000` (or configured URL)

## Installation & Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

**Note:** The project uses `.npmrc` with `legacy-peer-deps=true` to handle React 19 compatibility with Tremor (which officially supports React 18 but works fine with React 19).

### 3. Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important:** All client-side environment variables must start with `NEXT_PUBLIC_` prefix.

### 4. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3001` (or the next available port if 3001 is in use).

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Run production server (requires build first) |
| `npm run lint` | Run ESLint to check code quality |

### Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles + Tailwind + theme variables
│   └── favicon.ico              # App icon
├── components/
│   └── ui/                      # Shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       ├── select.tsx
│       ├── skeleton.tsx
│       └── tabs.tsx
├── lib/
│   └── utils.ts                 # Utility functions (cn helper)
├── public/                      # Static assets
├── .env.local                   # Environment variables (not committed)
├── .npmrc                       # NPM configuration
├── components.json              # Shadcn configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Dependencies
├── postcss.config.mjs           # PostCSS configuration
├── tailwind.config.ts           # TailwindCSS configuration (if exists)
└── tsconfig.json                # TypeScript configuration
```

### Adding Shadcn Components

To add new Shadcn/ui components to the project:

```bash
npx shadcn@latest add <component-name> -y --overwrite
```

Examples:
```bash
npx shadcn@latest add dialog -y --overwrite
npx shadcn@latest add tooltip -y --overwrite
npx shadcn@latest add input -y --overwrite
```

The `.npmrc` file ensures installation works despite React 19/18 peer dependency warnings.

### Installing Additional Packages

Always use standard npm commands (don't add `--legacy-peer-deps` manually as it's configured in `.npmrc`):

```bash
npm install <package-name>
```

## Component Architecture

### Server vs Client Components

Next.js 16 uses React Server Components by default:

**Server Components (default):**
- Can fetch data directly
- Reduce client-side JavaScript
- Better SEO and initial load performance
- Cannot use hooks or browser APIs

**Client Components:**
- Add `"use client"` directive at top of file
- Required for interactivity (onClick, useState, etc.)
- Required for Tremor charts
- Required for hooks like SWR

### Example: Dashboard Component

```tsx
// app/dashboard/page.tsx (Server Component)
import { ActivityChart } from "./components/activity-chart"

export default async function DashboardPage() {
  // Can fetch data directly in server components
  const data = await fetch('http://localhost:3000/tracks/stats/by-date')
    .then(res => res.json())

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      <ActivityChart data={data} />
    </div>
  )
}
```

```tsx
// app/dashboard/components/activity-chart.tsx (Client Component)
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AreaChart } from "@tremor/react"

interface ActivityChartProps {
  data: {
    date: string
    totalHours: number
    sessionCount: number
  }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <AreaChart
          data={data}
          index="date"
          categories={["totalHours"]}
          colors={["blue"]}
          className="h-72"
        />
      </CardContent>
    </Card>
  )
}
```

### Using SWR for Data Fetching

SWR provides automatic revalidation, caching, and real-time updates:

```tsx
"use client"

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function SummaryStats() {
  const { data, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/tracks/stats/summary?period=week`,
    fetcher,
    {
      refreshInterval: 30000, // Revalidate every 30 seconds
    }
  )

  if (isLoading) return <Skeleton className="h-32" />
  if (error) return <div>Failed to load data</div>

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <Metric>{data.totalHours}</Metric>
          <Text>Total Hours</Text>
        </CardContent>
      </Card>
      {/* More metrics... */}
    </div>
  )
}
```

## UI Components Reference

### When to Use Shadcn Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Card | Container for content sections | Dashboard widgets, stat cards |
| Button | Interactive actions | Submit forms, trigger actions |
| Tabs | Multiple views in same space | Switch between time periods |
| Select | Dropdown selection | Choose date range, project filter |
| Badge | Status indicators | Active/inactive, tags |
| Calendar | Date picking | Select custom date ranges |
| Dropdown Menu | Contextual actions | Settings, export options |
| Skeleton | Loading placeholders | While fetching data |

### When to Use Tremor Components

| Component | Use Case | Example |
|-----------|----------|---------|
| Metric | Display large KPI numbers | Total hours, session count |
| Text | Small labels/descriptions | Chart axes, metric labels |
| BadgeDelta | Show trends | +12.3% increase in hours |
| AreaChart | Timeline visualization | Activity over time |
| BarChart | Compare categories | Hours per project |
| LineChart | Trend analysis | Sessions over weeks |
| DonutChart | Proportions/percentages | Project time distribution |
| BarList | Ranked data | Top 10 projects |

### Combining Shadcn + Tremor

Best practice is to wrap Tremor visualizations in Shadcn containers:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Metric, BadgeDelta } from "@tremor/react"

export function ProjectBreakdown({ data }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Breakdown</CardTitle>
          <BadgeDelta deltaType="increase">+8.2%</BadgeDelta>
        </div>
      </CardHeader>
      <CardContent>
        <BarChart
          data={data}
          index="projectName"
          categories={["totalHours"]}
          colors={["emerald"]}
          className="mt-4 h-80"
        />
      </CardContent>
    </Card>
  )
}
```

## Styling Guidelines

### Using TailwindCSS

Both Shadcn and Tremor components accept Tailwind utility classes:

```tsx
<Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
  <AreaChart className="h-72 mt-4" data={data} />
</Card>
```

### Common Utility Patterns

```tsx
// Layout
className="container mx-auto p-6"              // Centered container with padding
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"  // Responsive grid

// Spacing
className="mt-4 mb-6 p-4"                      // Margin top, bottom, padding all sides
className="space-y-4"                          // Vertical spacing between children

// Flexbox
className="flex items-center justify-between"  // Horizontal with space between
className="flex flex-col gap-2"                // Vertical with gap

// Responsive
className="hidden md:block"                    // Hide on mobile, show on tablet+
className="text-sm md:text-base lg:text-lg"   // Responsive text size

// Dark mode
className="bg-white dark:bg-gray-900"          // Light/dark background
className="text-gray-900 dark:text-white"      // Light/dark text
```

### Using the `cn` Utility

The `cn` utility from `lib/utils.ts` merges Tailwind classes intelligently:

```tsx
import { cn } from "@/lib/utils"

<Card className={cn(
  "shadow-lg",
  isHighlighted && "border-2 border-blue-500",
  isLoading && "opacity-50"
)}>
```

## Data Fetching Patterns

### Pattern 1: Server Component (Recommended for Static Data)

```tsx
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracks/stats/summary`, {
    cache: 'no-store' // Disable caching for dynamic data
  })
  const stats = await res.json()

  return <SummaryCards stats={stats} />
}
```

### Pattern 2: Client Component with SWR (Recommended for Real-time Data)

```tsx
"use client"

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function LiveStats() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/tracks/stats/summary',
    fetcher,
    { refreshInterval: 10000 } // Auto-refresh every 10s
  )

  return (
    <div>
      {isLoading && <Skeleton />}
      {error && <ErrorMessage />}
      {data && <StatsDisplay data={data} />}
    </div>
  )
}
```

### Pattern 3: Custom Hook

```tsx
// lib/hooks/use-analytics.ts
"use client"

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useAnalytics(endpoint: string, params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}${queryString}`

  return useSWR(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })
}

// Usage:
const { data, error, isLoading } = useAnalytics('/tracks/stats/summary', { period: 'week' })
```

## TypeScript Integration

### Creating Type Definitions

Create types matching backend API responses:

```typescript
// types/analytics.ts

export interface SummaryStats {
  totalHours: number
  totalSessions: number
  averageSessionDuration: number
  activeProjects: number
  period: 'today' | 'week' | 'month' | 'all'
}

export interface ProjectBreakdown {
  data: {
    projectName: string
    totalHours: number
    sessionCount: number
    percentage: number
  }[]
  totalHours: number
}

export interface ActivityData {
  data: {
    date: string
    totalHours: number
    sessionCount: number
  }[]
  groupBy: 'day' | 'week' | 'month'
}

export interface HourlyPattern {
  data: {
    hour: number
    totalHours: number
    sessionCount: number
  }[]
}

export interface TrendData {
  current: {
    value: number
    startDate: string
    endDate: string
  }
  previous: {
    value: number
    startDate: string
    endDate: string
  }
  change: {
    absolute: number
    percentage: number
  }
  metric: 'hours' | 'sessions'
  period: 'week' | 'month'
}

export interface TopProjects {
  data: {
    projectName: string
    totalHours: number
    sessionCount: number
    rank: number
  }[]
  limit: number
  period: string
}
```

### Using Types in Components

```tsx
import type { SummaryStats } from '@/types/analytics'

interface SummaryCardsProps {
  stats: SummaryStats
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent>
          <Metric>{stats.totalHours}</Metric>
          <Text>Total Hours</Text>
        </CardContent>
      </Card>
      {/* More cards... */}
    </div>
  )
}
```

## File Naming Conventions

- **Components:** PascalCase - `ActivityChart.tsx`, `SummaryCards.tsx`
- **Utilities:** kebab-case - `date-utils.ts`, `format-helpers.ts`
- **Hooks:** kebab-case with "use" prefix - `use-analytics.ts`, `use-summary-stats.ts`
- **Types:** kebab-case - `analytics.ts`, `api-types.ts`
- **Routes:** lowercase - `app/dashboard/page.tsx`, `app/settings/page.tsx`

## Troubleshooting

### Package Installation Fails with Peer Dependency Errors

**Error:** `ERESOLVE unable to resolve dependency tree`

**Solution:**
- Verify `.npmrc` exists in frontend directory with `legacy-peer-deps=true`
- If missing, create it: `echo "legacy-peer-deps=true" > .npmrc`
- Run `npm install` again

### Shadcn Component Import Fails

**Error:** `Module not found: Can't resolve '@/components/ui/card'`

**Solution:**
- Verify component was installed: `npx shadcn@latest add card -y`
- Check `tsconfig.json` has path aliases configured:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
  ```

### Tremor Chart Not Rendering

**Issue:** Chart component doesn't display

**Solution:**
- Ensure component has `"use client"` directive at the top
- Verify data format matches Tremor's expected structure
- Check browser console for errors

### API Requests Fail with CORS Error

**Error:** `Access to fetch has been blocked by CORS policy`

**Solution:**
- Configure CORS in backend `main.ts`:
  ```typescript
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  })
  ```
- Restart backend server after changes

### Dark Mode Not Working

**Issue:** Theme toggle doesn't change colors

**Solution:**
- Verify `next-themes` provider is in root layout
- Check CSS variables are defined for both `:root` and `.dark` in `globals.css`
- Ensure components use theme-aware Tailwind classes (e.g., `dark:bg-gray-900`)

### Build Fails with Type Errors

**Error:** `Type 'X' is not assignable to type 'Y'`

**Solution:**
- Check TypeScript interfaces match backend API response shapes
- Run `npm run lint` to identify issues
- Ensure all props are typed in component interfaces

## Performance Optimization

### Best Practices

1. **Use Server Components by default** - Only add `"use client"` when necessary
2. **Implement SWR caching** - Reduce unnecessary API calls
3. **Lazy load charts** - Use dynamic imports for heavy components:
   ```tsx
   const HeavyChart = dynamic(() => import('./components/heavy-chart'), {
     loading: () => <Skeleton className="h-96" />
   })
   ```
4. **Optimize images** - Use Next.js `<Image>` component
5. **Minimize client-side JavaScript** - Keep interactive components small

### SWR Configuration for Performance

```tsx
import { SWRConfig } from 'swr'

export default function RootLayout({ children }) {
  return (
    <SWRConfig value={{
      refreshInterval: 30000,          // Auto-refresh every 30s
      revalidateOnFocus: true,         // Revalidate when window regains focus
      dedupingInterval: 2000,          // Dedupe requests within 2s
      shouldRetryOnError: true,        // Retry on error
      errorRetryCount: 3,              // Max 3 retries
    }}>
      {children}
    </SWRConfig>
  )
}
```

## Related Documentation

- **Backend API:** `../backend/README.md` - Complete API endpoint documentation
- **Next.js Documentation:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **Tremor Documentation:** [https://tremor.so/docs](https://tremor.so/docs)
- **Shadcn/ui Documentation:** [https://ui.shadcn.com](https://ui.shadcn.com)


---

## License

UNLICENSED - Private project
