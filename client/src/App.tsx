import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { TourProvider } from "@/providers/tour-provider";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import MHCDashboard from "@/pages/mhc/dashboard";
import Subsidiaries from "@/pages/mhc/subsidiaries";
import Reports from "@/pages/mhc/reports";
import ActivityLogs from "@/pages/mhc/activity-logs";
import Settings from "@/pages/mhc/settings";
import SubsidiaryDashboard from "@/pages/subsidiary/dashboard";
import Inventory from "@/pages/subsidiary/inventory";
import Sales from "@/pages/subsidiary/sales";
import Users from "@/pages/mhc/users";
import SubsidiaryUsers from "@/pages/subsidiary/users";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  const isMHCAdmin = user?.role === "mhc_admin";
  const isSubsidiaryAdmin = user?.role === "subsidiary_admin";

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />

      <ProtectedRoute
        path="/"
        component={() => (
          <AppLayout>
            {isMHCAdmin ? <MHCDashboard /> : <SubsidiaryDashboard />}
          </AppLayout>
        )}
      />

      {/* MHC Routes */}
      <ProtectedRoute
        path="/subsidiaries"
        component={() => (
          <AppLayout>
            <Subsidiaries />
          </AppLayout>
        )}
      />

      {isMHCAdmin && (
        <>
          <ProtectedRoute
            path="/users"
            component={() => (
              <AppLayout>
                <Users />
              </AppLayout>
            )}
          />
          <ProtectedRoute
            path="/reports"
            component={() => (
              <AppLayout>
                <Reports />
              </AppLayout>
            )}
          />
          <ProtectedRoute
            path="/activity-logs"
            component={() => (
              <AppLayout>
                <ActivityLogs />
              </AppLayout>
            )}
          />
          <ProtectedRoute
            path="/settings"
            component={() => (
              <AppLayout>
                <Settings />
              </AppLayout>
            )}
          />
        </>
      )}

      {/* Subsidiary Routes */}
      <ProtectedRoute
        path="/inventory"
        component={() => (
          <AppLayout>
            <Inventory />
          </AppLayout>
        )}
      />

      <ProtectedRoute
        path="/sales"
        component={() => (
          <AppLayout>
            <Sales />
          </AppLayout>
        )}
      />

      {/* Subsidiary users management route - Only for subsidiary admins */}
      {isSubsidiaryAdmin && (
        <ProtectedRoute
          path="/users"
          component={() => (
            <AppLayout>
              <SubsidiaryUsers />
            </AppLayout>
          )}
        />
      )}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TourProvider>
          <Router />
          <Toaster />
        </TourProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;