import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, CreditCard, Settings, LogOut, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { to: "/organizations", icon: Building2,        label: "Organizations" },
  { to: "/plans",         icon: CreditCard,       label: "Plans" },
  { to: "/settings",      icon: Settings,         label: "Settings" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { admin, logout } = useAuth();

  const linkClass = (to: string) => {
    const isActive = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
    return cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-sidebar-active text-sidebar-active-foreground"
        : "text-sidebar-foreground hover:bg-sidebar-hover"
    );
  };

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate("/login");
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-active flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-sidebar-active-foreground" />
          </div>
          <div>
            <h1 className="text-sidebar-active-foreground font-semibold text-base leading-tight">Super Admin</h1>
            <p className="text-xs text-sidebar-foreground/60">Platform Control</p>
          </div>
        </div>

        {admin && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-sidebar-active flex items-center justify-center text-[11px] font-bold text-sidebar-active-foreground shrink-0">
                {admin.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{admin.email}</p>
                <p className="text-[10px] text-sidebar-foreground/50">Super Administrator</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={linkClass(to)}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-destructive hover:bg-destructive/10 w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50">© 2026 Team Manager</p>
        </div>
      </aside>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>Are you sure you want to logout from the super admin panel?</DialogDescription>
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

export default AppSidebar;
