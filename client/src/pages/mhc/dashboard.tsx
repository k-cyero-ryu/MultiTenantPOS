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
import type { Subsidiary, Sale, User as UserType, Inventory } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TourStep } from "@/components/tour-step";
import { useTour } from "@/providers/tour-provider";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SalesChart } from "@/components/analytics/sales-chart";
import { InventoryAnalysis } from "@/components/analytics/inventory-analysis";

export default function MHCDashboard() {
  const { user } = useAuth();
  const { setSteps, startTour } = useTour();
  const { t } = useTranslation();

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
  
  const { data: inventoryItems = [] } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  useEffect(() => {
    setSteps([
      {
        id: "welcome",
        title: t('tour.welcomeTitle'),
        content: t('tour.welcomeContent'),
        position: "bottom"
      },
      {
        id: "profile",
        title: t('tour.profileTitle'),
        content: t('tour.profileContent'),
        position: "bottom"
      },
      {
        id: "subsidiaries",
        title: t('tour.subsidiariesTitle'),
        content: t('tour.subsidiariesContent'),
        position: "bottom"
      },
      {
        id: "sales",
        title: t('tour.salesTitle'),
        content: t('tour.salesContent'),
        position: "right"
      },
      {
        id: "users",
        title: t('tour.usersTitle'),
        content: t('tour.usersContent'),
        position: "left"
      },
      {
        id: "settings",
        title: t('tour.settingsTitle'),
        content: t('tour.settingsContent'),
        position: "bottom"
      }
    ]);
  }, [setSteps, t]);

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
            <h1 className="text-3xl font-bold mb-2">{t('common.mainHeadCompany')} {t('common.dashboard')}</h1>
            <p className="text-muted-foreground">
              {t('dashboard.overview')}
            </p>
          </div>
          <Button onClick={startTour}>{t('tour.start')}</Button>
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
                {t('common.mainHeadCompany')} {t('users.administrator')}
              </p>
            </div>
          </div>
        </Card>
      </TourStep>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TourStep stepId="subsidiaries">
          <div className="grid gap-4 md:col-span-2">
            <StatsCard
              title={t('dashboard.totalSubsidiaries')}
              value={subsidiaries.length}
              icon={Building2}
            />
            <StatsCard
              title={t('subsidiaries.active')}
              value={activeSubsidiaries}
              description={`${((activeSubsidiaries / subsidiaries.length) * 100).toFixed(1)}% ${t('subsidiaries.activeRate')}`}
              icon={Users}
            />
          </div>
        </TourStep>

        <TourStep stepId="sales">
          <StatsCard
            title={t('dashboard.totalSales')}
            value={`$${totalSales.toFixed(2)}`}
            icon={TrendingUp}
          />
        </TourStep>

        <TourStep stepId="users">
          <div className="grid gap-4">
            <StatsCard
              title={t('dashboard.totalUsers')}
              value={totalUsers}
              description={`${subsidiaryAdmins} ${t('users.subsidiaryAdmins')}`}
              icon={User}
            />
            <StatsCard
              title={t('dashboard.totalInventory')}
              value={inventoryStats.totalProducts}
              icon={PackageOpen}
            />
          </div>
        </TourStep>
      </div>
      
      {/* Sales Analytics Chart */}
      <div className="mt-8">
        <SalesChart sales={sales} title={t('common.salesReport')} />
      </div>

      {/* Inventory Analysis */}
      <div className="mt-8">
        <InventoryAnalysis inventory={inventoryItems} />
      </div>

      <TourStep stepId="settings">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{t('settings.databaseConfig')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('settings.configureDB')}
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = "/settings"}>
              {t('common.settings')}
            </Button>
          </div>
        </Card>
      </TourStep>
    </div>
  );
}