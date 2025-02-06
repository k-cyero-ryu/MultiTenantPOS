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
import type { Subsidiary, Sale, Inventory } from "@shared/schema";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Reports() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [reportType, setReportType] = useState<"sales" | "inventory" | "activity">("sales");

  // Query for report preview data
  const { data: previewData, isLoading } = useQuery({
    queryKey: ["/api/reports", reportType, { format: "json", timeRange }],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${reportType}?format=json&timeRange=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      return res.json();
    },
  });

  // Update the downloadReport function
  const downloadReport = async (format: "csv" | "pdf") => {
    try {
      if (format === 'pdf') {
        // For PDF, open the HTML in a new window and trigger print
        const response = await fetch(
          `/api/reports/${reportType}?format=pdf&timeRange=${timeRange}`
        );
        const html = await response.text();

        // Create a new window with the HTML content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          // Wait for content to load then print
          printWindow.onload = () => {
            printWindow.print();
            // Close the window after print dialog is closed
            setTimeout(() => printWindow.close(), 500);
          };
        }
      } else {
        // For CSV, download as before
        const response = await fetch(
          `/api/reports/${reportType}?format=${format}&timeRange=${timeRange}`
        );
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${timeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  // Function to format preview data
  const renderPreview = () => {
    if (isLoading) return <div className="text-center p-4">Loading...</div>;
    if (!previewData || !previewData.length) return <div className="text-center p-4">No data available</div>;

    return (
      <div className="w-full overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {Object.keys(previewData[0]).map((header) => (
                <th key={header} className="p-2 text-left text-sm font-medium text-muted-foreground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.slice(0, 5).map((row, i) => (
              <tr key={i} className="border-b hover:bg-muted/50">
                {Object.values(row).map((value: any, j) => (
                  <td key={j} className="p-2 text-sm">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Select report type and time range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="pt-4 flex gap-4">
              <Button
                onClick={() => downloadReport('csv')}
                variant="outline"
                className="flex-1"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => downloadReport('pdf')}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
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
            <ScrollArea className="h-[400px] w-full rounded-md border">
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