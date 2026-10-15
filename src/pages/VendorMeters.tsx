import { useState, useMemo } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { fmt } from "@/lib/data";
import { MapPin, QrCode, Eye, Search, Download, IndianRupee, Calendar, Wallet, History, RefreshCcw, Zap, ZapOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import your TanStack Hooks
import { 
  useVendorMetersData, 
  useVendorMeterTransactionsData, 
  useVendorMeterMutations,  
  useVendorDashboardData,
  useDownloadQrMutation
} from "@/Tanstack/allTanstack";

type SortDir = "asc" | "desc" | "none";

// Extended UI type to map Python backend data
interface UIMeter {
  id: string; // Maps to meter_unique_code
  numericId: number;
  vendor: string;
  location: string;
  rate: string;
  status: string;
  qr: string;
  totalCollected: number;
  settled: number;
  refund: number;
  transactions: number;
  yesterdayCollected: number; 
  yesterdaySettled: number;
}

const VendorMeters = () => {
  const user = useAppSelector((s) => s.auth.user);
  const vendorId = user?.id || 1;
  const isVendor = user?.role !== "admin";
  const downloadQrMutation = useDownloadQrMutation();
const [downloadingId, setDownloadingId] = useState<string | null>(null);
const [qrMeter, setQrMeter] = useState<UIMeter | null>(null);
  const [detailMeter, setDetailMeter] = useState<UIMeter | null>(null);
  const [detailSearch, setDetailSearch] = useState("");
  const [detailDateFilter, setDetailDateFilter] = useState("all");
  const [detailSort, setDetailSort] = useState<SortDir>("none");
  const [detailTab, setDetailTab] = useState<"overview" | "transactions">("overview");

  // --- FETCH DATA ---
  // 👇 Now receives the full object including the stats
  const { data: metersPayload, isLoading: isMetersLoading } = useVendorMetersData(vendorId, isVendor);
  
  const { data: backendTxns, isLoading: isTxnsLoading } = useVendorMeterTransactionsData(
    vendorId, 
    detailMeter?.numericId?.toString()
  );
  const { toggleStatus } = useVendorMeterMutations();
  const { data: vendorDashboardStats } = useVendorDashboardData(user?.role || "vendor", vendorId);

  // --- EXTRACT BACKEND STATS ---
  const backendMeters = metersPayload?.meters_details || [];
  const lastDayCollection = (metersPayload?.yesterday_total_amount || []).reduce((sum: number, item: any) => sum + Number(item.total_amount || 0), 0);
  const lastDaySettlement = (metersPayload?.yesterday_total_settle_amount || []).reduce((sum: number, item: any) => sum + Number(item.total_amount || 0), 0);
const totalRefund = (metersPayload?.total_refund || []).reduce((sum: number, item: any) => sum + Number(item.total_refund || 0), 0);
const grandTotalSettled = (metersPayload?.total_settlements || []).reduce((sum: number, item: any) => sum + Number(item.total_settlement_amount || 0), 0);
// --- MAP METER DATA ---
  const vendorMeters: UIMeter[] = useMemo(() => {
    if (!backendMeters) return [];
    
    // Extract the lists sent by the backend
    const yesterdayColList = metersPayload?.yesterday_total_amount || [];
    const yesterdaySetList = metersPayload?.yesterday_total_settle_amount || [];
    const refundList = metersPayload?.total_refund || [];
    const totalSetList = metersPayload?.total_settlements || [];
    return backendMeters.map((m: any) => {
      // Match the yesterday values to the current meter using meter_id
      const yCol = yesterdayColList.find((y: any) => y.meter_id === m.meter_id);
      const ySet = yesterdaySetList.find((y: any) => y.meter_id === m.meter_id);
      const mRefund = refundList.find((r: any) => r.meter_id === m.meter_id);
      const tSet = totalSetList.find((t: any) => t.meter_id === m.meter_id);
      return {
        id: m.meter_unique_code,
        vendor: m.company_name || 'Vendor',
        numericId: m.meter_id,
        location: 'N/A', 
        rate: String(m.water_rate_per_liter || "1"),
        status: m.status || "active",
        qr: m.qr_token || 'N/A',
        totalCollected: Number(m.total_amount_paid) || 0, 
      settled: tSet ? Number(tSet.total_settlement_amount) : 0,
        transactions: 0,
        // 👇 Real mapped values!
       yesterdayCollected: yCol ? Number(yCol.total_amount) : 0, 
        yesterdaySettled: ySet ? Number(ySet.total_amount) : 0,
        refund: mRefund ? Number(mRefund.total_refund) : 0,
      };
    });
  }, [backendMeters, metersPayload]);

   const handleDownloadQr = (m: UIMeter) => {
      setDownloadingId(m.id);
      
      // Pass m.id (e.g. "MTR-123456") which matches the filename in your Python backend
      downloadQrMutation.mutate(m.id, {
        onSuccess: (blob) => {
          // Create a temporary link to trigger the browser's download behavior
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${m.id}_QR.png`); // Name of the downloaded file
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast.success("QR Code downloaded!");
          setDownloadingId(null);
        },
        onError: (err: any) => {
          toast.error("QR Code not found. Please generate it first.");
          setDownloadingId(null);
        }
      });
    };
  

  // --- MAP TRANSACTION DATA ---
  const filteredTxns = useMemo(() => {
    if (!backendTxns) return [];
    
    let rows = backendTxns.map((t: any) => ({
      id: t.payment_id,
      amount: Number(t.amount_paid),
      liters: t.liters_calculated,
      upi: t.payment_method || "UPI",
      time: t.created_at,
      status: t.payment_status || "completed"
    }));

    if (detailSearch) {
      rows = rows.filter((t: any) => String(t.id).toLowerCase().includes(detailSearch.toLowerCase()) || t.upi.toLowerCase().includes(detailSearch.toLowerCase()));
    }
    
    // Simplistic Date Filter
    if (detailDateFilter !== "all") {
        const now = new Date();
        rows = rows.filter((t: any) => {
            const d = new Date(t.time);
            if (detailDateFilter === "today") return d.toDateString() === now.toDateString();
            return true; // Expand logic for week/month as needed
        });
    }

    if (detailSort === "asc") rows.sort((a: any, b: any) => a.amount - b.amount);
    if (detailSort === "desc") rows.sort((a: any, b: any) => b.amount - a.amount);
    return rows;
  }, [backendTxns, detailSearch, detailDateFilter, detailSort]);

  // --- ACTIONS ---
 const handleToggleStatus = (e: React.MouseEvent, m: UIMeter) => {
    e.stopPropagation(); // Prevents the card click (openDetail) from firing
    const newStatus = m.status === "active" ? "inactive" : "active";
    
    toggleStatus.mutate(
      // 👇 FIX: Use m.numericId instead of m.id to match the database!
    { 
        vendor_id: vendorId, 
        meter_id: String(m.numericId), 
        status: newStatus 
      },
      {
        onSuccess: () => toast.success(`Meter marked as ${newStatus}`),
        onError: () => toast.error("Failed to update status")
      }
    );
  };

  const openDetail = (m: UIMeter) => {
    setDetailMeter(m);
    setDetailSearch("");
    setDetailDateFilter("all");
    setDetailSort("none");
    setDetailTab("overview");
  };

  const exportData = (format: "csv" | "pdf" | "excel") => {
    if (format === "csv") {
      const header = "ID,Amount,Liters,Method,Time,Status\n";
      const csv = header + filteredTxns.map((t: any) => `${t.id},${t.amount},${t.liters},${t.upi},${t.time},${t.status}`).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `meter-${detailMeter?.id}-txns.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded!");
    } else {
      toast.info(`${format.toUpperCase()} export coming soon`);
    }
  };

  if (isMetersLoading) {
    return <div className="py-10 text-center text-muted-foreground animate-pulse">Loading assigned meters...</div>;
  }

  return (
    <div className="animate-fade-in space-y-5">
    {/* 👇 2. VENDOR SUMMARY STATS CARDS POPULATED WITH REAL DATA */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        
        {/* 1. Total Collection */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-emerald-brand/30 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-subtle rounded-lg text-emerald-brand">
              <IndianRupee className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Collection</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {fmt(vendorDashboardStats?.total_collected || 0)}
          </p>
        </div>

        {/* 2. Last Day Collection */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-blue-brand/30 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-subtle rounded-lg text-blue-brand">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Day Collection</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {fmt(lastDayCollection)}
          </p>
        </div>

        {/* 3. Total Settlement */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-purple-brand/30 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-subtle rounded-lg text-purple-brand">
              <Wallet className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Settlement</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {fmt(grandTotalSettled)}
          </p>
        </div>

        {/* 4. Last Day Settlement */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-indigo-brand/30 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-subtle rounded-lg text-indigo-brand">
              <History className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Day Settlement</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {fmt(lastDaySettlement)}
          </p>
        </div>

        {/* 5. Refund */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-coral-brand/30 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-coral-subtle rounded-lg text-coral-brand">
              <RefreshCcw className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Refund</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {fmt(totalRefund)}
          </p>
        </div>

      </div>
      
      {/* meters */}
      <div className="text-sm text-muted-foreground">{vendorMeters.length} meters assigned to you</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vendorMeters.map((m, i) => (
          <div key={m.id} className={`bg-card border rounded-xl p-5 shadow-card hover:border-primary/20 transition-all cursor-pointer ${m.status === "active" ? "border-emerald-subtle" : "border-border"}`} style={{ animationDelay: `${i * 50}ms` }} onClick={() => openDetail(m)}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-emerald-brand text-sm font-bold">{m.id}</span>
                  {/* <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${m.status === "active" ? "bg-emerald-subtle text-emerald-brand" : "bg-coral-subtle text-coral-brand"}`}>
                    {m.status === "active" ? "● ACTIVE" : "● OFFLINE"}
                  </span> */}
                </div>
                <div className="text-sm font-semibold mb-0.5">{m.vendor}</div>
                {/* <div className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.location}</div> */}
              </div>
              <div className="flex gap-1">
                {/* 👇 FIX: Added e.stopPropagation() so the Detail modal doesn't open */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setQrMeter(m); }} 
                  className="p-1.5 rounded-md bg-teal-subtle text-teal-brand border border-teal/20"
                >
                  <QrCode className="w-3 h-3" />
                </button>
                
{/*                 
                  <button 
                    // 👇 FIX: Added e.stopPropagation() here too!
                    onClick={(e) => { e.stopPropagation(); handleDownloadQr(m); }} 
                    disabled={downloadingId === m.id}
                    className="p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                    title="Download QR"
                  >
                    {downloadingId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  </button>  */}
                  <button 
  onClick={(e) => { e.stopPropagation(); handleDownloadQr(m); }} 
  disabled={downloadingId === m.id}
  // 👇 Added flex, items-center, gap-1.5 and horizontal padding (px-2.5)
  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
  title="Download QR"
>
  {downloadingId === m.id ? (
    <Loader2 className="w-3 h-3 animate-spin" />
  ) : (
    <>
      <Download className="w-3 h-3" />
      {/* 👇 Added the QR text with a bold, small font */}
      <span className="text-[10px] font-bold uppercase tracking-wider">QR</span>
    </>
  )}
</button>
            
                
                {/* The toggle button already correctly receives 'e' and stops propagation in the function */}
                {/* <button 
                  onClick={(e) => handleToggleStatus(e, m)} 
                  disabled={toggleStatus.isPending} 
                  className={`p-1.5 rounded-md border ${m.status === "active" ? "bg-emerald-subtle text-emerald-brand border-emerald-subtle" : "bg-coral-subtle text-coral-brand border-coral/20"}`}
                >
                  {m.status === "active" ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                </button> */}
                
                <button className="p-1.5 rounded-md bg-lavender-subtle text-lavender-brand border border-lavender/20">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* <div className="grid grid-cols-3 gap-2 my-3.5">
              {[{ l: "Collected", v: fmt(m.totalCollected), c: "text-emerald-brand" }, { l: "Settled", v: fmt(m.settled), c: "text-emerald-brand" }, { l: "Pending", v: fmt(m.pending), c: "text-gold-brand" }].map((s) => (
                <div key={s.l} className="bg-surface2 rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground mb-0.5">{s.l}</div>
                  <div className={`text-sm font-bold ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div> */}
           {/* 👇 Changed to grid-cols-2 to give your split boxes enough room */}
  <div className="grid grid-cols-2 gap-2 my-3.5">
    
    {/* 1. Split Collection Box */}
    <div className="bg-surface2 rounded-lg p-2 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 truncate">Yest. Coll</div>
        <div className="text-xs font-bold text-foreground truncate">{fmt(m.yesterdayCollected)}</div>
      </div>
      
      {/* 👇 The Vertical Divider Line */}
      <div className="w-px h-6 bg-border mx-2 shrink-0"></div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 truncate">Total Coll</div>
        <div className="text-xs font-bold text-emerald-brand truncate">{fmt(m.totalCollected)}</div>
      </div>
    </div>

    {/* 2. Split Settled Box */}
    <div className="bg-surface2 rounded-lg p-2 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 truncate">Yest. Set</div>
        <div className="text-xs font-bold text-foreground truncate">{fmt(m.yesterdaySettled)}</div>
      </div>
      
      {/* 👇 The Vertical Divider Line */}
      <div className="w-px h-6 bg-border mx-2 shrink-0"></div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 truncate">Total Set</div>
        <div className="text-xs font-bold text-emerald-brand truncate">{fmt(m.settled)}</div>
      </div>
    </div>

    {/* 3. Pending Box (Spans across the bottom for a clean look) */}
 {/* 3. Refund Box (Spans across the bottom for a clean look) */}
    <div className="col-span-2 bg-surface2 rounded-lg p-2 flex items-center justify-between">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        Total Refund
      </div>
      {/* Changed color to coral (red/orange) to indicate refunds */}
      <div className="text-sm font-bold text-coral-brand"> 
        {fmt(m.refund)}
      </div>
    </div>

  </div>
            <div className="flex items-center justify-between bg-surface2 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5"><QrCode className="w-3 h-3 text-muted-foreground" /><span className="font-mono text-[11px] text-muted-foreground">{m.qr}</span></div>
              <span className="text-[11px] text-muted-foreground/60">{m.transactions} txns · ₹{m.rate}/L</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailMeter} onOpenChange={() => setDetailMeter(null)}>
        <DialogContent className="bg-card border-primary/20 max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> {detailMeter?.id} — {detailMeter?.vendor}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-3 mt-2">
            {(["overview", "transactions"] as const).map((tab) => (
              <button key={tab} onClick={() => setDetailTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${detailTab === tab ? "bg-emerald-subtle text-emerald-brand border border-primary/20" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
                {tab}
              </button>
            ))}
          </div>

          {detailTab === "overview" && (
            <div className="space-y-3 overflow-auto flex-1">
              <div className="bg-surface2 rounded-lg p-4 space-y-2">
                {[
                  { l: "Location", v: detailMeter?.location },
                  { l: "Rate", v: `₹${detailMeter?.rate}/L` },
                  { l: "QR Code Token", v: detailMeter?.qr },
                  { l: "Status", v: detailMeter?.status?.toUpperCase() },
                ].map((r) => (
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-border/20 last:border-0">
                    <span className="text-xs text-muted-foreground">{r.l}</span>
                    <span className="text-sm font-bold">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailTab === "transactions" && (
            <>
              {/* Filters */}
              <div className="flex gap-2 items-center flex-wrap mb-3">
                <div className="flex items-center gap-2 bg-background/40 border border-border rounded-lg px-3 flex-1 min-w-[150px]">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <input placeholder="Search Txn ID..." value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} className="border-none bg-transparent py-2 text-sm text-foreground outline-none w-full" />
                </div>
                <Select value={detailDateFilter} onValueChange={setDetailDateFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                  </SelectContent>
                </Select>
                {/* <div className="flex gap-1 ml-auto">
                  <button onClick={() => exportData("csv")} className="bg-secondary border border-border text-muted-foreground rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div> */}
              </div>

              {/* Table */}
              <div className="overflow-auto flex-1 rounded-lg border border-border">
                {isTxnsLoading ? (
                   <div className="py-10 text-center text-muted-foreground animate-pulse">Fetching transactions...</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-surface2">
                        {["ID", "Amount", "Liters", "Method", "Time", "Status"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxns.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No transactions found for this meter.</td></tr>
                      ) : filteredTxns.map((t: any) => (
                        <tr key={t.id} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-emerald-brand">{t.id}</td>
                          <td className="px-4 py-3 text-sm font-bold">{fmt(t.amount)}</td>
                          <td className="px-4 py-3 text-teal-brand">{t.liters}L</td>
                          <td className="px-4 py-3 text-[11px] font-mono uppercase text-muted-foreground">{t.upi}</td>
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{new Date(t.time).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${t.status === "completed" || t.status === "success" ? "bg-emerald-subtle text-emerald-brand" : "bg-coral-subtle text-coral-brand"}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
     <Dialog open={!!qrMeter} onOpenChange={(open) => { if (!open) setQrMeter(null); }}>
         <DialogContent className="bg-card border-primary/20 max-w-xs text-center">
           <DialogHeader>
             <DialogTitle>Meter QR Code</DialogTitle>
           </DialogHeader>
           <div className="flex flex-col items-center gap-4 py-4">
             
             {/* 👇 FIXED: Now uses a real <img> tag pointing to your backend! */}
             <div className="bg-white p-2 rounded-xl shadow-sm w-48 h-48 flex items-center justify-center overflow-hidden border border-border relative">
               
               {/* 1. Fallback Icon (Sits in the background) */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <QrCode className="w-12 h-12 text-primary opacity-20 mb-1" />
                 <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">No Image</span>
               </div>

               {/* 2. The Real QR Image (Covers the fallback if it loads successfully) */}
               {qrMeter && (
                 <img 
                   src={`http://127.0.0.1:5000/static/qr_codes/${qrMeter.id}.png`}
                   alt={`QR for ${qrMeter.id}`}
                   className="w-full h-full object-contain relative z-10 bg-white"
                   onError={(e) => { 
                     // If the image is missing (404), hide the img tag to reveal the fallback icon!
                     e.currentTarget.style.display = 'none'; 
                   }}
                 />
               )}
             </div>

             <div>
               <p className="font-mono text-sm font-bold text-emerald-brand">
                 {qrMeter?.qr}
               </p>
               <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
                 System QR Token
               </p>
             </div>
             
             {/* Vendor Download Button */}
             <button 
                onClick={() => qrMeter && handleDownloadQr(qrMeter)} 
                disabled={downloadingId === qrMeter?.id}
                className="mt-2 w-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 text-xs font-bold uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {downloadingId === qrMeter?.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download QR Image
              </button>
           </div>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorMeters;