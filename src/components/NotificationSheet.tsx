import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, CheckCircle, AlertTriangle, Info, MessageSquare } from "lucide-react";

// Helper to define styles based on the type we assign
const typeStyles: Record<string, string> = {
  success: "text-emerald-brand bg-emerald-subtle",
  warning: "text-gold-brand bg-teal-subtle",
  info: "text-lavender-brand bg-lavender-subtle",
};

// This component now accepts 'notifications' as a prop from AppLayout
const NotificationSheet = ({ 
  open, 
  onOpenChange, 
  notifications = [] 
}: { 
  open: boolean; 
  onOpenChange: (v: boolean) => void;
  notifications?: any[]; // The real data from your backend
}) => {
  
  // Transform your backend "Issues" into UI "Notifications"
  const displayNotifications = notifications.map((n: any) => ({
    id: n.id,
    type: n.status === "resolved" ? "success" : "info",
    title: n.status === "resolved" ? "Update Approved" : "Ticket Raised",
    desc: n.status === "resolved" ? n.admin_response : n.message,
    time: new Date(n.updated_at || n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    icon: n.status === "resolved" ? CheckCircle : MessageSquare,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px] bg-card border-l border-border p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="text-base font-extrabold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notifications
            {displayNotifications.length > 0 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {displayNotifications.length} NEW
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(100vh-70px)] divide-y divide-border/30">
          {displayNotifications.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground italic">
              No new notifications
            </div>
          ) : (
            displayNotifications.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="px-5 py-4 hover:bg-primary/[0.025] transition-colors cursor-pointer border-l-2 border-l-transparent hover:border-l-primary">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${typeStyles[n.type]}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.desc}</div>
                      <div className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono">{n.time}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationSheet;