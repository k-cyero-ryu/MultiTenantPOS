import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  FileText,
  Activity,
  Settings,
  Globe
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const isMHCAdmin = user?.role === "mhc_admin";
  const isSubsidiaryAdmin = user?.role === "subsidiary_admin";

  const links = isMHCAdmin ? [
    { href: "/", icon: LayoutDashboard, label: t('common.dashboard') },
    { href: "/subsidiaries", icon: Building2, label: t('common.subsidiaries') },
    { href: "/users", icon: Users, label: t('common.users') },
    { href: "/reports", icon: FileText, label: t('common.reports') },
    { href: "/activity-logs", icon: Activity, label: t('common.activityLogs') },
    { href: "/settings", icon: Settings, label: t('common.settings') },
  ] : [
    { href: "/", icon: LayoutDashboard, label: t('common.dashboard') },
    { href: "/inventory", icon: Package, label: t('common.inventory') },
    { href: "/sales", icon: ShoppingCart, label: t('common.sales') },
    ...(isSubsidiaryAdmin ? [{ href: "/users", icon: Users, label: t('common.users') }] : []),
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        {isMHCAdmin ? t('common.mainHeadCompany') : t('common.subsidiaryPortal')}
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2">
          {links.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <Button
                variant={location === href ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-2 space-y-2">
        <div className="px-2 py-1">
          <LanguageSelector />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => {
            logoutMutation.mutate();
            setOpen(false);
          }}
        >
          <LogOut className="h-4 w-4" />
          {t('common.logout')}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className={cn("border-r w-72", className)}>
      <SidebarContent />
    </aside>
  );
}