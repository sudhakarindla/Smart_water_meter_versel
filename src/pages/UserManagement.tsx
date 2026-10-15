import { useState, useMemo } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { Plus, Pencil, Trash2, UserCheck, UserX, Loader2,Eye, EyeOff, QrCode, } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { z } from "zod";
import { useMeterDetails, useMeterMutations, useMetersData, useGenerateQrMutation, useDownloadQrMutation } from "@/Tanstack/allTanstack";


// Import TanStack Hooks
import { useVendorsData, useVendorMutations } from "@/Tanstack/allTanstack";
interface UIMeter {
  id: string;
  numericId: number;
  vendor: string;
  location: string;
  rate: string;
  mobile: string;
  status: string;
  qr: string;
  qrImageUrl: string | null;
  totalCollected: number;
  settled: number;
  pending: number;
  transactions: number;
  total_refund_amount:number;
}

const meterSchema = z.object({
  meterCode: z.string().min(1, "Meter Code is required").max(100, "Max 100 characters"),
  vendor: z.string().min(1, "Company / Vendor Name is required").max(150, "Max 150 characters"),
  rate: z.string()
    .min(1, "Water Rate is required")
    .pipe(z.coerce.number().min(0.01, "Rate must be greater than 0")),
  mobile: z.coerce.string().min(1, "Vendor ID / Mobile is required"), 
  version: z.string().min(1, "Meter Version is required").max(255),
  apiKey: z.string().min(1, "API Key is required").max(255),
});


// ==========================================
// 1. ZOD SCHEMA (Matches vendors & vendor_bank_accounts in models.py)
// ==========================================
const vendorSchema = z.object({
  firstName: z.string().min(1, "First Name is required").max(100, "Max 100 characters"),
  lastName: z.string().min(1, "Last Name is required").max(100, "Max 100 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address").max(150, "Max 150 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits"),
  // Password is only required if we are NOT editing (checked conditionally during save)
  password: z.string().max(255).optional(), 
  aadhaarNumber: z.string()
    .min(1, "Aadhaar Number is required")
    .regex(/^[0-9]{12}$/, "Aadhaar must be exactly 12 digits"),
gstNumber: z.string()
  .length(15, "GST Number must be exactly 15 characters")
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 
    "Please enter a valid GST Number format (e.g., 22AAAAA0000A1Z5)"
  )
  .optional()
  .or(z.literal("")),
  
  // Bank Details
  accountHolderName: z.string().min(1, "Account Holder Name is required").max(150),
  accountNumber: z.string().regex(/^[0-9]{9,18}$/, "Invalid Account Number format").max(30),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code format").max(20),
  bankName: z.string().min(1, "Bank Name is required").max(150),
});

const UserManagement = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "admin";

  const [showModal, setShowModal] = useState(false);
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { addMeter, updateMeter, toggleStatus: MeterToggle, deleteMeter } = useMeterMutations();
    const { data: backendMeters, isLoading:meterLoading } = useMetersData(isAdmin);
      const generateQrMutation = useGenerateQrMutation();
        const meters: UIMeter[] = useMemo(() => {
          if (!backendMeters) return [];
          return backendMeters.map((m: any) => ({
            id: m.meter_unique_code || `MTR-${m.meter_id}`,
            numericId: m.meter_id, 
            vendor: m.company_name || 'Unknown Vendor',
            location: 'N/A', 
            rate: String(m.water_rate_per_liter) || "1",
            mobile: m.vendor_id ? String(m.vendor_id) : '',
            status: m.status || "active", 
            qr: m.qr_token || 'N/A',
            qrImageUrl: m.qr_image_url || null, 
            totalCollected: Number(m.total_amount_paid) || 0,
            settled: Math.round((Number(m.total_amount_paid) || 0) * 0.95),
            pending: Math.round((Number(m.total_amount_paid) || 0) * 0.05),
            transactions: 0,
            total_refund_amount: Number(m.total_refund_amount) || 0,
          }));
        }, [backendMeters]);


  
  // Form State
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    phone: "", 
    password: "",
    aadhaarNumber: "",
    gstNumber: "",
    location: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: ""
  });
    const [formMeter, setFormMeter] = useState({ 
    meterCode: "", 
    vendor: "", 
    location: "", 
    rate: "1", 
    mobile: "",
    version: "1.0",
    apiKey: "",
    // 👇 Changed from File to string path
    qrImagePath: ""
  });
    const [editMeter, setEditMeter] = useState<UIMeter | null>(null);
 const isDuplicateCode = !editMeter && 
    formMeter.meterCode.trim() !== "" && 
    meters.some(m => m.id.toLowerCase() === formMeter.meterCode.trim().toLowerCase());
  // Zod Error State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formMeterErrors, setFormMeterErrors] = useState<Record<string, string>>({});

  const { data: backendVendors, isLoading } = useVendorsData(isAdmin);
  const { addVendor, updateVendor, deleteVendor, updateStatus } = useVendorMutations();
  //const [editMeter, setEditMeter] = useState<UIMeter | null>(null);

  const users = useMemo(() => {
    if (!backendVendors) return [];
    return backendVendors.map((v: any) => ({
      id: v.id,
      name: `${v.first_name} ${v.last_name}`.trim(),
      email: v.email,
      mobile: v.phone,
      role: "vendor",
      status: v.is_active ? "active" : "suspended",
      joined: new Date(v.created_at).toISOString().split("T")[0],
      raw: v 
    }));
  }, [backendVendors]);

  // 👇 REAL-TIME DUPLICATE CHECKS
  // Check if email or phone already exists in another user's profile
  const isDuplicateEmail = users.some(u => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== editUser?.id);
  const isDuplicatePhone = users.some(u => u.mobile === form.phone.trim() && u.id !== editUser?.id);
const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();

  const openAddMeter = (u: any) => {
    setEditMeter(null);
    setFormMeterErrors({});
    setFormMeter({ 
      // meterCode: `MTR-${Math.floor(100000 + Math.random() * 900000)}`, 
     meterCode: `MTR-${uniqueId}`,
      vendor: u.name || "Unknown Vendor", 
      location: "", 
      rate: "1", 
      mobile: u.id || "",
      version: "1.0",
      apiKey: `KEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      qrImagePath: ""
    });
    setShowMeterModal(true);
  };

  const handleGenerateFormQr = () => {
    if (!formMeter.meterCode) {
      toast.error("Please enter a Meter Code first");
      return;
    }
    
    // 👇 Change this to pass the object with all 3 fields!
    generateQrMutation.mutate({
      meterCode: formMeter.meterCode,
      vendorId: formMeter.mobile || "Unknown Vendor",
      location: formMeter.location || "Unknown Location"
    }, {
      onSuccess: (data) => {
        setFormMeter(prev => ({ ...prev, qrImagePath: data.local_path }));
        toast.success("QR Generated & Path Saved!");
      },
      onError: (err: any) => toast.error(err)
    });
  };



  const openAdd = () => { 
    // Only clear the form if we were previously in "Edit" mode
    if (editUser !== null) {
      setForm({ 
        firstName: "", lastName: "", email: "", phone: "", password: "",
        aadhaarNumber: "", gstNumber: "", location: "",
        accountHolderName: "", accountNumber: "", ifscCode: "", bankName: ""
      }); 
    }
    setEditUser(null); 
    setFormErrors({});
    setShowModal(true); 
  };
  
  const openEdit = (u: any) => { 
    setEditUser(u); 
    setFormErrors({});
    setForm({ 
      firstName: u.raw.first_name || "", 
      lastName: u.raw.last_name || "", 
      email: u.raw.email || "", 
      phone: u.raw.phone || "", 
      password: "", // Keep blank on edit
      aadhaarNumber: u.raw.aadhaar_number || "", 
      gstNumber: u.raw.gst_number || "", 
      location: u.raw.location || "",
      accountHolderName: u.raw.account_holder_name || "", 
      accountNumber: u.raw.account_number || "", 
      ifscCode: u.raw.ifsc_code || "", 
      bankName: u.raw.bank_name || ""
    }); 
    setShowModal(true); 
  };

  const saveUser = () => {
    // 1. Check for duplicates first
    if (isDuplicateEmail || isDuplicatePhone) return;

    // 2. Clear previous errors
    setFormErrors({});

    // 3. Conditional Password Validation
    if (!editUser && !form.password) {
      setFormErrors(prev => ({ ...prev, password: "A temporary password is required for new vendors" }));
      return;
    } else if (!editUser && form.password.length < 8) {
      setFormErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
      return;
    }

    // 4. Zod Validation
    const result = vendorSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    // 5. Submit Form
    const formData = new FormData();
    formData.append("first_name", form.firstName);
    formData.append("last_name", form.lastName);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    if (form.password) formData.append("password_hash", form.password); 
    formData.append("aadhaar_number", form.aadhaarNumber);
    formData.append("gst_number", form.gstNumber);
    formData.append("location", form.location);
    formData.append("account_holder_name", form.accountHolderName);
    formData.append("account_number", form.accountNumber);
    formData.append("ifsc_code", form.ifscCode);
    formData.append("bank_name", form.bankName);

    if (editUser) {
      formData.append("vendor_id", String(editUser.id));
      updateVendor.mutate(formData, {
        onSuccess: (res: any) => { 
          if (res?.error) { toast.error(res.error); return; }
          toast.success("User updated!"); 
          setShowModal(false); 
        },
        onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to update user")
      });
    } else {
      addVendor.mutate(formData, {
        onSuccess: (res: any) => { 
          if (res?.error) { toast.error(res.error); return; }
          toast.success("Vendor added successfully and email sent!"); 
          setShowModal(false); 
          // Clear the form only after a successful save
          setForm({ 
            firstName: "", lastName: "", email: "", phone: "", password: "",
            aadhaarNumber: "", gstNumber: "", location: "",
            accountHolderName: "", accountNumber: "", ifscCode: "", bankName: ""
          });
        },
        onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to add vendor")
      });
    }
    };

  const confirmDelete = () => {
    if (deleteId) { 
      deleteVendor.mutate(deleteId, {
        onSuccess: (res: any) => { 
          if (res?.error) { toast.error(res.error); return; }
          toast.success("User deleted"); 
          setDeleteId(null); 
        },
        onError: () => toast.error("Failed to delete user")
      });
    }
  };

  const toggleStatus = (u: any) => {
    const newStatus = u.status === "active" ? false : true;
    updateStatus.mutate(
      { vendor_id: u.id, is_active: newStatus },
      {
        onSuccess: (res: any) => {
          if (res?.error) { toast.error(res.error); return; }
          toast.success(`User marked as ${newStatus ? 'Active' : 'Suspended'}`)
        },
        onError: () => toast.error("Failed to update status")
      }
    );
  };



   const saveMeter = () => {
    console.log("the method triggered",isDuplicateCode,formMeter.meterCode)
      if (isDuplicateCode) return;
  
      setFormMeterErrors({});
      const result = meterSchema.safeParse(formMeter);
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setFormMeterErrors(fieldErrors);
        return; 
      }
  
      const formData = new FormData();
      if (editMeter) {
        formData.append('meter_id', String(editMeter.numericId));
      }
      formData.append('meter_unique_code', formMeter.meterCode);
      formData.append('company_name', formMeter.vendor);
      formData.append('vendor_id', formMeter.mobile || "1"); 
      formData.append('water_rate_per_liter', formMeter.rate);
      formData.append('qr_token', `QR-${formMeter.meterCode}`);
      formData.append('meter_version', formMeter.version);
      formData.append('device_api_key', formMeter.apiKey);
      formData.append('last_seen_at', new Date().toISOString().slice(0, 19).replace('T', ' '));
      formData.append('min_dispense_liters', '1');
      formData.append('max_dispense_liters', '20');
  
      // 👇 Changed to send the local path string instead of a File object
      if (formMeter.qrImagePath) {
        formData.append('qr_image_path', formMeter.qrImagePath);
      }
  
      if (editMeter) {
        updateMeter.mutate(formData, {
          onSuccess: () => { toast.success("Meter updated!"); setShowMeterModal(false); },
          onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to update meter.";
            toast.error(msg);
          }
        });
      } else {
        addMeter.mutate(formData, {
          onSuccess: () => { toast.success("Meter added!"); setShowMeterModal(false); },
          onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to add meter.";
            toast.error(msg);
          }
        });
      }
    };
  // Helper for dynamic CSS
  const getInputClass = (error?: string | boolean) => `w-full bg-background/40 border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/10 transition-all ${error ? "border-coral-brand focus:border-coral-brand mb-1" : "border-border focus:border-primary mb-3.5"}`;

  if (!isAdmin) return <div className="p-10 text-center text-muted-foreground">Unauthorized Access</div>;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="text-sm text-muted-foreground">
          {isLoading ? <Loader2 className="w-4 h-4 inline animate-spin mr-2"/> : users.length} vendors registered
        </div>
        <button onClick={openAdd} className="gradient-primary text-primary-foreground font-bold text-sm rounded-lg px-4 py-2.5 shadow-glow hover:opacity-90 transition-opacity inline-flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Add Vendor
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
                {["ID", "Name", "Email", "Role", "Mobile", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && users.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading vendors...</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-emerald-brand">{u.id}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{u.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-lavender-subtle text-lavender-brand uppercase">{u.role}</span></td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{u.mobile}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.status === "active" ? "bg-emerald-subtle text-emerald-brand" : "bg-coral-subtle text-coral-brand"}`}>{u.status === "active" ? "● ACTIVE" : "● SUSPENDED"}</span></td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{u.joined}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleStatus(u)} disabled={updateStatus.isPending} className="p-1.5 rounded-md bg-secondary text-muted-foreground border border-border hover:text-foreground disabled:opacity-50">
                        {u.status === "active" ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      </button>
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-md bg-secondary text-emerald-brand border border-border"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-md bg-coral-subtle text-coral-brand border border-coral/20"><Trash2 className="w-3 h-3" /></button>
                      <button onClick={()=>openAddMeter(u)} className="p-1.5 rounded-md bg-secondary text-emerald-brand border border-border"><Plus className="w-3 h-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <Dialog open={showMeterModal} onOpenChange={setShowMeterModal}>
              <DialogContent className="bg-card border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-base font-extrabold">{editMeter ? `Edit Meter — ${editMeter.id}` : "Add New Water Meter"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-1 mt-2">
                  
                  {!editMeter && (
                    <div>
                      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Meter Unique Code</label>
                      <input value={formMeter.meterCode} onChange={(e) => setFormMeter({ ...formMeter, meterCode: e.target.value })} className={getInputClass(formMeterErrors.meterCode || isDuplicateCode)} />
                      
                      {formMeterErrors.meterCode && !isDuplicateCode && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formMeterErrors.meterCode}</p>}
                      {isDuplicateCode && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">⚠️ This Meter ID is already present in the database!</p>}
                    </div>
                  )}
      
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Vendor Name</label>
                    <input value={formMeter.vendor} onChange={(e) => setFormMeter({ ...formMeter, vendor: e.target.value })} placeholder="e.g. Ravi Enterprises" className={getInputClass(formMeterErrors.vendor)} />
                    {formMeterErrors.vendor && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formMeterErrors.vendor}</p>}
                  </div>
      
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Water Rate (₹ per liter)</label>
                    <input type="number" step="0.1" value={formMeter.rate} onChange={(e) => setFormMeter({ ...formMeter, rate: e.target.value })} className={getInputClass(formMeterErrors.rate)} />
                    {formMeterErrors.rate && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formMeterErrors.rate}</p>}
                  </div>
      
                  {!editMeter && (
                    <div>
                      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Vendor ID</label>
                      <input value={formMeter.mobile} onChange={(e) => setFormMeter({ ...formMeter, mobile: e.target.value })} placeholder="e.g. 9876543210" className={getInputClass(formMeterErrors.mobile)} />
                      {formMeterErrors.mobile && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.mobile}</p>}
                    </div>
                  )}
      
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Meter Version</label>
                      <input value={formMeter.version} onChange={(e) => setFormMeter({ ...formMeter, version: e.target.value })} placeholder="1.0" className={getInputClass(formMeterErrors.version)} />
                      {formMeterErrors.version && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formMeterErrors.version}</p>}
                    </div>
                    {!editMeter && (
                      <div>
                        <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Device API Key</label>
                        <input value={formMeter.apiKey} onChange={(e) => setFormMeter({ ...formMeter, apiKey: e.target.value })} placeholder="Generated Key" className={getInputClass(formMeterErrors.apiKey)} />
                        {formMeterErrors.apiKey && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formMeterErrors.apiKey}</p>}
                      </div>
                    )}
                  </div>
      
              {/* 👇 Form QR Generation Logic */}
                  <div className={`rounded-lg p-3 border mb-3.5 transition-colors ${!formMeter.qrImagePath ? "bg-coral-subtle/30 border-coral-brand/40" : "bg-surface2 border-border"}`}>
                    <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-2 flex items-center gap-2">
                      QR Code Status 
                      {!formMeter.qrImagePath && <span className="text-coral-brand normal-case tracking-normal font-bold">* Required</span>}
                    </label>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={handleGenerateFormQr}
                        disabled={generateQrMutation.isPending || !formMeter.meterCode}
                        className="bg-teal-subtle text-teal-brand border border-teal/20 text-xs font-bold px-3 py-2 rounded-md hover:bg-teal/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {generateQrMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                        {formMeter.qrImagePath ? "Regenerate QR" : "Generate QR"}
                      </button>
                      {formMeter.qrImagePath ? (
                        <span className="text-[11px] text-emerald-brand font-mono truncate bg-emerald-subtle px-2 py-1 rounded">Path Secured</span>
                      ) : (
                        <span className="text-[11px] text-coral-brand font-medium">Please generate a QR code</span>
                      )}
                    </div>
                  </div>
      <button 
                    onClick={saveMeter} 
                    disabled={addMeter.isPending || updateMeter.isPending || isDuplicateCode || !formMeter?.qrImagePath} 
                    className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 inline-flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    {(addMeter.isPending || updateMeter.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} 
                    {editMeter ? "Save Changes" : "Create Meter"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
       <DialogContent 
  onInteractOutside={(e) => e.preventDefault()} 
  className="bg-card border-primary/20 max-w-3xl max-h-[90vh] overflow-y-auto"
>
          <DialogHeader><DialogTitle>{editUser ? `Edit Vendor — V-${editUser.id}` : "Add New Vendor"}</DialogTitle></DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* Personal Details */}
            <div className="col-span-1 sm:col-span-2 border-b border-border pb-2"><h4 className="text-xs font-bold text-primary uppercase tracking-widest">Personal Details</h4></div>
            
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">First Name *</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={getInputClass(formErrors.firstName)} />
              {formErrors.firstName && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.firstName}</p>}
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Last Name *</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={getInputClass(formErrors.lastName)} />
              {formErrors.lastName && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.lastName}</p>}
            </div>
            
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={getInputClass(formErrors.email || isDuplicateEmail)} />
              {formErrors.email && !isDuplicateEmail && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.email}</p>}
              {isDuplicateEmail && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">⚠️ This email is already registered!</p>}
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Phone *</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={getInputClass(formErrors.phone || isDuplicatePhone)} />
              {formErrors.phone && !isDuplicatePhone && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.phone}</p>}
              {isDuplicatePhone && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">⚠️ This phone number is already registered!</p>}
            </div>
            
           <div>
  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">
    {editUser ? "New Password (Leave blank to keep)" : "Temporary Password *"}
  </label>
  <div className="relative">
    <input 
      type={showPassword ? "text" : "password"} 
      value={form.password} 
      onChange={(e) => setForm({ ...form, password: e.target.value })} 
      placeholder="••••••••" 
      className={`${getInputClass(formErrors.password)} pr-10`} 
    />
    <button 
      type="button" 
      onClick={() => setShowPassword(!showPassword)} 
      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
  {formErrors.password && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.password}</p>}
</div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, State" className={getInputClass(formErrors.location)} />
              {formErrors.location && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.location}</p>}
            </div>

            {/* Identity & Taxation */}
            <div className="col-span-1 sm:col-span-2 border-b border-border pb-2 mt-2"><h4 className="text-xs font-bold text-primary uppercase tracking-widest">Identity & Taxation</h4></div>
            
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Aadhaar Number *</label>
              <input 
                value={form.aadhaarNumber} 
                required 
                maxLength={12} // 👈 Stops them at 12 characters
                onChange={(e) => {
                  // 👈 Instantly removes letters/symbols as they type
                  const onlyNumbers = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, aadhaarNumber: onlyNumbers });
                }} 
                className={getInputClass(formErrors.aadhaarNumber)} 
              />
              {formErrors.aadhaarNumber && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.aadhaarNumber}</p>}
            </div>
           <div>
  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">GST Number (Optional)</label>
  <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className={getInputClass(formErrors.gstNumber)} />
  {formErrors.gstNumber && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.gstNumber}</p>}
</div>

            {/* Bank Details */}
            <div className="col-span-1 sm:col-span-2 border-b border-border pb-2 mt-2"><h4 className="text-xs font-bold text-primary uppercase tracking-widest">Bank Details</h4></div>
            
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Account Holder Name *</label>
              <input value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} className={getInputClass(formErrors.accountHolderName)} />
              {formErrors.accountHolderName && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.accountHolderName}</p>}
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Account Number *</label>
              <input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className={getInputClass(formErrors.accountNumber)} />
              {formErrors.accountNumber && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.accountNumber}</p>}
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">IFSC Code *</label>
              <input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} className={getInputClass(formErrors.ifscCode)} />
              {formErrors.ifscCode && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.ifscCode}</p>}
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Bank Name *</label>
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className={getInputClass(formErrors.bankName)} />
              {formErrors.bankName && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.bankName}</p>}
            </div>

            {/* Save Button */}
            <div className="col-span-1 sm:col-span-2 mt-4">
              <button 
                onClick={saveUser} 
                disabled={addVendor.isPending || updateVendor.isPending || isDuplicateEmail || isDuplicatePhone} 
                className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
              >
                {addVendor.isPending || updateVendor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editUser ? "Save Changes" : "Add Vendor"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-destructive/20">
          <AlertDialogHeader><AlertDialogTitle>Delete Vendor?</AlertDialogTitle><AlertDialogDescription>This will permanently remove vendor <strong>V-{deleteId}</strong> and all associated data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteVendor.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteVendor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
