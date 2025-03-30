import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LucideSettings, Database, Server, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSelectorFull } from "@/components/language-selector";
import { getCurrentLanguage } from "@/i18n";

interface DatabaseConfig {
  engine: string;
  postgresql: {
    host: string;
    port: string;
    database: string;
    user: string;
  };
  mysql: {
    host: string;
    port: string;
    database: string;
    user: string;
  };
}

export default function SettingsPage() {
  const [dbEngine, setDbEngine] = useState<string>("postgresql");
  const [isSaving, setIsSaving] = useState(false);
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    engine: "postgresql",
    postgresql: {
      host: "localhost",
      port: "5432",
      database: "postgres",
      user: "postgres"
    },
    mysql: {
      host: "localhost",
      port: "3306",
      database: "subsidiary_management",
      user: "root"
    }
  });
  const { toast } = useToast();
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  useEffect(() => {
    // Load current database engine configuration
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/config/database");
        if (response.ok) {
          const data = await response.json();
          setDbEngine(data.engine);
          setDbConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch database configuration:", error);
        toast({
          title: "Failed to Load Configuration",
          description: "Could not load database configuration",
          variant: "destructive",
        });
      }
    };

    fetchConfig();
  }, [toast]);

  const handleUpdatePostgresConfig = (key: string, value: string) => {
    setDbConfig({
      ...dbConfig,
      postgresql: {
        ...dbConfig.postgresql,
        [key]: value
      }
    });
  };

  const handleUpdateMysqlConfig = (key: string, value: string) => {
    setDbConfig({
      ...dbConfig,
      mysql: {
        ...dbConfig.mysql,
        [key]: value
      }
    });
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/config/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          engine: dbEngine,
          postgresql: dbConfig.postgresql,
          mysql: dbConfig.mysql
        }),
      });

      if (response.ok) {
        toast({
          title: "Configuration Updated",
          description: "Database configuration has been updated. Changes will take effect after server restart.",
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
          <h1 className="text-3xl font-bold mb-2">{t('settings.systemSettings')}</h1>
          <p className="text-muted-foreground">
            {t('settings.configureApp')}
          </p>
        </div>
        <LucideSettings className="h-10 w-10 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.databaseConfig')}</CardTitle>
          <CardDescription>
            {t('settings.configureDB')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">{t('settings.dbEngine')}</p>
              <Select
                value={dbEngine}
                onValueChange={setDbEngine}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('settings.selectLanguage')} />
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
              {isSaving ? t('settings.saving') : t('settings.saveConfig')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.connectionSettings')}</CardTitle>
          <CardDescription>
            {t('settings.configureConnDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={dbEngine} value={dbEngine} onValueChange={setDbEngine}>
            <TabsList className="mb-4">
              <TabsTrigger value="postgresql">PostgreSQL</TabsTrigger>
              <TabsTrigger value="mysql">MySQL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="postgresql" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pg-host">{t('settings.host')}</Label>
                  <Input 
                    id="pg-host" 
                    placeholder="localhost" 
                    value={dbConfig.postgresql.host}
                    onChange={(e) => handleUpdatePostgresConfig('host', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pg-port">{t('settings.port')}</Label>
                  <Input 
                    id="pg-port" 
                    placeholder="5432" 
                    value={dbConfig.postgresql.port}
                    onChange={(e) => handleUpdatePostgresConfig('port', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pg-database">{t('settings.databaseName')}</Label>
                  <Input 
                    id="pg-database" 
                    placeholder="postgres" 
                    value={dbConfig.postgresql.database}
                    onChange={(e) => handleUpdatePostgresConfig('database', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pg-user">{t('settings.username')}</Label>
                  <Input 
                    id="pg-user" 
                    placeholder="postgres" 
                    value={dbConfig.postgresql.user}
                    onChange={(e) => handleUpdatePostgresConfig('user', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md text-sm">
                <p className="font-medium flex items-center">
                  <Server className="h-4 w-4 mr-2" /> {t('settings.connectionStatus')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settings.securityNote')}
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="mysql" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mysql-host">{t('settings.host')}</Label>
                  <Input 
                    id="mysql-host" 
                    placeholder="localhost" 
                    value={dbConfig.mysql.host}
                    onChange={(e) => handleUpdateMysqlConfig('host', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mysql-port">{t('settings.port')}</Label>
                  <Input 
                    id="mysql-port" 
                    placeholder="3306" 
                    value={dbConfig.mysql.port}
                    onChange={(e) => handleUpdateMysqlConfig('port', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mysql-database">{t('settings.databaseName')}</Label>
                  <Input 
                    id="mysql-database" 
                    placeholder="subsidiary_management" 
                    value={dbConfig.mysql.database}
                    onChange={(e) => handleUpdateMysqlConfig('database', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mysql-user">{t('settings.username')}</Label>
                  <Input 
                    id="mysql-user" 
                    placeholder="root" 
                    value={dbConfig.mysql.user}
                    onChange={(e) => handleUpdateMysqlConfig('user', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md text-sm">
                <p className="font-medium flex items-center">
                  <Server className="h-4 w-4 mr-2" /> {t('settings.connectionStatus')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('settings.securityNote')}
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleSaveConfig} 
              disabled={isSaving}
            >
              {isSaving ? t('settings.saving') : t('settings.saveConnSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.languageSettings')}</CardTitle>
          <CardDescription>
            {t('settings.configureLanguage')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <LanguageSelectorFull />
            </div>
          </div>
          
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium">{t('settings.activeEngine')}: <span className="font-semibold text-primary">{currentLanguage.toUpperCase()}</span></p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('settings.english')}: English | {t('settings.spanish')}: Español | {t('settings.french')}: Français | {t('settings.portuguese')}: Português
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.connectionStatus')}</CardTitle>
          <CardDescription>
            {t('settings.currentInfo')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium">{t('settings.activeEngine')}: <span className="font-semibold text-primary">{dbEngine.toUpperCase()}</span></p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('settings.restartNote')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}