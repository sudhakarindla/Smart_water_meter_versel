import { useAppSelector } from "@/lib/store/hooks";
import { useAdminProfileData } from "@/Tanstack/allTanstack";
import { User, Mail, Phone, ShieldCheck, Loader2 } from "lucide-react";

const AdminProfile = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "admin";
  const adminId = user?.id || 0; // Fallback to 0 to prevent crashes, hook will skip if not valid

  // 👇 Fetch the profile data using the new TanStack hook
  const { data: profile, isLoading } = useAdminProfileData(adminId, isAdmin);

  if (!isAdmin) {
    return <div className="p-10 text-center text-muted-foreground">Unauthorized Access</div>;
  }

  if (isLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-muted-foreground animate-pulse gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm font-mono">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-5">
      <div className="bg-card border border-border rounded-xl p-6 shadow-card relative overflow-hidden">
        
        {/* Background glow effect to make it look premium */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-brand/5 rounded-bl-full pointer-events-none" />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-2xl font-extrabold text-primary-foreground shadow-glow shrink-0">
            {profile?.first_name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground capitalize">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-brand" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-brand bg-emerald-subtle px-2 py-0.5 rounded-md border border-emerald-brand/20">
                System Administrator
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-surface2 rounded-lg border border-border">
            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Full Name</div>
              <div className="text-sm font-semibold text-foreground capitalize">
                {profile?.first_name} {profile?.last_name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface2 rounded-lg border border-border">
            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Email Address</div>
              <div className="text-sm font-mono text-foreground">
                {profile?.email || "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface2 rounded-lg border border-border">
            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Phone Number</div>
              <div className="text-sm font-mono text-foreground">
                {profile?.phone || "N/A"}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;