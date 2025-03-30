import { StatsCard } from "@/components/dashboard/stats-card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Sale, Inventory, Subsidiary } from "@shared/schema";
import { Package, CreditCard, BarChart3, TrendingUp, Building2, User } from "lucide-react";
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
import { SalesChart } from "@/components/analytics/sales-chart";
import { InventoryAnalysis } from "@/components/analytics/inventory-analysis";
import { useTranslation } from "react-i18next";

export default function SubsidiaryDashboard() {
  const { user } = useAuth();
  const subsidiaryId = user?.subsidiaryId;
  const { t } = useTranslation();

  const { data: subsidiary } = useQuery<Subsidiary>({
    queryKey: [`/api/subsidiaries/${subsidiaryId}`],
    enabled: !!subsidiaryId,
  });

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: [`/api/subsidiaries/${subsidiaryId}/inventory`],
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: [`/api/subsidiaries/${subsidiaryId}/sales`],
  });

  const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const totalValue = inventory.reduce(
    (acc, item) => acc + item.quantity * item.salePrice,
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

  // Function to get the correct logo URL
  const getLogoUrl = (logoPath: string) => {
    if (!logoPath) return '';
    // Remove /uploads/ prefix if present since the directory is served at root
    return logoPath.replace('/uploads/', '/');
  };

  return (
    <div className="space-y-8 p-8">
      {/* Subsidiary Info */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          {subsidiary?.logo && (
            <img
              src={getLogoUrl(subsidiary.logo)}
              alt={`${subsidiary.name} logo`}
              className="w-20 h-20 object-contain bg-muted rounded-lg p-2"
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">{subsidiary?.name}</h2>
                </div>
                <p className="text-muted-foreground mt-1">
                  {subsidiary?.city}, {subsidiary?.country}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('subsidiaries.contactInfo')}</p>
                <p className="font-medium">{subsidiary?.email}</p>
                <p className="text-sm">{subsidiary?.phoneNumber}</p>
                <p className="text-sm mt-1">{t('subsidiaries.taxId')}: {subsidiary?.taxId}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* User Info */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">{t('common.loggedInAs')}</p>
            <p className="font-medium">
              {user?.username} <span className="text-muted-foreground">({t(`roles.${user?.role}`)})</span>
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h1 className="text-3xl font-bold mb-2">{t('common.dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('subsidiary.dashboardDescription')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('inventory.totalStock')}
          value={totalStock}
          icon={Package}
          description={t('inventory.itemsInInventory')}
        />
        <StatsCard
          title={t('inventory.inventoryValue')}
          value={`$${totalValue.toFixed(2)}`}
          icon={CreditCard}
          description={t('inventory.basedOnSalesPrices')}
        />
        <StatsCard
          title={t('inventory.products')}
          value={inventory.length}
          icon={BarChart3}
        />
        <StatsCard
          title={t('sales.totalSales')}
          value={`$${totalSales.toFixed(2)}`}
          icon={TrendingUp}
        />
      </div>

      {/* Enhanced Analytics Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{t('analytics.title')}</h2>

        {/* Sales Analytics */}
        <SalesChart
          sales={sales}
          title={t('analytics.salesPerformance')}
        />

        {/* Inventory Analytics */}
        <InventoryAnalysis inventory={inventory} />
      </div>
    </div>
  );
}