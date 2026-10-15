////////   DOWNLOAD QR BUTTON ADDED


import { useState, useEffect } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { DollarSign, User, Loader2, QrCode, DownloadCloud } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod"; 
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  useSettingsData, 
  useUpdateCommission, 
  useVendorProfileData,
  useDownloadQrMutation // 👈 Import the new mutation
} from "@/Tanstack/allTanstack";

const adminConfigSchema = z.object({
  daily: z.string()
    .min(1, "Daily commission is required")
    .pipe(z.coerce.number().min(0, "Cannot be negative").max(100, "Max is 100%")), 
  immediate: z.string()
    .min(1, "Immediate commission is required") 
    .pipe(z.coerce.number().min(0, "Cannot be negative").max(100, "Max is 100%")),
});

const SettingsPage = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "admin";
  const isVendor = !isAdmin;
  const vendorId = user?.id || 1;

  // --- ADMIN STATE ---
  const [daily, setDaily] = useState("0");
  const [immediate, setImmediate] = useState("0");
  const [adminErrors, setAdminErrors] = useState<Record<string, string>>({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const { data: backendPercentages, isLoading: isAdminLoading } = useSettingsData(isAdmin);
  const updateCommission = useUpdateCommission();

  useEffect(() => {
    if (backendPercentages) {
      const dailyData = backendPercentages.find((p: any) => p.commission_type === 'daily');
      const immediateData = backendPercentages.find((p: any) => p.commission_type === 'immediate');
      if (dailyData) setDaily(String(dailyData.percentage));
      if (immediateData) setImmediate(String(immediateData.percentage));
    }
  }, [backendPercentages]);

  const handleAdminSaveClick = () => {
    setAdminErrors({});
    const result = adminConfigSchema.safeParse({ daily, immediate });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setAdminErrors(fieldErrors);
      return;
    }
    setShowSaveConfirm(true); 
  };

  const saveConfig = () => {
    updateCommission.mutate({
      daily: "daily", daily_percentage: Number(daily), immediate: "immediate", immediate_percentage: Number(immediate), updated_by: String(user?.id || "admin")
    }, {
      onSuccess: () => { toast.success("Settlement configuration saved to database!"); setShowSaveConfirm(false); },
      onError: () => { toast.error("Failed to save configuration."); setShowSaveConfirm(false); }
    });
  };

  // --- VENDOR STATE (READ-ONLY + QR) ---
  const { data: vendorProfile, isLoading: isVendorLoading } = useVendorProfileData(vendorId, isVendor);
  const downloadQrMutation = useDownloadQrMutation(); // 👈 Initialize mutation
  
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrMeterId, setQrMeterId] = useState("");

  const [vProfile, setVProfile] = useState({
    firstName: "", lastName: "", mobile: "", email: "", gst: "", aadhaar: "", location: ""
  });

  const [vBank, setVBank] = useState({
    holderName: "", bankName: "", accNum: "", ifsc: ""
  });

  // Sync vendor backend data to inputs
  useEffect(() => {
    if (vendorProfile) {
      setVProfile({
        firstName: vendorProfile.first_name || "",
        lastName: vendorProfile.last_name || "",
        mobile: vendorProfile.phone || "",
        email: vendorProfile.email || "",
        gst: vendorProfile.gst_number || "",
        aadhaar: vendorProfile.aadhaar_number || "",
        location: vendorProfile.location || ""
      });
      setVBank({
        holderName: vendorProfile.account_holder_name || "",
        bankName: vendorProfile.bank_name || "",
        accNum: vendorProfile.account_number || "",
        ifsc: vendorProfile.ifsc_code || ""
      });
    }
  }, [vendorProfile]);

  // 👇 Handler for downloading the QR Blob
  const handleDownloadQr = () => {
    if (!qrMeterId.trim()) {
      toast.error("Please enter a Meter ID");
      return;
    }

    downloadQrMutation.mutate(qrMeterId.trim(), {
      onSuccess: (blobData) => {
        // Create a fake URL for the blob and force the browser to download it
        const url = window.URL.createObjectURL(new Blob([blobData]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${qrMeterId.trim()}.png`); // Name the file
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url); // Clean up memory

        toast.success("QR Code downloaded successfully!");
        setShowQrModal(false);
        setQrMeterId("");
      },
      onError: () => {
        toast.error("Failed to download. Ensure the Meter ID is correct and the QR exists.");
      }
    });
  };

  // Helper for dynamic CSS (Admin only)
  const getInputClass = (error?: string) => `w-full bg-background/40 border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/10 mb-1 transition-all ${error ? "border-coral-brand focus:border-coral-brand" : "border-border focus:border-primary mb-3.5"}`;

  // Helper for disabled vendor inputs
  const disabledInputClass = "w-full bg-background/40 border border-border rounded-lg px-3.5 py-2.5 text-sm text-muted-foreground outline-none mb-3.5 opacity-70 cursor-not-allowed";

  // ==========================================
  // ADMIN VIEW RENDER
  // ==========================================
  if (isAdmin) {
    if (isAdminLoading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading Settings...</div>;

    return (
      <div className="animate-fade-in max-w-2xl space-y-4">
        {/* Settlement Config */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm font-bold mb-5 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-brand" /> Settlement Configuration</div>
          
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Daily Settlement Commission (%)</label>
          <input type="number" value={daily} onChange={(e) => setDaily(e.target.value)} className={getInputClass(adminErrors.daily)} />
          {adminErrors.daily && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{adminErrors.daily}</p>}
          {!adminErrors.daily && <div className="text-[11px] text-muted-foreground mb-3.5">Deducted on automatic midnight settlements</div>}
          
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Immediate Settlement Commission (%)</label>
          <input type="number" value={immediate} onChange={(e) => setImmediate(e.target.value)} className={getInputClass(adminErrors.immediate)} />
          {adminErrors.immediate && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{adminErrors.immediate}</p>}
          {!adminErrors.immediate && <div className="text-[11px] text-muted-foreground mb-3.5">Deducted on vendor-requested instant settlements</div>}
          
          <button onClick={handleAdminSaveClick} disabled={updateCommission.isPending} className="gradient-primary text-primary-foreground font-bold text-sm rounded-lg px-4 py-2.5 shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2">
            {updateCommission.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Configuration
          </button>
        </div>

        <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
          <AlertDialogContent className="bg-card border-primary/20">
            <AlertDialogHeader>
              <AlertDialogTitle>Save Configuration?</AlertDialogTitle>
              <AlertDialogDescription>This will update settlement commission rates to Daily: {daily}%, Immediate: {immediate}%.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-muted-foreground">Cancel</AlertDialogCancel>
              <AlertDialogAction className="gradient-primary text-primary-foreground shadow-glow" onClick={saveConfig}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ==========================================
  // VENDOR VIEW RENDER (STATIC)
  // ==========================================
  if (isVendorLoading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading Profile...</div>;
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-4 relative">
      
      {/* 👇 Header with Download QR Button in the top right */}
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-lg font-extrabold tracking-tight">Vendor Settings</h2>
        {/* <button 
          onClick={() => setShowQrModal(true)}
          className="bg-emerald-subtle text-emerald-brand border border-emerald/20 hover:bg-emerald/20 transition-colors text-[11px] font-bold uppercase tracking-widest rounded-lg px-3 py-2 flex items-center gap-2"
        >
          <QrCode className="w-3.5 h-3.5" />
          Download QR
        </button> */}
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <div className="text-sm font-bold mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-brand" /> Profile & KYC 
          {/* {vendorProfile?.kyc_status && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto uppercase tracking-widest ${vendorProfile.kyc_status === 'verified' ? 'bg-emerald-subtle text-emerald-brand' : 'bg-gold-subtle text-gold-brand'}`}>
              KYC: {vendorProfile.kyc_status}
            </span>
          )} */}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">First Name</label>
            <input value={vProfile.firstName} disabled className={disabledInputClass} />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Last Name</label>
            <input value={vProfile.lastName} disabled className={disabledInputClass} />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Email</label>
          <input type="email" value={vProfile.email} disabled className={disabledInputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Mobile</label>
            <input value={vProfile.mobile} disabled className={disabledInputClass} />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Location</label>
            <input value={vProfile.location} disabled className={disabledInputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">GST Number</label>
            <input value={vProfile.gst} disabled className={disabledInputClass} />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Aadhaar Number</label>
            <input value={vProfile.aadhaar} disabled className={disabledInputClass} />
          </div>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <div className="text-sm font-bold mb-5 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-brand" /> Bank Details for Settlement</div>
          {/* {vendorProfile?.is_verified && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-subtle text-emerald-brand uppercase tracking-widest">Verified</span>
          )} */}
        </div>
        
        <div>
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Account Holder Name</label>
          <input value={vBank.holderName} disabled className={disabledInputClass} />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Bank Name</label>
          <input value={vBank.bankName} disabled className={disabledInputClass} />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Account Number</label>
          <input value={vBank.accNum} disabled className={disabledInputClass} />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">IFSC Code</label>
          <input value={vBank.ifsc} disabled className={disabledInputClass} />
        </div>
      </div>

      {/* 👇 QR Download Modal */}
      {/* <Dialog open={showQrModal} onOpenChange={(open) => { setShowQrModal(open); if(!open) setQrMeterId(""); }}>
        <DialogContent className="bg-card border-primary/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
              <DownloadCloud className="w-4 h-4 text-primary" /> Download QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Enter Meter ID</label>
              <input 
                type="text" 
                value={qrMeterId}
                onChange={(e) => setQrMeterId(e.target.value)}
                placeholder="e.g. MTR006"
                className="w-full bg-background/40 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                autoFocus
              />
            </div>
            <button 
              onClick={handleDownloadQr}
              disabled={!qrMeterId.trim() || downloadQrMutation.isPending}
              className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-2.5 shadow-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              {downloadQrMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
              {downloadQrMutation.isPending ? "Downloading..." : "Download File"}
            </button>
          </div>
        </DialogContent>
      </Dialog> */}

    </div>
  );
};

export default SettingsPage;