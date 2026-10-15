import { useState, useMemo } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { fmt } from "@/lib/data";
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useVendorTransactionsData,useTransactionsData, useMeters  } from "@/Tanstack/allTanstack";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";



type SortField = "amount" | "liters" | "time";
type SortDir = "asc" | "desc" | "none";

const Transactions = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "admin";
  const vendorId = user?.id || 1; 


    const [open, setOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState("");  
    const {data: metersData} = useMeters();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDir, setSortDir] = useState<SortDir>("none");
  const isVendor = !isAdmin;

 // 1. Admin Hook (Fires ONLY when isAdmin is true)
  const { 
    data: adminTxns, 
    isLoading: adminLoading, 
    isFetching: adminFetching 
  } = useTransactionsData(isAdmin, dateFilter);

  // 2. Vendor Hook (Fires ONLY when isVendor is true)
  const { 
    data: vendorTxns, 
    isLoading: vendorLoading, 
    isFetching: vendorFetching 
  } = useVendorTransactionsData(isVendor, dateFilter, vendorId);

  // 3. Consolidate the active data
  const backendTxns = isAdmin ? adminTxns : vendorTxns;
  const isLoading = isAdmin ? adminLoading : vendorLoading;
  const isFetching = isAdmin ? adminFetching : vendorFetching;
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
  const filtered = useMemo(() => {
    if (!backendTxns) return [];

    // 1. MAPPING (WITH GUARANTEED UNIQUE KEYS)
    let rows = backendTxns.map((t: any, index: number) => ({
      // 🔥 This uniqueKey prevents React from freezing during searches
      uniqueKey: `row-${index}-${t.payment_id || 'empty'}`, 
      id: t.payment_id || t.id || "N/A",
      meter: t.meter_id || "N/A",
      vendor: `Vendor ${t.vendor_id || "N/A"}`, 
      amount: Number(t.amount_paid) || 0,
      liters: t.liters_calculated || 0,
      upi: t.payment_method || "UPI",
      time: t.created_at || new Date().toISOString(),
      status: (t.payment_status || "completed").toLowerCase(),
      meter_unique_code: t.meter_unique_code || "N/A",
      ...(!isAdmin && {
    time: t.created_at || new Date().toISOString(),
  }),
    }));
    

    // 2. FILTERING
    rows = rows.filter((t: any) => {
      // Handle both "completed" and "success" coming from DB
      const isSuccessfullyPaid = t.status === "completed" || t.status === "success" || t.status === "captured";
      const isCompleted = filter === "completed" && isSuccessfullyPaid;
      const isFailed = filter === "failed" && t.status === "failed";
      const mf = filter === "all" || isCompleted || isFailed;

      const searchTerm = search.trim().toLowerCase();
      
      let ms = true;
      if (searchTerm) {
        if (searchTerm.startsWith("vendor")) {
          // 🔥 SMART RULE 1: If they explicitly type "vendor", ONLY search vendors
          ms = String(t.vendor).toLowerCase().includes(searchTerm);
          
        } else if (/^\d+$/.test(searchTerm)) {
          // 🔥 SMART RULE 2: If they type pure numbers, EXACT match the Meter ID
          ms = String(t.meter).toLowerCase() === searchTerm;
          
        } else {
          // 🔥 SMART RULE 3: Fallback for alphanumeric strings (like "PAY_NEW_32")
          ms = String(t.meter).toLowerCase().includes(searchTerm) || 
               String(t.vendor).toLowerCase().includes(searchTerm) ||
               String(t.id).toLowerCase().includes(searchTerm); 
        }
      }
                 
      return mf && ms;
    });
   console.log("the  selected meter is-1", rows);
   
    rows = selectedMeter ? rows.filter((t: any) => {   console.log("the  selected meter is", selectedMeter,  t.meter_unique_code); return t.meter_unique_code === selectedMeter}) : rows;
rows = rows.filter((t: any) => {
  const createdDate = new Date(t.time).toISOString().split("T")[0];

  if (startDate && createdDate < startDate) return false;
  if (endDate && createdDate > endDate) return false;

  return true;
});
    // 3. SORTING

    if (sortDir !== "none") {
      rows = [...rows].sort((a: any, b: any) => {
        const av = sortField === "time" ? new Date(a.time).getTime() : a[sortField];
        const bv = sortField === "time" ? new Date(b.time).getTime() : b[sortField];
        return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
      });
    }

    return rows;
  }, [backendTxns, filter, search, sortField, sortDir, selectedMeter, startDate,
  endDate,]);

  // --- EXPORT LOGIC ---
  const exportData = (format: "pdf" | "excel") => {
    if (filtered.length === 0) return toast.error("No data to export");

    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Transactions Report", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()} | Filter: ${dateFilter}`, 14, 28);

      const tableColumn = isAdmin 
        ? ["ID", "Meter", "Vendor", "Amount (INR)", "Liters", "Time", "Status"]
        : ["ID", "Meter", "Amount (INR)", "Liters", "Time", "Status"];

      const tableRows = filtered.map((tx: any) => {
        const baseRow = [
          tx.id,
          tx.meter,
          Math.round(tx.amount).toString(),
          `${tx.liters}L`,
          new Date(tx.time).toLocaleString(),
          tx.status.toUpperCase()
        ];
        if (isAdmin) baseRow.splice(2, 0, tx.vendor);
        return baseRow;
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [20, 184, 166] },
        styles: { font: "helvetica", fontSize: 8 },
      });

      doc.save(`Transactions_${new Date().getTime()}.pdf`);
      toast.success("PDF exported successfully");
    } else {
      const worksheetData = filtered.map((tx: any) => {
        const data: any = {
          "Transaction ID": tx.id,
          "Meter ID": tx.meter,
          "Amount": tx.amount,
          "Liters": tx.liters,
          "Date Time": new Date(tx.time).toLocaleString(),
          "Status": tx.status
        };
        if (isAdmin) {
          data["Vendor"] = tx.vendor;
          data["Method"] = tx.upi;
        }
        return data;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      XLSX.writeFile(workbook, `Transactions_${new Date().getTime()}.xlsx`);
      toast.success("Excel exported successfully");
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField !== field) { setSortField(field); setSortDir("asc"); }
    else setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? "none" : "asc");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field || sortDir === "none") return <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />;
  };

  const headers = isAdmin
    ? ["ID", "Meter", "Vendor", "Amount", "Liters", "UPI", "Time", "Status"]
    : ["ID", "Meter", "Amount", "Liters", "Time", "Status"];

  if (isLoading && !backendTxns) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-muted-foreground animate-pulse gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-mono text-sm">Loading Transactions...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        {["all", "completed", "failed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? "border-primary bg-emerald-subtle text-emerald-brand" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs ml-2">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last_week">Last 7 Days</SelectItem>
            <SelectItem value="last_month">Last 30 Days</SelectItem>
            <SelectItem value="last_year">Last Year</SelectItem>
          </SelectContent>
        </Select>
       {isAdmin &&<label className="text-xs font-bold uppercase text-muted-foreground">
    Meter:
  </label>}

  {isAdmin &&<Popover open={open} onOpenChange={setOpen}>
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
  </Popover>}
  {!isAdmin && (
  <>
    <label className="text-xs font-bold uppercase text-muted-foreground">
      Start Date:
    </label>

    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="h-9 rounded-md border px-3 text-sm"
    />

    <label className="text-xs font-bold uppercase text-muted-foreground">
      End Date:
    </label>

    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="h-9 rounded-md border px-3 text-sm"
    />
     <button
      onClick={() => {
        setStartDate("");
        setEndDate("");
      }}
      className="h-9 px-4 rounded-md border text-sm text-red-500"
    >
      Clear
    </button>
  </>
)}


        <div className="ml-auto flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value.toLowerCase())} className="border-none bg-transparent py-2.5 text-sm text-foreground outline-none w-40" />
          </div>
          <div className="flex gap-1">
            {(["pdf", "excel"] as const).map((f) => (
              <button key={f} onClick={() => exportData(f)} className="bg-secondary border border-border text-muted-foreground rounded-lg px-2.5 py-2 text-[10px] font-bold uppercase inline-flex items-center gap-1 hover:text-foreground transition-colors">
                <Download className="w-3 h-3" /> {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs text-muted-foreground">{filtered.length} transactions</div>
        {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
                {headers.map((h) => {
                  const sortable = h === "Amount" ? "amount" : h === "Liters" ? "liters" : h === "Time" ? "time" : null;
                  return (
                    <th key={h} className={`px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ${sortable ? "cursor-pointer select-none hover:text-foreground" : ""}`} onClick={() => sortable && toggleSort(sortable)}>
                      {h}{sortable && <SortIcon field={sortable} />}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-50 transition-opacity" : "transition-opacity"}>
              {filtered.map((tx: any) => (
                <tr key={tx.uniqueKey} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-emerald-brand">{tx.id}</td>
                  <td className="px-4 py-3 text-xs font-mono">{tx.meter}</td>
                  {isAdmin && <td className="px-4 py-3 text-sm">{tx.vendor}</td>}
                  <td className="px-4 py-3 text-sm font-bold">{fmt(tx.amount)}</td>
                  <td className="px-4 py-3 text-teal-brand">{tx.liters}L</td>
                  {isAdmin && <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{tx.upi}</td>}
                  <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{new Date(tx.time).toLocaleString()}</td>
                  <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
    ["captured", "success", "completed"].includes(tx.status.toLowerCase()) 
       ? "bg-green-100 text-green-600"
  : "bg-red-100 text-red-600"
  }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isFetching && (
                <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-muted-foreground">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
