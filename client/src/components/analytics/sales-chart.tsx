import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type { Sale } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface SalesChartProps {
  sales: Sale[];
  title?: string;
}

export function SalesChart({ sales, title = "Sales Analytics" }: SalesChartProps) {
  const { t } = useTranslation();
  const [viewType, setViewType] = useState<"daily" | "monthly">("daily");
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  // Process sales data based on view type
  const processedData = sales.reduce((acc, sale) => {
    const date = new Date(sale.timestamp);
    const key = viewType === "daily" 
      ? date.toLocaleDateString()
      : `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const amount = sale.quantity * sale.salePrice;
    
    if (!acc[key]) {
      acc[key] = {
        date: key,
        amount: 0,
        count: 0,
      };
    }
    
    acc[key].amount += amount;
    acc[key].count += 1;
    
    return acc;
  }, {} as Record<string, { date: string; amount: number; count: number }>);

  const chartData = Object.values(processedData).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-2">
          <Select value={viewType} onValueChange={(value: "daily" | "monthly") => setViewType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('sales.daily')}</SelectItem>
              <SelectItem value="monthly">{t('sales.monthly')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={(value: "area" | "bar") => setChartType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">{t('sales.areaChart')}</SelectItem>
              <SelectItem value="bar">{t('sales.barChart')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => {
                  if (viewType === "monthly") {
                    const [year, month] = value.split('-');
                    return `${month}/${year}`;
                  }
                  return value;
                }}
              />
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
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => {
                  if (viewType === "monthly") {
                    const [year, month] = value.split('-');
                    return `${month}/${year}`;
                  }
                  return value;
                }}
              />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="amount"
                fill="hsl(var(--primary))"
                opacity={0.8}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
