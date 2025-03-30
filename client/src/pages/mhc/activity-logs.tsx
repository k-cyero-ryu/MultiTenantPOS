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
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { useState } from "react";
import { ActivityLog } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function ActivityLogs() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "custom">("month");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Query for activity logs
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  // Filter logs based on date range
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    
    if (timeRange === 'custom' && startDate && endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      return logDate >= startDate && logDate <= endDateTime;
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let startDateTime = new Date();

    switch (timeRange) {
      case 'week':
        startDateTime.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDateTime.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDateTime.setFullYear(now.getFullYear() - 1);
        break;
    }

    return logDate >= startDateTime && logDate <= now;
  });

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('activityLogs.title')}</h1>
        <p className="text-muted-foreground">
          {t('activityLogs.viewDescription')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('activityLogs.logViewer')}</CardTitle>
          <CardDescription>
            {t('activityLogs.filterDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('activityLogs.timeRange')}</label>
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
                  placeholderText={t('reports.selectStartDate')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('reports.endDate')}</label>
                <DatePicker
                  selected={endDate}
                  onSelect={setEndDate}
                  minDate={startDate}
                  maxDate={new Date()}
                  placeholderText={t('reports.selectEndDate')}
                />
              </div>
            </div>
          )}

          <ScrollArea className="h-[500px] w-full rounded-md border">
            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-4">{t('common.loading')}</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {t('activityLogs.noLogsFound')}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col space-y-2 p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {format(new Date(log.timestamp), "PPpp")}
                        </span>
                        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
