import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, Building2, Menu, Banknote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavProps {
  onMenuClick: () => void;
}

const BottomNav = ({ onMenuClick }: BottomNavProps) => {
  const location = useLocation();
  const { isSuperAdmin, isAreaManager, isBranchManager } = useAuth();

  const isActive = (to: string) => {
    const exactRoutes = ["/employees/add", "/employees", "/offices", "/dashboard"];
    if (exactRoutes.includes(to)) return location.pathname === to;
    return location.pathname.startsWith(to + "/");
  };

  // Build role-scoped quick nav (max 4 items + More button)
  const navItems = isSuperAdmin
    ? [
        { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
        { to: "/employees",  icon: Users,           label: "Employees" },
        { to: "/attendance", icon: CalendarDays,    label: "Attendance" },
        { to: "/offices",    icon: Building2,       label: "Offices" },
      ]
    : isAreaManager || isBranchManager
    ? [
        { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
        { to: "/employees",  icon: Users,           label: "Employees" },
        { to: "/attendance", icon: CalendarDays,    label: "Attendance" },
        { to: "/salaries",   icon: Banknote,        label: "Salaries" },
      ]
    : /* finance_manager / hr_manager */ [
        { to: "/dashboard",   icon: LayoutDashboard, label: "Home" },
        { to: "/employees",   icon: Users,           label: "Employees" },
        { to: "/salaries",    icon: Banknote,        label: "Salaries" },
        { to: "/expenses",    icon: Building2,       label: "Expenses" },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">More</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
