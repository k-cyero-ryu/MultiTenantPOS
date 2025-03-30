import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Reports() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "custom">("month");
  const [reportType, setReportType] = useState<"sales" | "inventory" | "activity">("sales");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Update the time params function to format dates properly
  const getTimeParams = () => {
    if (timeRange === 'custom' && startDate && endDate) {
      // Set end date to end of the day
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      return `startDate=${startDate.toISOString()}&endDate=${endDateTime.toISOString()}`;
    }
    return `timeRange=${timeRange}`;
  };

  // Query for report preview data
  const { data: previewData, isLoading } = useQuery({
    queryKey: ["/api/reports", reportType, timeRange, startDate, endDate],
    queryFn: async () => {
      const timeParams = getTimeParams();
      const res = await fetch(`/api/reports/${reportType}?format=json&${timeParams}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      return res.json();
    },
    enabled: timeRange !== 'custom' || (startDate !== undefined && endDate !== undefined),
  });

  const downloadReport = async (format: "csv" | "pdf") => {
    try {
      if (format === 'pdf') {
        const timeParams = getTimeParams();
        window.open(
          `/api/reports/${reportType}?format=${format}&${timeParams}`,
          '_blank'
        );
      } else {
        const timeParams = getTimeParams();
        const response = await fetch(
          `/api/reports/${reportType}?format=${format}&${timeParams}`
        );
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };

  // Function to format preview data
  const renderPreview = () => {
    if (isLoading) return <div className="text-center p-4">{t('reports.loading')}</div>;
    if (!previewData) return <div className="text-center p-4">{t('reports.noData')}</div>;

    return (
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {Object.keys(previewData[0] || {}).map((header) => (
              <th key={header} className="p-2 text-left text-sm font-medium text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewData.slice(0, 5).map((row: Record<string, any>, i: number) => (
            <tr key={i} className="border-b">
              {Object.values(row).map((value: any, j: number) => (
                <td key={j} className="p-2 text-sm">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('reports.title')}</h1>
        <p className="text-muted-foreground">
          {t('reports.generateAndDownload')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.generateReport')}</CardTitle>
            <CardDescription>
              {t('reports.selectTypeAndRange')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('reports.reportType')}</label>
              <Select
                value={reportType}
                onValueChange={(value: "sales" | "inventory" | "activity") => setReportType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">{t('reports.salesReport')}</SelectItem>
                  <SelectItem value="inventory">{t('inventory.report')}</SelectItem>
                  <SelectItem value="activity">{t('reports.activityReport')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('reports.timeRange')}</label>
              <Select
                value={timeRange}
                onValueChange={(value: "week" | "month" | "year" | "custom") => {
                  setTimeRange(value);
                  if (value !== 'custom') {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t('reports.lastWeek')}</SelectItem>
                  <SelectItem value="month">{t('reports.lastMonth')}</SelectItem>
                  <SelectItem value="year">{t('reports.lastYear')}</SelectItem>
                  <SelectItem value="custom">{t('reports.customRange')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeRange === 'custom' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('reports.startDate')}</label>
                  <DatePicker
                    selected={startDate}
                    onSelect={setStartDate}
                    maxDate={endDate || new Date()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('reports.endDate')}</label>
                  <DatePicker
                    selected={endDate}
                    onSelect={setEndDate}
                    minDate={startDate}
                    maxDate={new Date()}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button
                onClick={() => downloadReport('csv')}
                variant="outline"
                className="w-full"
                disabled={timeRange === 'custom' && (!startDate || !endDate)}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {t('reports.exportCSV')}
              </Button>
              <Button
                onClick={() => downloadReport('pdf')}
                className="w-full"
                disabled={timeRange === 'custom' && (!startDate || !endDate)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('reports.viewReport')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reports.reportPreview')}</CardTitle>
            <CardDescription>
              {t('reports.previewFirstRows')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="p-4">
                {renderPreview()}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}