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

export default function MHCDashboard() {
  const { user } = useAuth();

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

  const totalSales = sales.reduce(
    (acc, sale) => acc + sale.quantity * sale.salePrice,
    0
  );

  const activeSubsidiaries = subsidiaries.filter((s) => s.status).length;

  const totalUsers = allUsers.length;
  const subsidiaryAdmins = allUsers.filter((u) => u.role === "subsidiary_admin").length;

  return (
    <div className="space-y-8 p-8">
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

      <div>
        <h1 className="text-3xl font-bold mb-2">MHC Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all subsidiary companies performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Subsidiaries"
          value={subsidiaries.length}
          icon={Building2}
        />
        <StatsCard
          title="Active Subsidiaries"
          value={activeSubsidiaries}
          description={`${((activeSubsidiaries / subsidiaries.length) * 100).toFixed(
            1
          )}% active rate`}
          icon={Users}
        />
        <StatsCard
          title="Total Sales"
          value={`$${totalSales.toFixed(2)}`}
          icon={TrendingUp}
        />
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
    </div>
  );
}