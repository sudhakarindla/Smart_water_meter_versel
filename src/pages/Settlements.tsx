import { useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { fmt } from "@/lib/data";
import { Send, Clock, Download, Loader2, FileText, Table } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

// 1. IMPORT EXPORT LIBRARIES
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Import your new TanStack Hooks
import { 
  useAdminSettlementsData, useProcessSettlementMutation, 
  useVendorSettlementsData, useRequestSettlementMutation, 
  useCreateSettlementMutation
} from "@/Tanstack/allTanstack";
import { Button } from "@/components/ui/button";

const Settlements = () => {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const meters = useAppSelector((s) => s.app.meters); 
  const createSettlement = useCreateSettlementMutation();
  const isAdmin = user?.role === "admin";
  const isVendor = !isAdmin;
  const vendorId = user?.id || 1; 

  const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
  // Modals State
  const [confirmAction, setConfirmAction] = useState<{ settleId: number; vendorId: number; label: string } | null>(null);
  const [vendorRequestDialog, setVendorRequestDialog] = useState<{ amount: number; dailyComm: number; immediateComm: number; dailyNet: number; immediateNet: number } | null>(null);

  // --- FETCH DATA VIA TANSTACK ---
  const { data: adminData, isLoading: adminLoading } = useAdminSettlementsData(isAdmin);
  const { data: vendorData, isLoading: vendorLoading } = useVendorSettlementsData(vendorId, isVendor);
  
  const processSettlement = useProcessSettlementMutation();
  const requestSettlement = useRequestSettlementMutation();

  const isLoading = isAdmin ? adminLoading : vendorLoading;
  const apiData = isAdmin ? adminData : vendorData;

  // --- EXTRACT BACKEND VARIABLES ---
  const pendingAmount = apiData?.pending_amount || 0;
  const percentages = apiData?.percentages || [];
  const dailyPct = Number(percentages.find((p: any) => p.commission_type === 'daily')?.percentage || 5);
  const immediatePct = Number(percentages.find((p: any) => p.commission_type === 'immediate')?.percentage || 10);
  
  const pendingSettlements = apiData?.pending_settlements || [];
  const history = apiData?.settlement_details || [];
  const filteredHistory = history.filter((item: any) => {
  if (!startDate && !endDate) return true;

  const date = new Date(item.updated_at);

  const formattedDate = `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

  if (startDate && formattedDate < startDate) return false;
  if (endDate && formattedDate > endDate) return false;

  return true;
});

const unrequestedBalance = Number(apiData?.pending_settlement_request || 0);

  // --- EXPORT LOGIC ---

  const handleExportPDF = () => {
  if (filteredHistory.length === 0) return toast.error("No data to export");
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text("Settlement History Report", 14, 20);
  
  // Subtitle with Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Column Headers - We add (INR) here so we don't need symbols in the rows
  const tableColumn = ["Vendor ID", "Gross (INR)", "Comm (INR)", "Net (INR)", "Type", "Status"];
  
  const tableRows = filteredHistory.map((s: any) => {
    // FIX: Convert to clean numbers and remove ALL formatting/symbols
    // Math.round ensures '100.00' becomes exactly '100'
    const gross = Math.round(Number(s.total_amount) || 0);
    const comm = Math.round(Number(s.commission_amount) || 0);
    const net = Math.round(Number(s.net_amount) || 0);

    return [
      `V-${s.vendor_id}`,
      gross.toString(), // Sends clean text "100" to the PDF
      comm.toString(),
      net.toString(),
      String(s.settlement_type).toUpperCase(),
      String(s.payout_status).toUpperCase(),
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [20, 184, 166] }, // Teal matching your theme
    styles: { 
      font: "helvetica", // Use a standard font that supports numbers perfectly
      fontSize: 9,
      cellPadding: 3 
    },
  });

  doc.save(`Settlements_${new Date().getTime()}.pdf`);
  toast.success("PDF Downloaded successfully");
};
  const handleExportExcel = () => {
    if (filteredHistory.length === 0) return toast.error("No data to export");
    
    // Format data specifically for Excel (clean numbers without currency symbols usually works best)
    const worksheetData = filteredHistory.map((s: any) => ({
      "Vendor ID": `V-${s.vendor_id}`,
      "Gross Amount": s.total_amount,
      "Commission": s.commission_amount || 0,
      "Net Amount": s.net_amount || 0,
      "Type": s.settlement_type,
      "Status": s.payout_status,
      "Date": new Date(s.updated_at).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Settlements");
    
    XLSX.writeFile(workbook, `Settlements_Report_${new Date().getTime()}.xlsx`);
    toast.success("Excel File Downloaded");
  };

  // --- ACTIONS ---

  const handleApproveSettlement = () => {
    if (!confirmAction) return;
    processSettlement.mutate(
      { vendor_id: confirmAction.vendorId, settle_id: confirmAction.settleId },
      {
        onSuccess: () => {
          toast.success(`Successfully settled ${confirmAction.label}!`);
          setConfirmAction(null);
          queryClient.invalidateQueries({ queryKey: ['adminSettlements'] });
        },
        onError: () => toast.error("Failed to process settlement.")
      }
    );
  };

  const openVendorRequest = () => {
    if (unrequestedBalance <= 0) { 
      toast.info("No available balance to settle."); 
      return; 
    }
    const dailyComm = Math.round(unrequestedBalance * (dailyPct / 100));
    const immediateComm = Math.round(unrequestedBalance * (immediatePct / 100));
    setVendorRequestDialog({
      amount: unrequestedBalance,
      dailyComm, immediateComm,
      dailyNet: unrequestedBalance - dailyComm,
      immediateNet: unrequestedBalance - immediateComm,
    });
  };

  // const confirmVendorRequest = (type: "daily" | "immediate") => {
  //   if (!vendorRequestDialog) return;
  //   requestSettlement.mutate(
  //     { vendor_id: vendorId, amount: vendorRequestDialog.amount, request_type: type },
  //     {
  //       onSuccess: () => {
  //         toast.success(`${type === "daily" ? "Normal" : "Immediate"} settlement request sent!`);
  //         setVendorRequestDialog(null);
  //       },
  //       onError: () => toast.error("Failed to send request.")
  //     }
  //   );
  // };
const confirmVendorRequest = (type: "daily" | "immediate") => {
    if (!vendorRequestDialog) return;

    // 👇 Match exactly what your API function expects: { amount, request_type }
    // (We also removed vendor_id because your backend securely gets it from the token!)
    const payload = {
      amount: vendorRequestDialog.amount, 
      request_type: type
    };

    requestSettlement.mutate(payload, {
      onSuccess: () => {
        toast.success("Settlement request submitted!");
        setVendorRequestDialog(null);
        
        queryClient.invalidateQueries({ 
          queryKey: ['vendorSettlementsDashboard'] 
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ['vendorMeters'] 
        }); 
      },
      onError: (err) => toast.error("Submission failed.")
    });
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-muted-foreground animate-pulse gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-mono text-sm">Loading Settlements...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Pending</div>
          <div className="text-2xl font-extrabold text-gold-brand">{fmt(pendingAmount)}</div>
          <div className="text-xs text-muted-foreground">In processing queue</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Daily Commission</div>
          <div className="text-2xl font-extrabold text-emerald-brand">{dailyPct}%</div>
          <div className="text-xs text-muted-foreground">Auto-run at midnight</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Immediate Commission</div>
          <div className="text-2xl font-extrabold text-teal-brand">{immediatePct}%</div>
          <div className="text-xs text-muted-foreground">On vendor request</div>
        </div>
      </div>

      {/* Admin: Pending Requests */}
      {isAdmin && pendingSettlements.length > 0 && (
        <div className="bg-card border border-accent/30 rounded-xl p-5 shadow-card">
          <div className="text-[11px] font-bold uppercase tracking-widest text-teal-brand mb-4 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Pending Settlement Requests ({pendingSettlements.length})
          </div>
          {pendingSettlements.map((req: any) => (
            <div key={req.id} className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3 mb-2.5 last:mb-0 flex-wrap gap-3 border border-border/40 hover:border-primary/20 transition-all">
              <div>
                <div className="text-sm font-bold">{req.first_name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">REQ-{req.id} · {req.email}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold text-gold-brand">{fmt(req.total_amount)}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{req.settlement_type}</div>
              </div>
              <button 
                onClick={() => setConfirmAction({ settleId: req.id, vendorId: req.vendor_id, label: `${fmt(req.total_amount)} to ${req.first_name}` })} 
                className="gradient-primary text-primary-foreground font-bold text-[11px] rounded-lg px-3 py-1.5 shadow-glow inline-flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> Process
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Vendor: Request Settlement UI */}
      {  /* {isVendor && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Available Balance to Settle</div>
          <div className="flex items-center justify-between bg-surface2 rounded-lg px-4 py-3 border border-border/40">
            <div>
              <div className="text-sm font-bold">Unrequested Balance</div>
              <div className="font-mono text-[11px] text-muted-foreground">From active meters</div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold text-gold-brand">{fmt(unrequestedBalance)}</div>
            </div>
            <button 
              onClick={openVendorRequest} 
              disabled={unrequestedBalance <= 0}
              className="gradient-primary text-primary-foreground font-bold text-[11px] rounded-lg px-3 py-1.5 shadow-glow inline-flex items-center gap-1 disabled:opacity-50 disabled:shadow-none"
            >
              <Send className="w-3 h-3" /> Request Now
            </button>
          </div>
        </div>
      )} */}

      {/* Settlement filteredHistory Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">Settlement History</h3>
          <div className="flex gap-2">
              { !isAdmin && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 rounded-md border px-3 text-sm"
  />

  <input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="h-9 rounded-md border px-3 text-sm"
  />

  <Button
    variant="outline"
    onClick={() => {
      setStartDate("");
      setEndDate("");
    }}
  >
    Clear
  </Button>
</div>)}
            <button 
              onClick={handleExportExcel}
              className="bg-secondary border border-border text-muted-foreground rounded-lg px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 hover:text-emerald-brand hover:border-emerald-brand transition-all"
            >
              <Table className="w-3 h-3" /> Excel
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-secondary border border-border text-muted-foreground rounded-lg px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 hover:text-coral-brand hover:border-coral-brand transition-all"
            >
              <FileText className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
                {["Vendor ID", "Gross Amount", "Commission", "Net Amount", "Type", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No settlement history found.</td></tr>
              ) : (
                filteredHistory.map((s: any, idx: number) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-emerald-brand">V-{s.vendor_id}</td>
                    <td className="px-4 py-3 text-sm font-bold">{fmt(s.total_amount)}</td>
                    <td className="px-4 py-3 text-coral-brand">{s.commission_amount ? fmt(s.commission_amount) : "—"}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-brand">{s.net_amount ? fmt(s.net_amount) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.settlement_type === "immediate" ? "bg-teal-subtle text-teal-brand" : "bg-lavender-subtle text-lavender-brand"}`}>
                        {s.settlement_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.payout_status === "completed" ? "bg-emerald-subtle text-emerald-brand" : "bg-gold-brand/20 text-gold-brand"}`}>
                        {s.payout_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="bg-card border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Settlement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the settlement for <strong className="text-primary">{confirmAction?.label}</strong>? This will mark it as paid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="gradient-primary text-primary-foreground shadow-glow" 
              onClick={handleApproveSettlement}
              disabled={processSettlement.isPending}
            >
              {processSettlement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Approval"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vendor Request Settlement Dialog */}
      {/* Vendor Request Settlement Dialog */}
      <AlertDialog open={!!vendorRequestDialog} onOpenChange={() => setVendorRequestDialog(null)}>
        <AlertDialogContent className="bg-card border-primary/20 max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Request Settlement</AlertDialogTitle>
            <AlertDialogDescription asChild>
      <div className="space-y-4 mt-2">
                <div className="text-sm text-foreground">
                  Choose your settlement type for <strong className="text-primary text-base">{fmt(vendorRequestDialog?.amount || 0)}</strong>:
                </div>
                
                {/* 👇 Changed from Grid to Flex to guarantee identical heights */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  
                  {/* Normal Box
                  <div className="flex-1 flex flex-col justify-between bg-surface2 rounded-xl p-4 border border-border min-h-[140px]">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-brand mb-1.5">⏰ Normal (Daily)</div>
                      <div className="text-xs text-muted-foreground">
                        Fee: <span className="font-bold text-foreground">{vendorRequestDialog?.dailyComm ? fmt(vendorRequestDialog.dailyComm) : "—"}</span> ({dailyPct}%)
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-[10px] text-muted-foreground mb-1">You'll receive</div>
                      <div className="text-2xl font-extrabold text-emerald-brand leading-none">
                        {vendorRequestDialog?.dailyNet ? fmt(vendorRequestDialog.dailyNet) : "—"}
                      </div>
                    </div>
                  </div> */}

                  {/* Immediate Box */}
                  <div className="flex-1 flex flex-col justify-between bg-surface2 rounded-xl p-4 border border-teal-brand/40 min-h-[140px]">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-teal-brand mb-1.5">⚡ Immediate</div>
                      <div className="text-xs text-muted-foreground">
                        Fee: <span className="font-bold text-foreground">{vendorRequestDialog?.immediateComm ? fmt(vendorRequestDialog.immediateComm) : "—"}</span> ({immediatePct}%)
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-[10px] text-muted-foreground mb-1">You'll receive</div>
                      <div className="text-2xl font-extrabold text-teal-brand leading-none">
                        {vendorRequestDialog?.immediateNet ? fmt(vendorRequestDialog.immediateNet) : "—"}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <AlertDialogCancel className="border-border text-muted-foreground">Cancel</AlertDialogCancel>
            {/* <AlertDialogAction 
              className="bg-emerald-subtle text-emerald-brand border border-emerald-subtle hover:bg-emerald-subtle/80" 
              onClick={() => confirmVendorRequest("daily")}
              disabled={requestSettlement.isPending}
            >
              ⏰ Normal Settlement
            </AlertDialogAction> */}
            <AlertDialogAction 
              className="gradient-primary text-primary-foreground shadow-glow" 
              onClick={() => confirmVendorRequest("immediate")}
              disabled={requestSettlement.isPending}
            >
              {requestSettlement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "⚡ Immediate Settlement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settlements;
