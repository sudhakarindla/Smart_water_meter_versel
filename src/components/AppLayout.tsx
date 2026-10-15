import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { logout } from "@/lib/store/authSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { Droplet, LayoutGrid, Clock, List, DollarSign, FileText, Settings, Users, LogOut, ChevronLeft, ChevronRight, Bell, Gauge, MessageSquare, User } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationSheet from "@/components/NotificationSheet";
import { useState } from "react";
import { toast } from "sonner";
import { useVendorIssuesData } from "@/Tanstack/allTanstack";

const adminNav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
  { id: "meters", label: "Meter Management", icon: Clock, path: "/meters" },
  { id: "transactions", label: "Transactions", icon: List, path: "/transactions" },
  { id: "settlements", label: "Settlements", icon: DollarSign, path: "/settlements" },
  { id: "users", label: "User Management", icon: Users, path: "/users" },
  { id: "support", label: "Support Tickets", icon: MessageSquare, path: "/support-tickets" }, 
  { id: "reports", label: "Reports", icon: FileText, path: "/reports" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  { id: "profile", label: "Profile Page", icon: User, path: "/Profile-page" },
  { id: "manual-settlement", label: "Manual Settlement", icon: DollarSign, path: "/Manual-Settlement" },

];

const vendorNav = [
  { id: "dashboard", label: "Overview", icon: LayoutGrid, path: "/dashboard" },
  { id: "my-meters", label: "My Meters", icon: Gauge, path: "/my-meters" },
  { id: "transactions", label: "My Transactions", icon: List, path: "/transactions" },
  { id: "settlements", label: "My Settlements", icon: DollarSign, path: "/settlements" },
  {id:"vendor-issues", label:"Help & Support",icon:MessageSquare,path:"/vendor-issues"},
  { id: "settings", label: "Profile & KYC", icon: Settings, path: "/settings" },
   {id:"watersettingspage", label:"Water Settings",icon: Settings,path:'/watersettings'}
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const user = useAppSelector((s) => s.auth.user);
  const isVendor = user?.role !== "admin";
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
const { data: notifications } = useVendorIssuesData(isVendor);

  const navItems = user?.role === "admin" ? adminNav : vendorNav;
  const currentPath = location.pathname;
  // 1. Fetch the notifications (using the hook we discussed earlier)
// const { data: issues } = useVendorNotifications(user?.id || 0, user?.role === "vendor");
//   const resolvedIssues = issues?.filter((i: any) => i.status === "resolved") || [];
const resolvedIssues = notifications?.filter((n: any) => n.status === 1 || n.admin_response !== null) || [];

  const pageLabels: Record<string, string> = {
    "/dashboard": user?.role === "admin" ? "Dashboard" : "Overview",
    "/meters": "Meter Management",
    "/my-meters": "My Meters",
    "/transactions": user?.role === "admin" ? "Transactions" : "My Transactions",
    "/settlements": user?.role === "admin" ? "Settlements" : "My Settlements",
    "/users": "User Management",
    "/support-tickets": "Support Tickets",
    "/reports": "Reports",
    "/settings": user?.role === "admin" ? "Settings" : "Profile & KYC",
    '/profile-page': "Profile",
    '/vendor-issues':'Help & Support',
    '/watersettings':"Water Settings",
    '/Manual-Settlement': "Manual Settlement"
  };
  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="flex h-screen relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(circle, hsl(195 100% 50% / 0.06), transparent 70%)" }} />
      <div className="fixed bottom-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full pointer-events-none z-0" style={{ background: "radial-gradient(circle, hsl(187 80% 58% / 0.04), transparent 70%)" }} />

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-background/80 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`flex flex-col bg-sidebar border-r border-sidebar-border z-30 transition-all duration-300 overflow-hidden
        ${collapsed ? "w-16 min-w-16" : "w-60 min-w-60"}
        fixed lg:relative h-full
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-3 shrink-0">
          <div className="w-[34px] h-[34px] rounded-lg gradient-primary shadow-glow flex items-center justify-center shrink-0">
            <Droplet className="w-[18px] h-[18px] text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-extrabold tracking-wide text-primary">Rive Smart Meter</div>
              <div className="text-[10px] text-muted-foreground font-mono">Water Payment System</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden space-y-0.5">
          {navItems.map((item) => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border-l-2
                  ${active ? "bg-emerald-subtle text-emerald-brand font-bold border-l-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground border-l-transparent"}
                `}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-sidebar-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-coral-brand hover:bg-coral-subtle transition-all border-l-2 border-l-transparent">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse */}
        <button onClick={() => setCollapsed(!collapsed)} className="m-2 p-2.5 rounded-lg border border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center shrink-0">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        {/* Header */}
        <header className="px-4 md:px-6 h-[60px] border-b border-border bg-background/90 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg border border-border text-muted-foreground">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">{pageLabels[currentPath] || "Dashboard"}</h1>
              <div className="text-[11px] text-muted-foreground font-mono">{user?.role === "admin" ? "Admin Portal" : "Vendor Portal"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <button onClick={() => setNotifOpen(true)} className="bg-surface2 border border-border text-muted-foreground rounded-lg p-2 relative hover:text-foreground transition-colors">
    <Bell className="w-4 h-4" />
    {resolvedIssues.length > 0 && (
      <span className="absolute top-[7px] right-[7px] w-1.5 h-1.5 rounded-full bg-coral border border-background" />
    )}
    
  </button>
           <div
    className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-primary/30 transition-colors"
    onClick={() => navigate(user?.role === "vendor" ? "/settings" : "/Profile-page")}
  >
              {/* Uses the first letter of their real name for the Avatar */}
              <div className="w-[26px] h-[26px] rounded-full gradient-primary flex items-center justify-center text-[11px] font-extrabold text-primary-foreground shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              
              <div className="hidden sm:block text-left">
                {/* Displays the Real Name from the DB */}
                <div className="text-xs font-bold leading-tight capitalize">
                  {user?.name || "Loading..."}
                </div>
                {/* Displays the Real Email from the DB */}
                <div className="text-[10px] text-muted-foreground font-mono leading-tight mb-0.5">
                  {user?.email || ""}
                </div>
                <div className={`text-[9px] font-extrabold uppercase tracking-widest ${user?.role === "admin" ? "text-emerald-brand" : "text-lavender-brand"}`}>
                  {user?.role === "admin" ? "Administrator" : "Vendor"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>

      {/* Notification Sheet */}
      <NotificationSheet 
  open={notifOpen} 
  onOpenChange={setNotifOpen} 
  notifications={resolvedIssues} // Pass real data here!
/>
    </div>
  );
};

export default AppLayout;
