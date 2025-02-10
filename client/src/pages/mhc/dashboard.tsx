import { StatsCard } from "@/components/dashboard/stats-card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  PackageOpen,
  TrendingUp,
  User,
} from "lucide-react";
import type { Subsidiary, Sale, User as UserType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TourStep } from "@/components/tour-step";
import { useTour } from "@/providers/tour-provider";
import { useEffect } from "react";

export default function MHCDashboard() {
  const { user } = useAuth();
  const { setSteps, startTour } = useTour();

  const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: inventoryStats = { totalProducts: 0 } } = useQuery<{ totalProducts: number }>({
    queryKey: ["/api/inventory/total"],
  });

  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    setSteps([
      {
        id: "welcome",
        title: "Welcome to MHC Dashboard",
        content: "Let's take a quick tour of your dashboard features.",
        position: "bottom"
      },
      {
        id: "profile",
        title: "Your Profile",
        content: "View your user information and role here.",
        position: "bottom"
      },
      {
        id: "subsidiaries",
        title: "Subsidiary Overview",
        content: "Monitor all your subsidiary companies at a glance.",
        position: "bottom"
      },
      {
        id: "sales",
        title: "Sales Performance",
        content: "Track total sales across all subsidiaries.",
        position: "right"
      },
      {
        id: "users",
        title: "User Management",
        content: "Keep track of all users and subsidiary admins.",
        position: "left"
      }
    ]);
  }, [setSteps]);

  const totalSales = sales.reduce(
    (acc, sale) => acc + sale.quantity * sale.salePrice,
    0
  );

  const activeSubsidiaries = subsidiaries.filter((s) => s.status).length;
  const totalUsers = allUsers.length;
  const subsidiaryAdmins = allUsers.filter((u) => u.role === "subsidiary_admin").length;

  return (
    <div className="space-y-8 p-8">
      <TourStep stepId="welcome">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">MHC Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of all subsidiary companies performance
            </p>
          </div>
          <Button onClick={startTour}>Start Tour</Button>
        </div>
      </TourStep>

      <TourStep stepId="profile">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">
                {user?.username} ({user?.role})
              </h3>
              <p className="text-sm text-muted-foreground">
                Main Head Company Administrator
              </p>
            </div>
          </div>
        </Card>
      </TourStep>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TourStep stepId="subsidiaries">
          <div className="grid gap-4 md:col-span-2">
            <StatsCard
              title="Total Subsidiaries"
              value={subsidiaries.length}
              icon={Building2}
            />
            <StatsCard
              title="Active Subsidiaries"
              value={activeSubsidiaries}
              description={`${((activeSubsidiaries / subsidiaries.length) * 100).toFixed(1)}% active rate`}
              icon={Users}
            />
          </div>
        </TourStep>

        <TourStep stepId="sales">
          <StatsCard
            title="Total Sales"
            value={`$${totalSales.toFixed(2)}`}
            icon={TrendingUp}
          />
        </TourStep>

        <TourStep stepId="users">
          <div className="grid gap-4">
            <StatsCard
              title="Total Users"
              value={totalUsers}
              description={`${subsidiaryAdmins} subsidiary admins`}
              icon={User}
            />
            <StatsCard
              title="Total Products"
              value={inventoryStats.totalProducts}
              icon={PackageOpen}
            />
          </div>
        </TourStep>
      </div>
    </div>
  );
}