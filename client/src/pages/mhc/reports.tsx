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
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<number | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  // Fetch subsidiaries for filter dropdown
  const { data: subsidiaries = [] } = useQuery({
    queryKey: ["/api/subsidiaries"],
    queryFn: async () => {
      const res = await fetch('/api/subsidiaries');
      if (!res.ok) throw new Error('Failed to fetch subsidiaries');
      return res.json();
    }
  });

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

  // Helper function to get subsidiary data from ID
  const getSubsidiaryData = (id: number | null) => {
    if (!id) return null;
    return subsidiaries.find((sub: any) => sub.id === id) || null;
  };
  
  // Get the selected subsidiary data
  const selectedSubsidiaryData = getSubsidiaryData(selectedSubsidiary);

  // Build API endpoint based on selection
  const getReportEndpoint = () => {
    const timeParams = getTimeParams();
    if (selectedSubsidiary) {
      return `/api/subsidiaries/${selectedSubsidiary}/reports/${reportType}?format=json&${timeParams}`;
    }
    return `/api/reports/${reportType}?format=json&${timeParams}`;
  };

  // Query for report preview data
  const { data: previewData, isLoading } = useQuery({
    queryKey: [
      selectedSubsidiary ? `/api/subsidiaries/${selectedSubsidiary}/reports` : "/api/reports", 
      reportType, 
      timeRange, 
      startDate, 
      endDate
    ],
    queryFn: async () => {
      // Since we don't have subsidiary specific endpoints yet, we'll use the global endpoint
      // and filter the data in the front-end if a subsidiary is selected
      const timeParams = getTimeParams();
      const res = await fetch(`/api/reports/${reportType}?format=json&${timeParams}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      const data = await res.json();
      
      // If a subsidiary is selected, filter the data
      if (selectedSubsidiary && data && data.length) {
        if (typeof data[0].Subsidiary !== 'undefined') {
          // Filter by subsidiary name if available
          const subsidiaryName = selectedSubsidiaryData?.name;
          return data.filter((item: any) => item.Subsidiary === subsidiaryName);
        } else if (typeof data[0].subsidiaryId !== 'undefined') {
          // Filter by subsidiaryId if available
          return data.filter((item: any) => item.subsidiaryId === selectedSubsidiary);
        }
      }
      
      return data;
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
      
      // Function to get the logo URL, matching the approach in subsidiaries page
      const getLogoUrl = (logoPath: string) => {
        console.log("Getting logo URL for path:", logoPath);
        
        // If logo path is empty or invalid, use a default image
        if (!logoPath || logoPath === 'null' || logoPath === '' || logoPath === 'undefined') {
          console.log("Using default logo path");
          return `${window.location.origin}/default-logo.svg`;
        }
        
        // Replace '/uploads/' with '/' as done in the subsidiaries page
        const processedPath = logoPath.replace('/uploads/', '/');
        
        // If path doesn't start with http or /, add the origin
        if (!processedPath.startsWith('http') && !processedPath.startsWith('/')) {
          return `${window.location.origin}/${processedPath}`;
        } else if (processedPath.startsWith('/')) {
          return `${window.location.origin}${processedPath}`;
        }
        
        // If it starts with http, it's already a full URL
        return processedPath;
      };

      // Determine if we're generating a subsidiary-specific report
      const isSubsidiaryReport = selectedSubsidiary !== null && selectedSubsidiaryData;
      const reportHeaderTitle = isSubsidiaryReport 
        ? `${selectedSubsidiaryData.name} ${t('reports.subsidiaryReport')}`
        : `${t('reports.corporateReport')}`;
      
      // For debugging purpose, log the subsidiary data
      console.log("Subsidiary data:", selectedSubsidiaryData);
      
      // Check for logo availability and properly format it
      let logoHTML = '';
      if (isSubsidiaryReport) {
        // For subsidiary reports, either use their logo or a default
        if (selectedSubsidiaryData.logo && 
            selectedSubsidiaryData.logo !== 'null' && 
            selectedSubsidiaryData.logo !== '') {
          // Use the subsidiary's actual logo with consistent container for sizing
          logoHTML = `<div style="width: 70px; height: 70px; display: flex; justify-content: center; align-items: center; margin-right: 15px;">
                        <img src="${getLogoUrl(selectedSubsidiaryData.logo)}" 
                          alt="${selectedSubsidiaryData.name} logo" 
                          style="max-height: 60px; max-width: 70px; width: auto; height: auto; object-fit: contain;">
                      </div>`;
        } else {
          // Use default logo for subsidiaries without a logo
          logoHTML = `<div style="width: 70px; height: 70px; display: flex; justify-content: center; align-items: center; margin-right: 15px;">
                        <img src="${window.location.origin}/default-logo.svg" 
                          alt="${selectedSubsidiaryData.name} logo" 
                          style="max-height: 60px; max-width: 70px; width: auto; height: auto; object-fit: contain;">
                      </div>`;
        }
      } else {
        // For MHC reports, always use a default logo
        logoHTML = `<div style="width: 70px; height: 70px; display: flex; justify-content: center; align-items: center; margin-right: 15px;">
                      <img src="${window.location.origin}/default-logo.svg" 
                        alt="Main Head Company logo" 
                        style="max-height: 60px; max-width: 70px; width: auto; height: auto; object-fit: contain;">
                    </div>`;
      }
          
      // Set the container width to match the PDF aspect ratio (landscape A4)
      pdfContainer.style.width = "1120px"; // Approximating A4 landscape width
      pdfContainer.style.padding = "20px";
      pdfContainer.style.boxSizing = "border-box";
      
      // Build the HTML content for the PDF with conditional logo
      pdfContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; margin-bottom: 30px; width: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; min-width: 50%;">
              ${logoHTML}
              <div style="font-size: 22px; font-weight: bold; color: #333333; white-space: normal;">
                ${isSubsidiaryReport ? selectedSubsidiaryData.name : 'Main Head Company'}
              </div>
            </div>
            <div style="text-align: right; min-width: 30%;">
              <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">${reportHeaderTitle}</div>
              <div>Generated on: ${now.toLocaleDateString()}</div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 20px 0; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <h1 style="font-size: 24px; margin-bottom: 5px;">${reportTitle} ${t('reports.title')}</h1>
            <div style="color: #666;">
              ${t('reports.timeRange')}: ${dateRangeText}
            </div>
            ${isSubsidiaryReport ? 
              `<div style="color: #666; margin-top: 5px;">
                ${t('subsidiaries.taxId')}: ${selectedSubsidiaryData.taxId}
              </div>` : 
              ''}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: auto;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                ${Object.keys(previewData[0] || {}).map((header, index) => {
                  // Determine column widths based on column type
                  let width = "auto";
                  if (header.toLowerCase().includes("date")) {
                    width = "120px"; // Date columns
                  } else if (["id", "quantity", "price", "amount", "number", "count"].some(
                    term => header.toLowerCase().includes(term)
                  )) {
                    width = "100px"; // Numeric columns
                  } else if (header.toLowerCase().includes("subsidiary")) {
                    width = "250px"; // Subsidiary column needs more space
                  } else if (header.toLowerCase().includes("name") || 
                             header.toLowerCase().includes("description")) {
                    width = "200px"; // Name/description columns
                  }
                  
                  return `<th style="border: 1px solid #ddd; padding: 10px; text-align: left; font-weight: bold; 
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: ${width};">${header}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${previewData.map((row: Record<string, any>) => 
                `<tr>
                  ${Object.entries(row).map(([key, value]) => {
                    // Special formatting based on content type
                    let cellStyle = "border: 1px solid #ddd; padding: 10px; text-align: left;";
                    
                    // Determine if this is a numeric value
                    if (typeof value === 'number' || 
                        (typeof value === 'string' && !isNaN(parseFloat(value)) && 
                         ["id", "quantity", "price", "amount"].some(term => key.toLowerCase().includes(term)))) {
                      cellStyle += " text-align: right;"; // Right-align numbers
                    }
                    
                    // Determine if this is a date
                    if (key.toLowerCase().includes("date")) {
                      cellStyle += " white-space: nowrap;"; // No wrapping for dates
                    }
                    
                    // Format the cell content
                    let displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    
                    // Truncate very long text
                    if (typeof value === 'string' && value.length > 50) {
                      displayValue = value.substring(0, 50) + '...';
                    }
                    
                    return `<td style="${cellStyle}">${displayValue}</td>`;
                  }).join('')}
                </tr>`
              ).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
            ${isSubsidiaryReport ? 
              `<div style="margin-bottom: 5px;">
                ${selectedSubsidiaryData.address ? `${selectedSubsidiaryData.address}, ` : ''}
                ${selectedSubsidiaryData.city ? `${selectedSubsidiaryData.city}, ` : ''}
                ${selectedSubsidiaryData.country || ''}
              </div>
              <div style="margin-bottom: 5px;">
                ${selectedSubsidiaryData.email} | ${selectedSubsidiaryData.phoneNumber}
              </div>` : ''}
            <p>© ${new Date().getFullYear()} ${isSubsidiaryReport ? selectedSubsidiaryData.name : 'Main Head Company'} - All rights reserved</p>
          </div>
        </div>
      `;
      
      // Create a PDF document with jsPDF in landscape mode ('l' = landscape)
      const pdf = new jsPDF('l', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Convert HTML to canvas with improved scale for better quality
      const canvas = await html2canvas(pdfContainer, {
        scale: 2, // Higher scale for better image quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 0, // No timeout for images
        onclone: (clonedDoc) => {
          // Apply any additional styling to the cloned document
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            img { image-rendering: high-quality; }
            table { margin: 0 auto; width: 98%; }
            td, th { max-width: 300px; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      // For multiple page support, we need to divide the content up
      // Let's split the container into sections that fit on a page
      
      // Convert the canvas to image data
      const canvasImageData = canvas.toDataURL('image/png', 1.0);
      
      // For multiple pages, it's simpler in this case to just add the whole content
      // Since we're using a fixed layout PDF in landscape mode, most reports will fit on one page
      pdf.addImage(
        canvasImageData,    // image data
        'PNG',              // image format
        20,                 // x position on PDF
        20,                 // y position on PDF
        pdfWidth - 40,      // width on PDF
        pdfHeight - 40,     // height on PDF
        undefined,          // alias (not needed)
        'FAST'              // compression
      );
      
      // If the content is very long, add more pages as needed
      const contentHeight = canvas.height / 2; // Divide by 2 because of our scale factor
      const contentWidth = canvas.width / 2;
      const pageContentHeight = pdfHeight - 40;
      
      if (contentHeight > pageContentHeight) {
        const totalPages = Math.ceil(contentHeight / pageContentHeight);
        
        for (let i = 1; i < totalPages; i++) {
          // Add a new page for each additional content section
          pdf.addPage();
          
          // Calculate vertical positioning to show the content continuation
          const yOffset = -i * pageContentHeight + 20;
          
          pdf.addImage(
            canvasImageData,
            'PNG',
            20,
            yOffset, 
            pdfWidth - 40,
            pdfHeight * 2, // Make it tall enough to show content 
            undefined,
            'FAST'
          );
        }
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
              <label className="text-sm font-medium">{t('reports.subsidiary')}</label>
              <Select
                value={selectedSubsidiary?.toString() || "all"}
                onValueChange={(value) => setSelectedSubsidiary(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.allSubsidiaries')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reports.allSubsidiaries')}</SelectItem>
                  {subsidiaries.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id.toString()}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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