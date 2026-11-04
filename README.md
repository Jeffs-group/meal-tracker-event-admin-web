# Jeffs Group – Meal Tracker (Catering Organization Admin)

A production-grade, enterprise-ready React application for the **Jeffs Group – Meal Tracker** admin portal (Registrations module), built with modern frontend architecture patterns, strict TypeScript typing, modular state management, accessible UI components, and a centralized design system.

---

## 1. Technology Stack

- **Core & Runtime**: React 18 (`react`, `react-dom`) + TypeScript (Strict Mode)
- **Bundler & Tooling**: Vite 6
- **Styling & Design Tokens**: Tailwind CSS with custom Jeffs Group tokens (Mustard/Gold `#C9A227`, near-black `#111111`, off-white `#F8F9FA`)
- **Routing**: React Router DOM v6 with lazy-loaded route splitting
- **Server State & Caching**: TanStack React Query v5 + DevTools
- **Client State**: Zustand v5 with `persist` middleware
- **Forms & Schema Validation**: React Hook Form + Zod + `@hookform/resolvers`
- **HTTP & Mock Client**: Axios with centralized error normalization and switchable mock layer (`VITE_USE_MOCK`)
- **Icons**: Lucide React
- **Code Quality**: ESLint 9 (Flat Config) + Prettier + `prettier-plugin-tailwindcss`

---

## 2. Implemented Screens (Registrations Module)

1. **Dashboard (`/dashboard`)**:
   - 4 Top stat cards (Total Registrations, Pending Approvals, Approved Registrations, Active Teams).
   - **Registration Overview**: Custom SVG donut chart (Approved / Pending / Rejected) with center total count and legend.
   - **Capacity & Intake Breakdown**: Progress bars for Team Registrations vs. Max Cap and Staff Registrations, plus Daily Intake Avg and Verification Rate.
   - **Recent Registrations**: Table showing latest 5 submissions across teams, staff, and organizers with quick Review action.
   - **Team Overview**: Summary table of all franchise teams with roster metrics and direct "View Team" links.

2. **Registrations Page (`/registrations`)**:
   - Tab container with live count badges stored in URL search query (`?tab=teams | staffs | organizers`).
   - Header with "Export CSV" and "Add Manually" triggers.
   - **Teams Tab**: Catering & access rule banner, league & status filters, franchise roster counts (Approved, Pending, Rejected), Active/Inactive toggle.
   - **Staffs Tab**: 4 operational stat cards with percentage progress bars, operational roster table, individual meal-eligibility toggle, batch actions bar, and server-style pagination.
   - **Organizers Tab**: Mirrored operational roster tailored for tournament committee heads and governing council members.

3. **Team Member Management (`/registrations/teams/:teamId`)**:
   - Dedicated team detail view (e.g., Chennai Kings).
   - **Team Header**: Logo badge, franchise ID, league badge, active status pill, and "Deactivate Team" / "+ Add Member" buttons.
   - Confirmation dialog before deactivating/activating team explaining business rule impact on meal access.
   - 4 Team delegation stat cards (Total with Max Cap progress, Approved %, Pending Requires Action, Rejected %).
   - Member filter tabs: `All`, `Player`, `Owner`, `Coach`, `Others` with dynamic counts.
   - Full data table with search, status filter, sort filter, checkbox row & select-all, and CSV export.

4. **Registrant Review Modal**:
   - Opens from any "Details" / Eye action button.
   - Application ID, submitted date/time in IST, and verification status.
   - Applicant photo card with file metadata (filename, file size, dimensions).
   - 6-cell Profile verification attributes grid (Franchise & Division, Registrant Type, Contact Number, Email Address, Meal Preference, Date of Birth).
   - **Post-Approval Dispatch Sequence**: Dynamic explanation of automated meal QR code issuance, checking team active state in real time.
   - Action footer with "Reject Registration" (requiring rejection reason) and "Approve Registration" with loading states.

5. **Meal Eligibility Rule Enforcement**:
   - **Rule**: Meal eligibility requires `status === 'APPROVED'` **AND** team `status === 'ACTIVE'`.
   - If a registrant is Pending or Rejected, toggle is disabled with a descriptive tooltip.
   - If a franchise team is deactivated, meal access is suspended immediately for all members without revoking their approved verification state.

---

## 3. Folder Architecture

```text
src/
├── api/
│   ├── axiosInstance.ts          # Base Axios client with auth interceptors
│   ├── endpoints.ts              # Centralized API endpoints
│   ├── dashboard.api.ts          # Dashboard summary API
│   ├── registrations.api.ts      # Teams, Staff, Organizers & review mutations
│   ├── teams.api.ts              # Team detail, members, status toggle
│   ├── mock/
│   │   ├── mockData.ts           # Realistic tournament dataset
│   │   └── mockHandlers.ts       # In-memory handlers with dynamic count calculations
│   └── index.ts
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         # Responsive layout shell
│   │   ├── Sidebar.tsx           # Near-black sidebar with gold active items
│   │   ├── Topbar.tsx            # Date chip, Season 2026 Live badge, user profile
│   │   ├── PageHeader.tsx        # Title, description, breadcrumbs, actions
│   │   └── Breadcrumbs.tsx       # Hierarchical navigation trail
│   ├── ui/                       # Design system foundation
│   │   ├── Button.tsx            # Gold primary, outline, destructive, ghost
│   │   ├── StatusPill.tsx        # Approved, Pending, Rejected, Active, Inactive pills
│   │   ├── Toggle.tsx            # Accessible switch with tooltip
│   │   ├── Tabs.tsx              # Underline & pill tabs with count badges
│   │   ├── StatCard.tsx          # Metric cards with trend and progress bar
│   │   ├── ProgressBar.tsx       # Colored progress bars
│   │   ├── SearchInput.tsx       # Debounced search input
│   │   ├── Select.tsx            # Dropdown filter select
│   │   ├── DataTable.tsx         # Reusable generic data table with skeleton & select-all
│   │   ├── Pagination.tsx        # Server-style pagination
│   │   ├── Modal.tsx             # Accessible dialog with backdrop and ESC support
│   │   ├── Avatar.tsx            # Initials & image avatar
│   │   ├── EmptyState.tsx        # Empty table fallback
│   │   └── Skeleton.tsx          # Pulse skeleton loader
│   ├── dashboard/                # RegistrationDonut, BreakdownBars, Tables
│   ├── registrations/            # RegistrantReviewModal, MealEligibilityToggle, BatchActionsMenu
│   └── teams/                    # TeamHeader, MemberTypeTabs, TeamMembersTable
├── hooks/
│   ├── useDashboard.ts           # Query for dashboard summary
│   ├── useRegistrations.ts       # Queries for teams, staff, organizers, registrant detail
│   ├── useTeamMembers.ts         # Queries for team detail, members, status mutation
│   ├── useRegistrantActions.ts   # Approve/Reject mutations with query invalidations
│   ├── useTableFilters.ts        # URL query-params synchronized filter state
│   └── useDebounce.ts            # Debouncing utility
├── pages/
│   ├── Dashboard/DashboardPage.tsx
│   ├── Registrations/
│   │   ├── RegistrationsPage.tsx
│   │   └── tabs/ (TeamsTab, StaffsTab, OrganizersTab)
│   └── Teams/TeamMembersPage.tsx
├── routes/                       # React Router configuration
├── styles/
│   └── tokens.ts                 # Centralized design tokens (Mustard/Gold, Sidebar, Status)
├── types/                        # common.types, dashboard.types, registration.types, team.types
└── utils/                        # cn, formatDate, formatPercent, exportCsv
```

---

## 4. Switching Between Mock API and Real Backend

The project includes an in-memory mock API layer that runs with realistic delays (300-400ms).

- **Default (Mock Mode)**: Enabled by default so that all 5 screens, modals, approvals, rejections, team status toggles, and counts work out of the box.
- **Switch to Real Backend**:
  1. Open `.env` (or create one from `.env.example`).
  2. Set `VITE_USE_MOCK=false`.
  3. Set `VITE_API_BASE_URL=https://your-api.domain.com/v1`.
  4. Restart the development server.

---

## 5. Available Commands

```bash
# Start Vite development server (Port 3001)
npm run dev

# Run TypeScript type check
npm run type-check

# Run ESLint analysis
npm run lint

# Format codebase with Prettier
npm run format

# Build for production
npm run build

# Preview production build locally
npm run preview
```
