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

export default function Reports() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "custom">("month");
  const [reportType, setReportType] = useState<"sales" | "inventory" | "activity">("sales");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Calculate query parameters based on time range
  const getTimeParams = () => {
    if (timeRange === 'custom' && startDate && endDate) {
      return `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
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
    if (isLoading) return <div className="text-center p-4">Loading...</div>;
    if (!previewData) return <div className="text-center p-4">No data available</div>;

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
          {previewData.slice(0, 5).map((row, i) => (
            <tr key={i} className="border-b">
              {Object.values(row).map((value: any, j) => (
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
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download detailed reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Select report type and time range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select 
                value={reportType} 
                onValueChange={(value: "sales" | "inventory" | "activity") => setReportType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="activity">Activity Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
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
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeRange === 'custom' && (
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onSelect={setStartDate}
                    maxDate={endDate || new Date()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
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
                Export CSV
              </Button>
              <Button
                onClick={() => downloadReport('pdf')}
                className="w-full"
                disabled={timeRange === 'custom' && (!startDate || !endDate)}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              Preview of the first 5 rows
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