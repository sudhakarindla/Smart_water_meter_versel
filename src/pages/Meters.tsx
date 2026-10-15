import { useState, useMemo } from "react";
import { fmt } from "@/lib/data";
import { Plus, MapPin, QrCode, Zap, ZapOff, Pencil, Trash2, Eye, Search, Loader2, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMeterDetails, useMeterMutations, useMetersData, useGenerateQrMutation, useDownloadQrMutation } from "@/Tanstack/allTanstack";
import { useAppSelector } from "@/lib/store/hooks";
import { z } from "zod"; 

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

type SortDir = "asc" | "desc" | "none";

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

const Meters = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "admin";

  const { data: backendMeters, isLoading } = useMetersData(isAdmin);
  const { addMeter, updateMeter, toggleStatus, deleteMeter } = useMeterMutations();
  // 👇 Initialize the new QR mutation
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

  const activeCount = meters.filter((m) => m.status === "active").length;
  const inactiveCount = meters.length - activeCount;

  const [showModal, setShowModal] = useState(false);
  const [editMeter, setEditMeter] = useState<UIMeter | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null); 
  const [qrMeter, setQrMeter] = useState<UIMeter | null>(null);
  const [detailMeter, setDetailMeter] = useState<UIMeter | null>(null);
  
  const [form, setForm] = useState({ 
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
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [detailSearch, setDetailSearch] = useState("");
  const [detailSort, setDetailSort] = useState<SortDir>("none");
  // const [activeGeneratingId, setActiveGeneratingId] = useState<string | null>(null); // Track which card is generating QR

  const { data: meterPayments, isLoading: isDetailLoading } = useMeterDetails(detailMeter?.numericId);

  const isDuplicateCode = !editMeter && 
    form.meterCode.trim() !== "" && 
    meters.some(m => m.id.toLowerCase() === form.meterCode.trim().toLowerCase());
const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const openAdd = () => {
    setEditMeter(null);
    setFormErrors({});
    setForm({ 
      // meterCode: `MTR-${Math.floor(100000 + Math.random() * 900000)}`, 
     meterCode: `MTR-${uniqueId}`,
      vendor: "", 
      location: "", 
      rate: "1", 
      mobile: "",
      version: "1.0",
      apiKey: `KEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      qrImagePath: ""
    });
    setShowModal(true);
  };

  const openEdit = (m: UIMeter) => {
    setEditMeter(m);
    setFormErrors({});
    setForm({ 
      meterCode: m.id,
      vendor: m.vendor, 
      location: m.location, 
      rate: String(m.rate), 
      mobile: String(m.mobile || "1"),
      version: "1.0",
      apiKey: "HIDDEN_FOR_SECURITY", 
      qrImagePath: m.qrImageUrl || "" 
    });
    setShowModal(true);
  };

  // 👇 Function to generate QR inside the form
const handleGenerateFormQr = () => {
    if (!form.meterCode) {
      toast.error("Please enter a Meter Code first");
      return;
    }
    
    // 👇 Change this to pass the object with all 3 fields!
    generateQrMutation.mutate({
      meterCode: form.meterCode,
      vendorId: form.mobile || "Unknown Vendor",
      location: form.location || "Unknown Location"
    }, {
      onSuccess: (data) => {
        setForm(prev => ({ ...prev, qrImagePath: data.local_path }));
        toast.success("QR Generated & Path Saved!");
      },
      onError: (err: any) => toast.error(err)
    });
  };

  // 👇 Function to generate QR directly from the Meter Card
// const handleGenerateCardQr = (m: UIMeter) => {
//     setActiveGeneratingId(m.id);
    
//     generateQrMutation.mutate({
//       meterCode: m.id,
//       vendorId: m.mobile || "Unknown Vendor",
//       location: m.location || "Unknown Location"
//     }, {
//       onSuccess: (data) => {
//         // 1. QR is generated! Now let's save that path to the database.
//         const formData = new FormData();
//         formData.append('meter_id', String(m.numericId));
//         formData.append('meter_unique_code', m.id);
//         formData.append('company_name', m.vendor);
//         formData.append('vendor_id', m.mobile || "1"); 
//         formData.append('water_rate_per_liter', m.rate);
//         formData.append('qr_token', m.qr);
//         formData.append('meter_version', "1.0");
//         formData.append('device_api_key', "HIDDEN");
//         formData.append('qr_image_path', data.local_path); // 👈 The new path!

//         // 2. Silently update the backend
//         updateMeter.mutate(formData, {
//           onSuccess: () => {
//             toast.success(`QR Generated & Saved for ${m.id}!`);
//             setActiveGeneratingId(null);
//           },
//           onError: () => {
//             toast.error("Generated QR, but failed to link it to the meter.");
//             setActiveGeneratingId(null);
//           }
//         });
//       },
//       onError: (err: any) => { 
//         toast.error(err); 
//         setActiveGeneratingId(null);
//       }
//     });
//   };
  
  const saveMeter = () => {
   console.log("the method test", form.meterCode.trim() ,
    meters.some(m => m.id.toLowerCase() === form.meterCode.trim().toLowerCase()))
    if (isDuplicateCode) return;

    setFormErrors({});
    const result = meterSchema.safeParse(form);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setFormErrors(fieldErrors);
      return; 
    }

    const formData = new FormData();
    if (editMeter) {
      formData.append('meter_id', String(editMeter.numericId));
    }
    formData.append('meter_unique_code', form.meterCode);
    formData.append('company_name', form.vendor);
    formData.append('vendor_id', form.mobile || "1"); 
    formData.append('water_rate_per_liter', form.rate);
    formData.append('qr_token', `QR-${form.meterCode}`);
    formData.append('meter_version', form.version);
    formData.append('device_api_key', form.apiKey);
    formData.append('last_seen_at', new Date().toISOString().slice(0, 19).replace('T', ' '));
    formData.append('min_dispense_liters', '1');
    formData.append('max_dispense_liters', '20');

    // 👇 Changed to send the local path string instead of a File object
    if (form.qrImagePath) {
      formData.append('qr_image_path', form.qrImagePath);
    }

    if (editMeter) {
      updateMeter.mutate(formData, {
        onSuccess: () => { toast.success("Meter updated!"); setShowModal(false); },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to update meter.";
          toast.error(msg);
        }
      });
    } else {
      addMeter.mutate(formData, {
        onSuccess: () => { toast.success("Meter added!"); setShowModal(false); },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to add meter.";
          toast.error(msg);
        }
      });
    }
  };

  const handleToggleStatus = (m: UIMeter) => {
    const nextStatus = m.status === "active" ? "inactive" : "active";
    toggleStatus.mutate({ meter_id: m.numericId, status: nextStatus });
  };

  const confirmDelete = () => {
    if (deleteId) { 
      deleteMeter.mutate(deleteId, {
        onSuccess: (res: any) => { 
          if (res?.error) { toast.error(res.error); return; }
          toast.success("Meter deleted successfully!"); 
          setDeleteId(null); 
        },
        onError: () => toast.error("Failed to delete meter.")
      });
    }
  };

  const filteredDetailRows = useMemo(() => {
    if (!meterPayments) return [];
    let rows = meterPayments.map((p: any) => ({
      id: p.payment_id || `TXN-${Math.random().toString().slice(2, 6)}`,
      date: p.created_at || "N/A",
      collected: Number(p.amount_paid) || 0,
      liters: p.liters_calculated,
      status: p.payment_status,
      method: p.payment_method
    }));

    if (detailSearch) rows = rows.filter((r: any) => r.id.toLowerCase().includes(detailSearch.toLowerCase()) || r.date.includes(detailSearch));
    if (detailSort === "asc") rows.sort((a: any, b: any) => a.collected - b.collected);
    if (detailSort === "desc") rows.sort((a: any, b: any) => b.collected - a.collected);
    
    return rows;
  }, [meterPayments, detailSearch, detailSort]);

  const getInputClass = (error?: string | boolean) => `w-full bg-background/40 border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/10 transition-all ${error ? "border-coral-brand focus:border-coral-brand mb-1" : "border-border focus:border-primary mb-3.5"}`;

  if (isLoading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading Meters...</div>;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
          {/* <span className="text-emerald-brand bg-emerald-subtle px-3 py-1.5 rounded-lg border border-emerald-subtle">
            ● {activeCount} Active
          </span>
          <span className="text-coral-brand bg-coral-subtle px-3 py-1.5 rounded-lg border border-coral/20">
            ● {inactiveCount} Inactive
          </span> */}
          <span className="text-coral-brand ml-1 normal-case tracking-normal">
            (Total {meters.length} Meters)
          </span>
        </div>
        {/*<button onClick={openAdd} className="gradient-primary text-primary-foreground font-bold text-sm rounded-lg px-4 py-2.5 shadow-glow hover:opacity-90 inline-flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Add New Meter
        </button>*/}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {meters.map((m) => (
          <div key={m.id} className={`bg-card border rounded-xl p-4 shadow-card hover:border-primary/20 transition-all ${m.status === "active" ? "border-emerald-subtle" : "border-border"}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-emerald-brand text-sm font-bold">{m.id}</span>
                  {/* <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.status === "active" ? "bg-emerald-subtle text-emerald-brand" : "bg-coral-subtle text-coral-brand"}`}>
                    {m.status === "active" ? "● ACTIVE" : "● OFFLINE"}
                  </span> */}
                </div>
                <div className="text-sm font-semibold mb-0.5">{m.vendor}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setDetailMeter(m); setDetailSearch(""); }} className="p-1.5 rounded-md bg-lavender-subtle text-lavender-brand border border-lavender/20"><Eye className="w-3 h-3" /></button>
                {/* <button 
                  onClick={() => handleToggleStatus(m)} 
                  disabled={toggleStatus.isPending && toggleStatus.variables?.meter_id === m.numericId}
                  className={`p-1.5 rounded-md border ${m.status === "active" ? "bg-emerald-subtle text-emerald-brand" : "bg-coral-subtle text-coral-brand"}`}
                >
                  {toggleStatus.isPending && toggleStatus.variables?.meter_id === m.numericId ? <Loader2 className="w-3 h-3 animate-spin" /> : m.status === "active" ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                </button> */}
                <button onClick={() => openEdit(m)} className="p-1.5 rounded-md bg-secondary text-emerald-brand border border-border"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => setDeleteId(m.numericId)} className="p-1.5 rounded-md bg-coral-subtle text-coral-brand border border-coral/20"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 my-3.5">
              {[{ l: "Collected", v: fmt(m.totalCollected), c: "text-emerald-brand" }, { l: "Settled", v: fmt(m.settled), c: "text-emerald-brand" }, { l: "Pending", v: fmt(m.pending), c: "text-gold-brand" }, { l: "Refund Amount", v: fmt(m.total_refund_amount), c: "text-emerald-brand" }].map((s) => (
                <div key={s.l} className="bg-surface2 rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground mb-0.5">{s.l}</div>
                  <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-surface2 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5"><QrCode className="w-3 h-3 text-muted-foreground" /><span className="font-mono text-[11px] text-muted-foreground">{m.qr}</span></div>
                <span className="text-[11px] text-muted-foreground/60">₹{m.rate}/L</span>
              </div>
              
              {/* 👇 New Generate QR Button directly on the card */}
              {/* <button 
                onClick={() => handleGenerateCardQr(m)}
                disabled={activeGeneratingId === m.id}
                className="w-full border border-border bg-background hover:bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-widest rounded-lg py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {activeGeneratingId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Generate QR
              </button> */}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Dialog */}
  {/* Detail Dialog */}
      <Dialog open={!!detailMeter} onOpenChange={(open) => { if (!open) setDetailMeter(null); }}>
        <DialogContent className="bg-card border-primary/20 max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> {detailMeter?.id} — {detailMeter?.vendor}
            </DialogTitle>
          </DialogHeader>

          {/* Search Filter */}
          <div className="flex gap-2 items-center flex-wrap mb-3 mt-2">
            <div className="flex items-center gap-2 bg-background/40 border border-border rounded-lg px-3 flex-1 min-w-[150px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input 
                placeholder="Search Txn ID or Date..." 
                value={detailSearch} 
                onChange={(e) => setDetailSearch(e.target.value)} 
                className="border-none bg-transparent py-2 text-sm text-foreground outline-none w-full" 
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-auto flex-1 rounded-lg border border-border">
            {isDetailLoading ? (
               <div className="py-10 text-center text-muted-foreground animate-pulse">Fetching transactions...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface2">
                    {["ID", "Amount", "Liters", "Method", "Date", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDetailRows.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No transactions found for this meter.</td></tr>
                  ) : filteredDetailRows.map((t: any) => (
                    <tr key={t.id} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-emerald-brand">{t.id}</td>
                      <td className="px-4 py-3 text-sm font-bold">{fmt(t.collected)}</td>
                      <td className="px-4 py-3 text-teal-brand">{t.liters}L</td>
                      <td className="px-4 py-3 text-[11px] font-mono uppercase text-muted-foreground">{t.method || "UPI"}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{new Date(t.date).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${t.status === "completed" || t.status === "success" || t.status ==="captured"? "bg-green-100 text-green-600"
  : "bg-red-100 text-red-600"}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">{editMeter ? `Edit Meter — ${editMeter.id}` : "Add New Water Meter"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 mt-2">
            
            {!editMeter && (
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Meter Unique Code</label>
                <input value={form.meterCode} onChange={(e) => setForm({ ...form, meterCode: e.target.value })} className={getInputClass(formErrors.meterCode || isDuplicateCode)} />
                
                {formErrors.meterCode && !isDuplicateCode && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.meterCode}</p>}
                {isDuplicateCode && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">⚠️ This Meter ID is already present in the database!</p>}
              </div>
            )}

            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Vendor Name</label>
              <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Ravi Enterprises" className={getInputClass(formErrors.vendor)} />
              {formErrors.vendor && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.vendor}</p>}
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Water Rate (₹ per liter)</label>
              <input type="number" step="0.1" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className={getInputClass(formErrors.rate)} />
              {formErrors.rate && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.rate}</p>}
            </div>

            {!editMeter && (
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Vendor ID</label>
                <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="e.g. 9876543210" className={getInputClass(formErrors.mobile)} />
                {formErrors.mobile && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.mobile}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Meter Version</label>
                <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0" className={getInputClass(formErrors.version)} />
                {formErrors.version && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.version}</p>}
              </div>
              {!editMeter && (
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Device API Key</label>
                  <input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="Generated Key" className={getInputClass(formErrors.apiKey)} />
                  {formErrors.apiKey && <p className="text-[10px] text-coral-brand font-semibold mb-3.5">{formErrors.apiKey}</p>}
                </div>
              )}
            </div>

        {/* 👇 Form QR Generation Logic */}
            <div className={`rounded-lg p-3 border mb-3.5 transition-colors ${!form.qrImagePath ? "bg-coral-subtle/30 border-coral-brand/40" : "bg-surface2 border-border"}`}>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-2 flex items-center gap-2">
                QR Code Status 
                {!form.qrImagePath && <span className="text-coral-brand normal-case tracking-normal font-bold">* Required</span>}
              </label>
              
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={handleGenerateFormQr}
                  disabled={generateQrMutation.isPending || !form.meterCode}
                  className="bg-teal-subtle text-teal-brand border border-teal/20 text-xs font-bold px-3 py-2 rounded-md hover:bg-teal/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {generateQrMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                  {form.qrImagePath ? "Regenerate QR" : "Generate QR"}
                </button>
                {form.qrImagePath ? (
                  <span className="text-[11px] text-emerald-brand font-mono truncate bg-emerald-subtle px-2 py-1 rounded">Path Secured</span>
                ) : (
                  <span className="text-[11px] text-coral-brand font-medium">Please generate a QR code</span>
                )}
              </div>
            </div>
<button 
              onClick={saveMeter} 
              disabled={addMeter.isPending || updateMeter.isPending || isDuplicateCode || !form.qrImagePath} 
              className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 inline-flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {(addMeter.isPending || updateMeter.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} 
              {editMeter ? "Save Changes" : "Create Meter"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR DIALOG */}
      <Dialog open={!!qrMeter} onOpenChange={() => setQrMeter(null)}>
         <DialogContent className="bg-card border-primary/20 max-w-xs text-center">
           <DialogHeader>
             <DialogTitle>Meter QR Code</DialogTitle>
           </DialogHeader>
           <div className="flex flex-col items-center gap-4 py-4">
             <div className="bg-white p-2 rounded-xl shadow-sm w-48 h-48 flex items-center justify-center overflow-hidden border border-border">
               {qrMeter?.qrImageUrl ? (
                <img 
                 src={
    qrMeter?.qrImageUrl?.startsWith("http") 
      ? qrMeter.qrImageUrl 
      : `http://localhost:5000/${qrMeter?.qrImageUrl?.replace(/\\/g, '/').replace(/^\//, '')}`
  }
                   alt="Bank QR" 
                   className="w-full h-full object-contain"
                 />
               ) : (
                 <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/60 p-4">
                   <QrCode className="w-10 h-10 opacity-20" />
                   <p className="text-xs font-semibold">No QR Image Uploaded</p>
                 </div>
               )}
             </div>
             <div>
               <p className="font-mono text-sm font-bold text-emerald-brand">
                 {qrMeter?.qrImageUrl ? "Custom Bank QR" : qrMeter?.qr}
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                 {qrMeter?.qrImageUrl ? "Uploaded by Admin" : "System QR Token"}
               </p>
             </div>
           </div>
         </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
         <AlertDialogContent className="bg-card border-destructive/20">
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Meter?</AlertDialogTitle>
             <AlertDialogDescription>This will permanently remove this meter and all associated transaction history.</AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel className="border-border text-muted-foreground">Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={confirmDelete} disabled={deleteMeter.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               {deleteMeter.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
             </AlertDialogAction>
           </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Meters;