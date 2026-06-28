# SafeSphere AI

**Enterprise Safety Intelligence Platform** — Built for the ET AI Hackathon 2026.

SafeSphere AI is a production-ready, enterprise-grade SaaS platform for
monitoring workplace safety across industrial facilities. It provides real-time
visibility into workers, sensors, machines, work permits, and incidents through
a premium, glassmorphic dashboard inspired by Palantir, Datadog, and Microsoft
Fabric.

## Tech Stack

### Frontend
- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS** with a custom dark design system
- **shadcn/ui** component library
- **Framer Motion** for animations
- **React Hook Form** + **Zod** for form validation
- **TanStack React Query** for data fetching
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Supabase** (PostgreSQL, Auth, Realtime, Storage)
- Row Level Security (RLS) on all tables
- Three user roles: Admin, Safety Officer, Supervisor

### Deployment
- Vercel-ready configuration

## Features

### Authentication
- Login, Signup, Forgot Password, Reset Password flows
- Supabase Auth with email/password
- Protected routes via middleware
- Role-based access (Admin, Safety Officer, Supervisor)

### Layout
- Responsive sidebar with 9 navigation sections
- Top navigation with global search
- Notification panel with recent alerts
- Profile dropdown with role badge
- Dark/Light mode toggle
- Mobile-responsive navigation

### Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Stat cards, safety score, trend charts, activity feed, recent alerts & incidents, sensor overview |
| **Workers** | Workforce management with search, status/department filters, pagination |
| **Sensors** | Real-time sensor readings with status filter and pagination |
| **Machines** | Equipment tracking with status/type filters and maintenance schedules |
| **Permits** | Work permit management with type/status filters and hazard badges |
| **Incidents** | Incident tracking with severity/status filters and injury/damage metrics |
| **Analytics** | Tabbed analytics: incidents, departments, sensors, permits with multiple chart types |
| **Reports** | Report generation and management with status tracking |
| **Settings** | Profile, notifications, security, and appearance configuration |

Every data page includes:
- Search functionality
- Filter dropdowns
- Sortable columns
- Pagination
- Empty states
- Loading skeletons
- Responsive layout

### Reusable Components
- `DataTable` — Generic table with search, sort, filter, pagination
- `StatCard` — Metric card with trend indicators
- `ChartCard` — Chart container with title and description
- `PageHeader` — Consistent page header with icon and actions
- `StatusBadge` — Color-coded status indicators
- `EmptyState` — Empty state placeholder
- `LoadingState` — Loading skeletons
- `FilterSelect` — Reusable filter dropdown

## Database Schema

The platform uses 9 tables with full RLS policies:

| Table | Records | Description |
|-------|---------|-------------|
| `profiles` | — | User accounts linked to Supabase Auth |
| `departments` | 8 | Organizational units |
| `workers` | 100 | Frontline workforce records |
| `machines` | 200 | Industrial equipment |
| `sensor_data` | 1000 | Time-series sensor readings (500 sensors) |
| `alerts` | 60 | Safety alerts with severity levels |
| `permits` | 50 | Work permits with approval workflow |
| `incidents` | 100 | Safety incidents with investigation tracking |
| `reports` | — | Generated safety reports (owner-scoped) |

### Security
- RLS enabled on all tables
- `authenticated`-scoped policies
- Owner-scoped `profiles` and `reports` tables
- `auth.uid()` for ownership checks
- Separate CRUD policies per table (no `FOR ALL`)

## Getting Started

The Supabase project is pre-provisioned. Environment variables are in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you will be redirected to the login page.

Create an account via the signup page, then access the dashboard.

## Project Structure

```
├── app/
│   ├── (auth)/              # Auth route group
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── layout.tsx       # Split-screen auth layout
│   ├── (app)/               # Authenticated app route group
│   │   ├── dashboard/
│   │   ├── workers/
│   │   ├── sensors/
│   │   ├── machines/
│   │   ├── permits/
│   │   ├── incidents/
│   │   ├── analytics/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── layout.tsx       # App shell with sidebar + topnav
│   ├── globals.css          # Dark design system
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Redirects to /dashboard
├── components/
│   ├── layout/              # Sidebar, TopNav, AppShell
│   ├── shared/              # DataTable, StatCard, ChartCard, etc.
│   ├── ui/                  # shadcn/ui primitives
│   ├── providers.tsx        # React Query + Theme + Auth providers
│   └── theme-provider.tsx
├── hooks/
│   ├── use-auth.tsx         # Auth context with Supabase session
│   └── use-supabase-query.ts # React Query hook for Supabase
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser Supabase client
│   │   ├── server.ts        # Server Supabase client
│   │   └── admin.ts         # Service role client
│   ├── navigation.ts        # Sidebar nav config
│   └── utils.ts             # cn() utility
├── types/
│   └── database.ts          # Full TypeScript schema types
└── middleware.ts            # Route protection
```

## Design System

The platform uses a premium dark theme with glassmorphism:

- **Background**: Deep navy (`hsl(222 47% 6%)`)
- **Primary**: Electric blue (`hsl(199 89% 52%)`)
- **Accent colors**: Success (green), Warning (amber), Destructive (red)
- **Glassmorphism**: `backdrop-blur` with semi-transparent backgrounds
- **Grid background**: Subtle grid pattern on auth screens
- **Glow effects**: Primary-colored box shadows for emphasis
- **Smooth transitions**: 300ms transitions on interactive elements

## License

© 2026 SafeSphere AI — ET AI Hackathon
