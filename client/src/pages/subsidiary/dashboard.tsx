import { StatsCard } from "@/components/dashboard/stats-card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Sale, Inventory } from "@shared/schema";
import { Package, CreditCard, BarChart3, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

export default function SubsidiaryDashboard() {
  const { user } = useAuth();
  const subsidiaryId = user?.subsidiaryId;

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: [`/api/subsidiaries/${subsidiaryId}/inventory`],
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: [`/api/subsidiaries/${subsidiaryId}/sales`],
  });

  const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const totalValue = inventory.reduce(
    (acc, item) => acc + item.quantity * item.costPrice,
    0
  );
  const totalSales = sales.reduce(
    (acc, sale) => acc + sale.quantity * sale.salePrice,
    0
  );

  const salesData = sales.map((sale) => ({
    date: new Date(sale.timestamp).toLocaleDateString(),
    amount: sale.quantity * sale.salePrice,
  }));

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your subsidiary performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Stock"
          value={totalStock}
          icon={Package}
          description="Items in inventory"
        />
        <StatsCard
          title="Inventory Value"
          value={`$${totalValue.toFixed(2)}`}
          icon={CreditCard}
        />
        <StatsCard
          title="Products"
          value={inventory.length}
          icon={BarChart3}
        />
        <StatsCard
          title="Total Sales"
          value={`$${totalSales.toFixed(2)}`}
          icon={TrendingUp}
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
