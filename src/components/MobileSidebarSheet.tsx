import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserPlus, Users, Briefcase, Receipt, Settings, LogOut,
  LayoutDashboard, Building2, CalendarDays, BarChart3,
  Layers, BadgeCheck, FileText, UserCog, Banknote, Activity, Clock, Timer,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/staffStore";
import { cn } from "@/lib/utils";

// Mirrors AppSidebar nav definitions so mobile sheet stays in sync
const SUPER_ADMIN_NAV = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { to: "/offices",       icon: Building2,       label: "Office Branches" },
  { separator: true, label: "HR" },
  { to: "/employees/add", icon: UserPlus,        label: "Add Employee" },
  { to: "/employees",     icon: Users,           label: "All Employees" },
  { to: "/attendance",    icon: CalendarDays,    label: "Attendance" },
  { to: "/leaves",        icon: FileText,        label: "Leave Requests" },
  { to: "/shifts",        icon: Clock,           label: "Shifts" },
  { to: "/overtime",      icon: Timer,           label: "Overtime" },
  { to: "/departments",   icon: Layers,          label: "Departments" },
  { to: "/designations",  icon: BadgeCheck,      label: "Designations" },
  { separator: true, label: "Finance" },
  { to: "/salaries",      icon: Banknote,        label: "Salaries" },
  { to: "/expenses",      icon: Receipt,         label: "Expenses" },
  { to: "/profit-loss",   icon: BarChart3,       label: "Expense Report" },
  { separator: true, label: "Admin" },
  { to: "/staff",         icon: UserCog,         label: "Staff Management" },
  { to: "/activity-logs", icon: Activity,        label: "Activity Logs" },
];

const BRANCH_MANAGER_NAV = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { separator: true, label: "Employees" },
  { to: "/employees/add", icon: UserPlus,        label: "Add Employee" },
  { to: "/employees",     icon: Users,           label: "All Employees" },
  { to: "/attendance",    icon: CalendarDays,    label: "Attendance" },
  { to: "/leaves",        icon: FileText,        label: "Leave Requests" },
  { to: "/shifts",        icon: Clock,           label: "Shifts" },
  { to: "/overtime",      icon: Timer,           label: "Overtime" },
  { to: "/departments",   icon: Layers,          label: "Departments" },
  { to: "/designations",  icon: BadgeCheck,      label: "Designations" },
  { separator: true, label: "Finance" },
  { to: "/salaries",      icon: Banknote,        label: "Salaries" },
  { to: "/expenses",      icon: Receipt,         label: "Expenses" },
  { to: "/profit-loss",   icon: BarChart3,       label: "Expense Report" },
];

const FINANCE_MANAGER_NAV = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { separator: true, label: "Employees" },
  { to: "/employees",  icon: Users,           label: "All Employees" },
  { separator: true, label: "Finance" },
  { to: "/salaries",   icon: Banknote,        label: "Salaries" },
  { to: "/expenses",   icon: Receipt,         label: "Expenses" },
  { to: "/profit-loss",icon: BarChart3,       label: "Expense Report" },
];


type NavItem = { to?: string; icon?: React.ElementType; label: string; separator?: boolean };

interface MobileSidebarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileSidebarSheet = ({ open, onOpenChange }: MobileSidebarSheetProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { staff, logout, isSuperAdmin, isAreaManager, isBranchManager } = useAuth();

  const navItems: NavItem[] = isSuperAdmin
    ? SUPER_ADMIN_NAV
    : isAreaManager || isBranchManager
    ? BRANCH_MANAGER_NAV
    : FINANCE_MANAGER_NAV;

  const isActive = (to: string) => {
    const exactRoutes = ["/employees/add", "/employees", "/offices", "/dashboard"];
    if (exactRoutes.includes(to)) return location.pathname === to;
    return location.pathname.startsWith(to + "/");
  };

  const linkClass = (to: string) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
      isActive(to)
        ? "bg-sidebar-active text-sidebar-active-foreground"
        : "text-sidebar-foreground hover:bg-sidebar-hover"
    );

  const handleLogout = async () => {
    await logout();
    setLogoutOpen(false);
    onOpenChange(false);
    navigate("/login");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sidebar-active flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-sidebar-active-foreground" />
              </div>
              <SheetTitle className="text-sidebar-active-foreground font-semibold text-base">
                Team Manager
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* User chip */}
          {staff && (
            <div className="px-4 py-2.5 border-b border-sidebar-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-sidebar-active flex items-center justify-center text-[10px] font-bold text-sidebar-active-foreground shrink-0">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{staff.name}</p>
                  <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", ROLE_COLORS[staff.role])}>
                    {ROLE_LABELS[staff.role]}
                  </span>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {navItems.map((item, i) => {
              if (item.separator) {
                return (
                  <div key={i} className="pt-3 pb-1">
                    <p className="px-3 text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/50">{item.label}</p>
                  </div>
                );
              }
              if (!item.to || !item.icon) return null;
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} onClick={() => onOpenChange(false)} className={linkClass(item.to)}>
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-2 border-t border-sidebar-border space-y-1 shrink-0">
            <Link to="/settings" onClick={() => onOpenChange(false)} className={linkClass("/settings")}>
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button
              onClick={() => { onOpenChange(false); setLogoutOpen(true); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-destructive hover:bg-destructive/10 w-full"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
          <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
            <p className="text-xs text-sidebar-foreground/50">© 2026 Team Manager</p>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>Are you sure you want to logout?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileSidebarSheet;
