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

export default function ActivityLogs() {
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
        <h1 className="text-3xl font-bold mb-2">Activity Logs</h1>
        <p className="text-muted-foreground">
          View system-wide activity logs across all subsidiaries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log Viewer</CardTitle>
          <CardDescription>
            Filter and view activity logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onSelect={setStartDate}
                  maxDate={endDate || new Date()}
                  placeholderText="Select start date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <DatePicker
                  selected={endDate}
                  onSelect={setEndDate}
                  minDate={startDate}
                  maxDate={new Date()}
                  placeholderText="Select end date"
                />
              </div>
            </div>
          )}

          <ScrollArea className="h-[500px] w-full rounded-md border">
            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-4">Loading logs...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No activity logs found for the selected time range
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log, index) => (
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
