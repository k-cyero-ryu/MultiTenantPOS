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
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import type { Subsidiary, Sale, Inventory } from "@shared/schema";
import { useState } from "react";

export default function Reports() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [reportType, setReportType] = useState<"sales" | "inventory" | "activity">("sales");

  const { data: subsidiaries = [] } = useQuery<Subsidiary[]>({
    queryKey: ["/api/subsidiaries"],
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const downloadReport = async (format: "csv" | "pdf") => {
    try {
      const response = await fetch(`/api/reports/${reportType}?format=${format}&timeRange=${timeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${timeRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
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
                onValueChange={(value: "week" | "month" | "year") => setTimeRange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => downloadReport('csv')}
                className="flex-1"
                variant="outline"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
              <Button
                onClick={() => downloadReport('pdf')}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              Preview of the selected report
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Preview content will be added here */}
            <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/50">
              Report preview will be shown here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
