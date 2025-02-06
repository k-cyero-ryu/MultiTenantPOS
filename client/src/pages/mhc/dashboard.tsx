import { StatsCard } from "@/components/dashboard/stats-card";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  PackageOpen,
  TrendingUp,
} from "lucide-react";
import type { Subsidiary, Sale } from "@shared/schema";

export default function MHCDashboard() {
  const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const { data: inventoryStats = { totalProducts: 0 } } = useQuery<{ totalProducts: number }>({
    queryKey: ["/api/inventory/total"],
  });

  const totalSales = sales.reduce(
    (acc, sale) => acc + sale.quantity * sale.salePrice,
    0
  );

  const activeSubsidiaries = subsidiaries.filter((s) => s.status).length;

  return (
    <div className="space-y-8 p-8">
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
          title="Total Products"
          value={inventoryStats.totalProducts}
          icon={PackageOpen}
        />
      </div>
    </div>
  );
}