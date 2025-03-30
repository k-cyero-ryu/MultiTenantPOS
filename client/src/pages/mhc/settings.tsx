import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LucideSettings, Database } from "lucide-react";

export default function SettingsPage() {
  const [dbEngine, setDbEngine] = useState<string>("postgresql");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load current database engine configuration
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/config/database");
        if (response.ok) {
          const data = await response.json();
          setDbEngine(data.engine);
        }
      } catch (error) {
        console.error("Failed to fetch database configuration:", error);
      }
    };

    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/config/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ engine: dbEngine }),
      });

      if (response.ok) {
        toast({
          title: "Configuration Updated",
          description: "Database engine configuration has been updated. Changes will take effect after server restart.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Update Failed",
          description: errorData.message || "Failed to update database configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "An error occurred while updating the configuration",
        variant: "destructive",
      });
      console.error("Failed to update database configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Settings</h1>
          <p className="text-muted-foreground">
            Configure application settings and preferences
          </p>
        </div>
        <LucideSettings className="h-10 w-10 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Configuration</CardTitle>
          <CardDescription>
            Configure the database engine used by the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Database Engine</p>
              <Select
                value={dbEngine}
                onValueChange={setDbEngine}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleSaveConfig} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Connection Status</CardTitle>
          <CardDescription>
            Current database connection information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium">Active Engine: <span className="font-semibold text-primary">{dbEngine.toUpperCase()}</span></p>
            <p className="text-xs text-muted-foreground mt-1">
              Changes to database engine require a server restart to take effect.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}