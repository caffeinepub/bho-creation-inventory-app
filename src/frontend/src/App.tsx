import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useGetCallerUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import AddFabricPage from './pages/AddFabricPage';
import AdminPanel from './pages/AdminPanel';
import ProfileSetupModal from './components/ProfileSetupModal';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import { UserRole } from './backend';
import { useEffect } from 'react';
import { toast } from 'sonner';

function RootComponent() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Redirect to login if not authenticated
  if (!isAuthenticated && loginStatus !== 'logging-in' && loginStatus !== 'initializing') {
    return <LoginPage />;
  }

  // Show loading while initializing or fetching profile
  if (loginStatus === 'initializing' || (isAuthenticated && !isFetched)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showProfileSetup && <ProfileSetupModal />}
      {isAuthenticated && userProfile && (
        <Layout>
          <Outlet />
        </Layout>
      )}
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scan',
  component: ScanPage,
});

const addFabricRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/add',
  component: AddFabricPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPanel,
});

const routeTree = rootRoute.addChildren([dashboardRoute, scanRoute, addFabricRoute, adminRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
