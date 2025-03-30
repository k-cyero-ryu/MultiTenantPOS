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
import { 
  Document, Page, Text, View, StyleSheet, PDFDownloadLink,
  Font, Image, pdf, BlobProvider
} from '@react-pdf/renderer';

// Define styles for PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
    marginBottom: 10,
    height: 60
  },
  logoSection: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  logoImage: {
    width: 60,
    height: 60,
    objectFit: 'contain'
  },
  titleSection: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3
  },
  dateRange: {
    fontSize: 10,
    color: '#555555'
  },
  companySection: {
    width: 200,
    textAlign: 'right',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2
  },
  companyDetails: {
    fontSize: 9,
    color: '#666666'
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderStyle: 'solid',
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 24
  },
  tableHeaderRow: {
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 26
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: 'bold',
    padding: 4,
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tableCell: {
    fontSize: 10,
    padding: 4,
    textAlign: 'left'
  },
  tableCellNumber: {
    fontSize: 10,
    padding: 4,
    textAlign: 'right'
  },
  footer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    borderTopStyle: 'solid',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#666666'
  },
  footerLeft: {
    textAlign: 'left',
    maxWidth: '70%'
  },
  footerRight: {
    textAlign: 'right'
  }
});

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

  // Function to translate column headers
  const translateHeader = (header: string): string => {
    // Create exact and normalized (case-insensitive) maps for headers
    const headerTranslationMapExact: Record<string, string> = {
      "Date": "reports.date",
      "Subsidiary": "reports.subsidiary",
      "Sold By": "reports.soldBy",
      "Sale Price": "reports.salePrice",
      "Amount": "reports.amount",
      "Price": "reports.price",
      "Quantity": "reports.quantity",
      "Total": "reports.total",
      "Product Name": "reports.productName",
      "Product ID": "reports.productId",
      "ProductId": "reports.productId",
      "Description": "reports.description",
      "Username": "users.username",
      "Action": "activityLogs.action",
      "Resource": "activityLogs.resource",
      "Category": "inventory.category",
      "In Stock": "inventory.inStock",
      // Add other exact matches here
      "Filial": "reports.subsidiary", // Spanish
      "Filiale": "reports.subsidiary" // French
    };
    
    // For normalized case-insensitive matching (if exact match fails)
    const headerNormalizedMap: Record<string, string> = {
      "date": "reports.date",
      "subsidiary": "reports.subsidiary",
      "soldby": "reports.soldBy",
      "saleprice": "reports.salePrice",
      "amount": "reports.amount",
      "price": "reports.price",
      "quantity": "reports.quantity",
      "total": "reports.total",
      "productname": "reports.productName",
      "productid": "reports.productId",
      "description": "reports.description",
      "username": "users.username",
      "action": "activityLogs.action",
      "resource": "activityLogs.resource",
      "category": "inventory.category",
      "instock": "inventory.inStock"
    };
    
    // Try exact match first
    if (headerTranslationMapExact[header]) {
      return t(headerTranslationMapExact[header]);
    }
    
    // Try normalized match (removing spaces and case-insensitive)
    const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
    if (headerNormalizedMap[normalizedHeader]) {
      return t(headerNormalizedMap[normalizedHeader]);
    }
    
    // Fallback to generic approach
    const translationKey = `reports.${header.toLowerCase()}`;
    
    // Check if translation exists
    // If i18next has a translation, it will return it; otherwise it returns the key itself
    const result = t(translationKey, { lng: "en" });
    
    // Check if the result is the same as our input key - this indicates missing translation
    if (result === translationKey || result === translationKey.split('.').pop()) {
      // No translation found, return the original header with proper capitalization
      return header.charAt(0).toUpperCase() + header.slice(1);
    }
    
    // Return the translated value
    return t(translationKey);
  };
  
  // React-PDF Document component
  const MyDocument = ({ 
    reportData, 
    reportTitle, 
    dateRangeText, 
    isSubsidiaryReport,
    selectedSubsidiaryData,
    t
  }: {
    reportData: Record<string, any>[];
    reportTitle: string;
    dateRangeText: string;
    isSubsidiaryReport: boolean;
    selectedSubsidiaryData: any;
    t: (key: string) => string;
  }) => {
    // Function to get the logo URL, matching the approach in subsidiaries page
    const getLogoUrl = (logoPath: string) => {
      // If logo path is empty or invalid, use a default image
      if (!logoPath || logoPath === 'null' || logoPath === '' || logoPath === 'undefined') {
        return `/default-logo.svg`;
      }
      
      // Replace '/uploads/' with '/' as done in the subsidiaries page
      return logoPath.replace('/uploads/', '/');
    };

    // Determine logo path
    const logoPath = isSubsidiaryReport && selectedSubsidiaryData?.logo 
      ? getLogoUrl(selectedSubsidiaryData.logo)
      : '/default-logo.svg';

    // Get column headers and calculate widths
    const headers = Object.keys(reportData[0] || {});
    const columnWidths: Record<string, string> = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes("date")) {
        columnWidths[header] = "15%";
      } else if (["id", "quantity", "price", "amount", "number", "count"].some(
        term => lowerHeader.includes(term)
      )) {
        columnWidths[header] = "10%";
      } else if (lowerHeader.includes("subsidiary")) {
        columnWidths[header] = "25%";
      } else if (lowerHeader.includes("name") || 
                  lowerHeader.includes("description")) {
        columnWidths[header] = "20%";
      } else {
        columnWidths[header] = "auto";
      }
    });

    const now = new Date();
    
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            {/* Logo section */}
            <View style={styles.logoSection}>
              <Image src={logoPath} style={styles.logoImage} />
            </View>
            
            {/* Title section */}
            <View style={styles.titleSection}>
              <Text style={styles.reportTitle}>
                {reportTitle} {t('reports.title')}
              </Text>
              <Text style={styles.dateRange}>
                {t('reports.timeRange')}: {dateRangeText}
              </Text>
            </View>
            
            {/* Company section */}
            <View style={styles.companySection}>
              <Text style={styles.companyName}>
                {isSubsidiaryReport ? selectedSubsidiaryData.name : 'Main Head Company'}
              </Text>
              {isSubsidiaryReport && (
                <Text style={styles.companyDetails}>
                  {t('subsidiaries.taxId')}: {selectedSubsidiaryData.taxId}
                </Text>
              )}
              <Text style={styles.companyDetails}>
                Generated: {now.toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          {/* Table */}
          <View style={styles.table}>
            {/* Table header */}
            <View style={styles.tableHeaderRow}>
              {headers.map((header, index) => (
                <View key={index} style={{ width: columnWidths[header] }}>
                  <Text style={styles.tableHeaderCell}>{translateHeader(header)}</Text>
                </View>
              ))}
            </View>
            
            {/* Table rows */}
            {reportData.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.tableRow}>
                {Object.entries(row).map(([key, value], cellIndex) => {
                  // Determine if this is a numeric value
                  const isNumeric = typeof value === 'number' || 
                    (typeof value === 'string' && !isNaN(parseFloat(value)) && 
                      ["id", "quantity", "price", "amount"].some(term => key.toLowerCase().includes(term)));
                  
                  // Format the cell content
                  let displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                  
                  // Truncate very long text
                  if (typeof value === 'string' && value.length > 50) {
                    displayValue = value.substring(0, 50) + '...';
                  }
                  
                  return (
                    <View key={cellIndex} style={{ width: columnWidths[key] }}>
                      <Text style={isNumeric ? styles.tableCellNumber : styles.tableCell}>
                        {displayValue}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            {isSubsidiaryReport ? (
              <Text style={styles.footerLeft}>
                {selectedSubsidiaryData.address ? `${selectedSubsidiaryData.address}, ` : ''}
                {selectedSubsidiaryData.city ? `${selectedSubsidiaryData.city}, ` : ''}
                {selectedSubsidiaryData.country || ''}
                {selectedSubsidiaryData.email ? ` | ${selectedSubsidiaryData.email}` : ''}
                {selectedSubsidiaryData.phoneNumber ? ` | ${selectedSubsidiaryData.phoneNumber}` : ''}
              </Text>
            ) : (
              <Text style={styles.footerLeft}></Text>
            )}
            <Text style={styles.footerRight}>
              © {new Date().getFullYear()} {isSubsidiaryReport ? selectedSubsidiaryData.name : 'Main Head Company'}
            </Text>
          </View>
        </Page>
      </Document>
    );
  };
  
  // PDF generation function using @react-pdf/renderer
  const generatePDF = async () => {
    if (!previewData || !previewData.length) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // Format report title and date range
      const reportTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1);
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
      
      // Determine if we're generating a subsidiary-specific report
      const isSubsidiaryReport = selectedSubsidiary !== null && selectedSubsidiaryData;
      
      // Generate PDF using React-PDF
      const pdfDoc = (
        <MyDocument
          reportData={previewData}
          reportTitle={reportTitle}
          dateRangeText={dateRangeText}
          isSubsidiaryReport={isSubsidiaryReport}
          selectedSubsidiaryData={selectedSubsidiaryData}
          t={t}
        />
      );
      
      // Create blob from the PDF document
      const blob = await pdf(pdfDoc).toBlob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportTitle}-${reportType}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
    if (!previewData || !previewData.length) return <div className="text-center p-4">{t('reports.noData')}</div>;

    return (
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {Object.keys(previewData[0] || {}).map((header) => (
              <th key={header} className="p-2 text-left text-sm font-medium text-muted-foreground">
                {translateHeader(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewData.slice(0, 5).map((row: Record<string, any>, i: number) => (
            <tr key={i} className="border-b">
              {Object.entries(row).map(([key, value], j: number) => (
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