import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { ROUTES } from "@/constants/routes";

const DashboardPage = lazy(() => import("@/pages/Dashboard/DashboardPage"));
const ManageTeamsPage = lazy(
  () => import("@/pages/ManageTeams/ManageTeamsPage"),
);
const RegistrationsPage = lazy(
  () => import("@/pages/Registrations/RegistrationsPage"),
);
const TeamMembersPage = lazy(() => import("@/pages/Teams/TeamMembersPage"));
const ReportsHubPage = lazy(() => import("@/pages/Reports/ReportsHubPage"));
const RegistrationReportPage = lazy(
  () => import("@/pages/Reports/RegistrationReportPage"),
);
const TeamReportPage = lazy(() => import("@/pages/Reports/TeamReportPage"));
const StaffOrganizerReportPage = lazy(
  () => import("@/pages/Reports/StaffOrganizerReportPage"),
);
const MealEligibilityReportPage = lazy(
  () => import("@/pages/Reports/MealEligibilityReportPage"),
);
const UserManagementPage = lazy(
  () => import("@/pages/UserManagement/UserManagementPage"),
);
const LoginPage = lazy(() => import("@/pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/Public/RegisterPage"));
const RegisterSuccessPage = lazy(
  () => import("@/pages/Public/RegisterSuccessPage"),
);
const RegisterClosedPage = lazy(
  () => import("@/pages/Public/RegisterClosedPage"),
);
const NotFoundPage = lazy(() => import("@/routes/NotFound"));
import { RequirePermission } from "@/components/common/RequirePermission";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicLayout } from "@/components/public/PublicLayout";
import { DomainRouteGuard } from "@/routes/DomainRouteGuard";

export const routes: RouteObject[] = [
  {
    element: <DomainRouteGuard />,
    children: [
      {
        path: ROUTES.REGISTER,
    element: (
      <PublicLayout>
        <Suspense
          fallback={
            <LoadingIndicator fullScreen label="Loading Registration..." />
          }
        >
          <RegisterPage />
        </Suspense>
      </PublicLayout>
    ),
  },
  {
    path: ROUTES.REGISTER_SUCCESS,
    element: (
      <PublicLayout>
        <Suspense
          fallback={
            <LoadingIndicator fullScreen label="Loading Confirmation..." />
          }
        >
          <RegisterSuccessPage />
        </Suspense>
      </PublicLayout>
    ),
  },
  {
    path: ROUTES.REGISTER_CLOSED,
    element: (
      <PublicLayout>
        <Suspense fallback={<LoadingIndicator fullScreen label="Loading..." />}>
          <RegisterClosedPage />
        </Suspense>
      </PublicLayout>
    ),
  },
  {
    path: ROUTES.LOGIN,
    element: (
      <Suspense
        fallback={<LoadingIndicator fullScreen label="Loading Login..." />}
      >
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: ROUTES.ROOT,
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: "dashboard",
        element: (
          <Suspense
            fallback={
              <LoadingIndicator fullScreen label="Loading Dashboard..." />
            }
          >
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "manage-teams",
        element: (
          <Suspense
            fallback={
              <LoadingIndicator fullScreen label="Loading Manage Teams..." />
            }
          >
            <ManageTeamsPage />
          </Suspense>
        ),
      },
      {
        path: "registrations",
        element: (
          <Suspense
            fallback={
              <LoadingIndicator fullScreen label="Loading Registrations..." />
            }
          >
            <RegistrationsPage />
          </Suspense>
        ),
      },
      {
        path: "registrations/teams/:teamId",
        element: (
          <Suspense
            fallback={
              <LoadingIndicator fullScreen label="Loading Team Roster..." />
            }
          >
            <TeamMembersPage />
          </Suspense>
        ),
      },
      {
        path: "reports",
        element: (
          <RequirePermission module="reports" action="view">
            <Suspense
              fallback={
                <LoadingIndicator fullScreen label="Loading Reports Hub..." />
              }
            >
              <ReportsHubPage />
            </Suspense>
          </RequirePermission>
        ),
      },
      {
        path: "reports/registrations",
        element: (
          <RequirePermission module="reports" action="view">
            <Suspense
              fallback={
                <LoadingIndicator
                  fullScreen
                  label="Loading Registration Report..."
                />
              }
            >
              <RegistrationReportPage />
            </Suspense>
          </RequirePermission>
        ),
      },
      {
        path: "reports/teams",
        element: (
          <RequirePermission module="reports" action="view">
            <Suspense
              fallback={
                <LoadingIndicator fullScreen label="Loading Team Report..." />
              }
            >
              <TeamReportPage />
            </Suspense>
          </RequirePermission>
        ),
      },
      {
        path: "reports/staff-organizers",
        element: (
          <RequirePermission module="reports" action="view">
            <Suspense
              fallback={
                <LoadingIndicator
                  fullScreen
                  label="Loading Staff & Organizer Report..."
                />
              }
            >
              <StaffOrganizerReportPage />
            </Suspense>
          </RequirePermission>
        ),
      },
      {
        path: "reports/meal-eligibility",
        element: (
          <RequirePermission module="reports" action="view">
            <Suspense
              fallback={
                <LoadingIndicator
                  fullScreen
                  label="Loading Meal Eligibility Report..."
                />
              }
            >
              <MealEligibilityReportPage />
            </Suspense>
          </RequirePermission>
        ),
      },
      {
        path: "user-management",
        element: (
          <RequirePermission module="users" action="view">
            <Suspense
              fallback={
                <LoadingIndicator
                  fullScreen
                  label="Loading User Management..."
                />
              }
            >
              <UserManagementPage />
            </Suspense>
          </RequirePermission>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
    ],
  },
];

export const router = createBrowserRouter(routes);

export default router;
