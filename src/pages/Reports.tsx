import { useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { fmt } from "@/lib/data";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { 
  useDownloadPaymentExcel, 
  useDownloadPaymentPdf, 
  useSendVendorEmailReport,
  useDownloadVendorPdf,
  useDownloadCommissionExcel,
  useDownloadCommissionPdf,
  useDownloadSettlementExcel,
  useDownloadSettlementPdf,
  useVendorTableData,
  useMeters
} from "@/Tanstack/allTanstack";

import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

const Reports = () => {
  const settleConfig = useAppSelector((s) => s.app.settleConfig);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [open, setOpen] = useState(false);
const [selectedMeter, setSelectedMeter] = useState("all");
 

  const payload = startDate && endDate && selectedMeter ? { start_date: startDate, end_date: endDate,  "meter_id": selectedMeter } : undefined;

  const { data: tableData, isFetching: isTableFetching } = useVendorTableData(payload);
  const {data: metersData} = useMeters();
  console.log("Meters Data:", metersData); // Log the fetched meters data for debugging

  const excelMutation = useDownloadPaymentExcel();
  const pdfMutation = useDownloadPaymentPdf();
  const emailMutation = useSendVendorEmailReport();
  const vendorPdfMutation = useDownloadVendorPdf(); 
  const commissionExcelMut = useDownloadCommissionExcel();
  const commissionPdfMut = useDownloadCommissionPdf();
  const settlementExcelMut = useDownloadSettlementExcel();
  const settlementPdfMut = useDownloadSettlementPdf();

  const reports = [
    { title: "Daily Collection Report", desc: "Per-meter collections grouped by date", color: "hsl(195 100% 50%)", bg: "hsl(195 100% 50% / 0.12)", buttons: ["Excel", "PDF"] },
    { title: "Commission Report", desc: "All commission deductions and summaries", color: "hsl(187 80% 58%)", bg: "hsl(187 80% 58% / 0.10)", buttons: ["Excel", "PDF"] },
    { title: "Settlement Report", desc: "Complete settlement history with filters", color: "hsl(195 100% 62%)", bg: "hsl(195 100% 62% / 0.10)", buttons: ["Excel", "PDF"] },
  ];
  //    { title: "Vendor-wise Report", desc: "Breakdown by vendor with totals and trends", color: "hsl(187 80% 58%)", bg: "hsl(187 80% 58% / 0.10)", buttons: ["Email", "PDF"] },


  // 🔥 THE MAGIC FIX: Decodes Blob errors into user-friendly Toasts!
  const handleDownloadError = async (err: any, toastId: string | number) => {
    let msg = "Failed to download report.";
    
    if (err.response && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        msg = json.error || json.message || msg;
      } catch (e) {
        console.error("Failed to parse blob error.");
      }
    } else if (err.response?.data?.error) {
      msg = err.response.data.error;
    }

    if (err.response?.status === 404 || msg.toLowerCase().includes("no data")) {
      toast.error("No data found for the selected dates.", { id: toastId });
    } else {
      toast.error(msg, { id: toastId });
    }
  };

  const handleAction = (title: string, format: string) => {
    if ((startDate && !endDate) || (!startDate && endDate)) {
      toast.error("Please select both a Start Date and an End Date.");
      return;
    }

    if (title === "Daily Collection Report") {
      if (format === "Excel") {
        const toastId = toast.loading("Generating Payment Excel..."); 
        excelMutation.mutate(payload, {
          onSuccess: () => toast.success("Payment Excel downloaded!", { id: toastId }), 
          onError: (err) => handleDownloadError(err, toastId)
        });
        return;
      }
      if (format === "PDF") {
        const toastId = toast.loading("Generating Payment PDF...");
        pdfMutation.mutate(payload, {
          onSuccess: () => toast.success("Payment PDF downloaded!", { id: toastId }),
          onError: (err) => handleDownloadError(err, toastId)
        });
        return;
      }
    }

    /*if (title === "Vendor-wise Report") {
      if (format === "Email") {
        if (!tableData || tableData.length === 0) {
          toast.error("No data available to send for these dates.");
          return;
        }
        const toastId = toast.loading("Sending Vendor Report Email...");
       emailMutation.mutate(payload, {
          onSuccess: () => toast.success("Email sent successfully!", { id: toastId }),
          onError: (err) => handleDownloadError(err, toastId)
        });
        return;
      }
      if (format === "PDF") {
        const toastId = toast.loading("Generating Vendor PDF...");
        vendorPdfMutation.mutate(payload, {
          onSuccess: () => toast.success("Vendor PDF downloaded!", { id: toastId }),
          onError: (err) => handleDownloadError(err, toastId)
        });
        return;
      }
    }*/

    if (title === "Commission Report") {
      if (format === "Excel") {
        const toastId = toast.loading("Generating Commission Excel...");
        commissionExcelMut.mutate(payload, {
          onSuccess: () => toast.success("Commission Excel downloaded!", { id: toastId }),
          onError: (err) => handleDownloadError(err, toastId)
        });
        return;
      }
      if (format === "PDF") {
        const toastId = toast.loading("Generating Commission PDF...");
        commissionPdfMut.mutate(payload, {
          onSuccess: () => toast.success("Commission PDF downloaded!", { id: toastId }),
          onError: (err) => handleDownloadError(err, toastId)
        });
        return;
      }
    }

    if (title === "Settlement Report") {
      if (format === "Excel") {
        const toastId = toast.loading("Generating Settlement Excel...");
        settlementExcelMut.mutate(payload, {
          onSuccess: () => toast.success("Settlement Excel downloaded!", { id: toastId }),
          onError: (err) => handleDownloadError(err, toastId)
        });
        return;
      }
      if (format === "PDF") {
        const toastId = toast.loading("Generating Settlement PDF...");
        settlementPdfMut.mutate(payload, {
          onSuccess: () => toast.success("Settlement PDF downloaded!", { id: toastId }),
          onError: (err) => handleDownloadError(err, toastId)
        });
        return;
      }
    }
  };

  const isButtonLoading = (title: string, format: string) => {
    if (title === "Daily Collection Report" && format === "Excel") return excelMutation.isPending;
    if (title === "Daily Collection Report" && format === "PDF") return pdfMutation.isPending;
    //if (title === "Vendor-wise Report" && format === "Email") return emailMutation.isPending;
    //if (title === "Vendor-wise Report" && format === "PDF") return vendorPdfMutation.isPending;
    if (title === "Commission Report" && format === "Excel") return commissionExcelMut.isPending;
    if (title === "Commission Report" && format === "PDF") return commissionPdfMut.isPending;
    if (title === "Settlement Report" && format === "Excel") return settlementExcelMut.isPending;
    if (title === "Settlement Report" && format === "PDF") return settlementPdfMut.isPending;
    return false;
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="text-sm font-bold text-muted-foreground mr-auto">Report Filters</div>
           <div className="flex items-center gap-2">
  <label className="text-xs font-bold uppercase text-muted-foreground">
    Meter:
  </label>

  <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-[170px] h-9 justify-between text-sm"
      >
        {selectedMeter
          ? metersData?.find((m) => m.meter_unique_code === selectedMeter)?.meter_unique_code
          : "Select Meter"}

        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent className="w-[250px] p-0">
      <Command>
        <CommandInput placeholder="Search meter..." />

        <CommandEmpty>No meter found.</CommandEmpty>

        <CommandGroup>
          {metersData?.map((meter) => (
            <CommandItem
              key={meter.meter_unique_code}
              value={meter.meter_unique_code}
              onSelect={() => {
                setSelectedMeter(meter.meter_unique_code);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedMeter === meter.meter_unique_code
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
              {meter.meter_unique_code}
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
</div>
        <div className="flex items-center gap-2">
       
          <label className="text-xs text-muted-foreground font-bold uppercase">From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-bold uppercase">To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:border-primary" />
        </div>
        <button onClick={() => { setSelectedMeter(""); setStartDate(""); setEndDate(""); }} className="text-xs font-bold text-coral-brand hover:underline">Clear</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {reports.map((r) => (
          <div key={r.title} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
            <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center mb-3.5" style={{ background: r.bg, color: r.color }}>
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-sm font-bold mb-1">{r.title}</div>
            <div className="text-xs text-muted-foreground">{r.desc}</div>
            <div className="flex gap-1.5 mt-4">
              {r.buttons.map((f) => {
                const isLoading = isButtonLoading(r.title, f);
                return (
                  <button 
                    key={f} onClick={() => handleAction(r.title, f)} disabled={isLoading}
                    className="flex-1 py-1.5 flex justify-center items-center gap-1 rounded-md text-[11px] font-bold border transition-opacity hover:opacity-80 disabled:opacity-50" 
                    style={{ borderColor: r.color + "40", background: r.bg.replace("0.1", "0.06"), color: r.color }}
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : f}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
          <h3 className="text-sm font-bold">Vendor-wise Summary</h3>
          {isTableFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
               {["Vendor", "Meter Count", "Txns", "Collected", "Settled", "Pending", "Commission"].map((h) => (
  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
))}
              </tr>
            </thead>
           <tbody className={isTableFetching ? "opacity-50 transition-opacity" : "transition-opacity"}>
              {tableData && tableData.length > 0 ? (
                tableData.map((v: any) => {
                  const pending = (v.total_collected || 0) - (v.total_settled || 0);
                  const commissionAmount = Math.round((v.total_settled || 0) * (settleConfig?.daily || 0) / 100);

                  return (
                    <tr key={v.vendor_id} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
                      <td className="px-4 py-3 font-semibold">{v.vendor_name}</td>
                      <td className="px-4 py-3 text-xs font-mono">{v.total_meters}</td>
                      <td className="px-4 py-3">{v.total_transactions}</td>
                      <td className="px-4 py-3 font-bold">{fmt(v.total_collected || 0)}</td>
                      <td className="px-4 py-3 text-emerald-brand">{fmt(v.total_settled || 0)}</td>
                      <td className="px-4 py-3 text-gold-brand">{fmt(pending > 0 ? pending : 0)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(commissionAmount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No vendor data found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;