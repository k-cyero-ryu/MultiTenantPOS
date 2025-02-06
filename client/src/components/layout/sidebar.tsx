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
  Activity // Added import for Activity icon
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const isMHCAdmin = user?.role === "mhc_admin";
  const isSubsidiaryAdmin = user?.role === "subsidiary_admin";

  const links = isMHCAdmin ? [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/subsidiaries", icon: Building2, label: "Subsidiaries" },
    { href: "/users", icon: Users, label: "Users" },
    { href: "/reports", icon: FileText, label: "Reports" },
    { href: "/activity-logs", icon: Activity, label: "Activity Logs" }, // Added Activity Logs link
  ] : [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/sales", icon: ShoppingCart, label: "Sales" },
    ...(isSubsidiaryAdmin ? [{ href: "/users", icon: Users, label: "Users" }] : []),
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        {isMHCAdmin ? "Main Head Company" : "Subsidiary Portal"}
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
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => {
            logoutMutation.mutate();
            setOpen(false);
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
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