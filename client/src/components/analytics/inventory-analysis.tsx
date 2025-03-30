import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { Inventory } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface InventoryAnalysisProps {
  inventory: Inventory[];
}

export function InventoryAnalysis({ inventory }: InventoryAnalysisProps) {
  const { t } = useTranslation();
  
  // Calculate inventory metrics using sale price
  const totalValue = inventory.reduce(
    (acc, item) => acc + item.quantity * item.salePrice,
    0
  );

  const inventoryMetrics = inventory.map(item => ({
    ...item,
    totalValue: item.quantity * item.salePrice,
    valuePercentage: (item.quantity * item.salePrice / totalValue) * 100,
  })).sort((a, b) => b.totalValue - a.totalValue);

  const lowStockThreshold = 10; // Can be made configurable
  const lowStockItems = inventory.filter(item => item.quantity <= lowStockThreshold);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.valueDistribution')}</CardTitle>
          <CardDescription>
            {t('inventory.valueBreakdown')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryMetrics.map(item => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-medium">
                    ${item.totalValue.toFixed(2)}
                  </span>
                </div>
                <Progress value={item.valuePercentage} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('inventory.lowStockAlert')}</CardTitle>
          <CardDescription>
            {t('inventory.lowStockDesc', { threshold: lowStockThreshold })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.product')}</TableHead>
                <TableHead>{t('inventory.stock')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <span className="text-destructive">{t('inventory.lowStock')}</span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {t('inventory.noLowStock')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}