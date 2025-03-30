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
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Reports() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "custom">("month");
  const [reportType, setReportType] = useState<"sales" | "inventory" | "activity">("sales");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

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

  const generatePDF = async () => {
    if (!previewData || !previewData.length) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // Create a temporary hidden div with the content for the PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.style.width = '100%';
      pdfContainer.style.padding = '20px';
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      document.body.appendChild(pdfContainer);
      
      const reportTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      const now = new Date();
      let dateRangeText = '';
      
      if (timeRange === 'custom' && startDate && endDate) {
        dateRangeText = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      } else {
        switch (timeRange) {
          case 'week':
            dateRangeText = t('reports.lastWeek');
            break;
          case 'month':
            dateRangeText = t('reports.lastMonth');
            break;
          case 'year':
            dateRangeText = t('reports.lastYear');
            break;
        }
      }
      
      // Build the HTML content for the PDF
      pdfContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="font-size: 22px; font-weight: bold; color: #4A6FFF;">
              Main Head Company
            </div>
            <div style="text-align: right;">
              <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">Corporate Report</div>
              <div>Generated on: ${now.toLocaleDateString()}</div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 20px 0; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <h1 style="font-size: 24px; margin-bottom: 5px;">${reportTitle} ${t('reports.title')}</h1>
            <div style="color: #666;">
              ${t('reports.timeRange')}: ${dateRangeText}
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                ${Object.keys(previewData[0] || {}).map(header => 
                  `<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">${header}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${previewData.map((row: Record<string, any>) => 
                `<tr>
                  ${Object.values(row).map((value: any) => 
                    `<td style="border: 1px solid #ddd; padding: 12px; text-align: left;">
                      ${typeof value === 'object' ? JSON.stringify(value) : value}
                    </td>`
                  ).join('')}
                </tr>`
              ).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
            <p>© ${new Date().getFullYear()} Main Head Company - All rights reserved</p>
          </div>
        </div>
      `;
      
      // Create a PDF document with jsPDF
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Convert HTML to canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      // Calculate the number of pages needed
      const contentHeight = canvas.height;
      const pageHeight = pdfHeight - 40; // Add some margin
      const pageCount = Math.ceil(contentHeight / pageHeight);
      
      // Add canvas to PDF page by page
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const position = -i * pageHeight;
        const canvasImageData = canvas.toDataURL('image/png');
        
        // Add the image to the PDF
        pdf.addImage({
          imageData: canvasImageData,
          format: 'PNG',
          x: 20,
          y: 20,
          width: pdfWidth - 40,
          height: pageHeight,
          compression: 'FAST',
          rotation: 0,
          srcHeight: canvas.height,
          srcY: -position
        });
      }
      
      // Save the PDF file
      pdf.save(`${reportType}-report.pdf`);
      
      // Clean up
      document.body.removeChild(pdfContainer);
      setIsGeneratingPDF(false);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGeneratingPDF(false);
    }
  };

  const downloadReport = async (format: "csv" | "pdf") => {
    try {
      if (format === 'pdf') {
        // Use our custom PDF generation instead of the server-side HTML
        await generatePDF();
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
                disabled={(timeRange === 'custom' && (!startDate || !endDate)) || isGeneratingPDF}
              >
                <FileText className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? t('reports.generating') : t('reports.viewReport')}
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