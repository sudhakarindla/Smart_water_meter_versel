import { useMemo, useState } from "react";
import { useSettelementHistoryData } from "@/Tanstack/allTanstack";
import { Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useSettelMutation } from "@/Tanstack/allTanstack";

const ManualSettlement = () => {
  const {
    data: settlementHistory,
    isLoading,
    isFetching,
  } = useSettelementHistoryData(true);

  const [selectedDate, setSelectedDate] = useState("");
const { mutate: settleMutation } = useSettelMutation();
  const filteredData = useMemo(() => {
    if (!settlementHistory) return [];

    if (!selectedDate) return settlementHistory;

    return settlementHistory.filter((item: any) => {
      const createdDate = new Date(item.created_date)
        .toISOString()
        .split("T")[0];

      return createdDate === selectedDate;
    });
  }, [settlementHistory, selectedDate]);

  const downloadExcel = () => {
    if (!filteredData.length) return;

    const excelData = filteredData.map((item: any) => ({
      "Vendor Name": item.vendor_name,
      "Account Holder": item.account_holder_name,
      "Account Number": item.account_number,
      "Bank Name": item.bank_name,
      "IFSC Code": item.ifsc_code,
      "Phone Number": item.phone,
      "Commission Amount": item.commission_amount,
      "Net Amount": item.net_amount,
      "Total Amount": item.total_amount,
      "Created Date": new Date(item.created_date).toLocaleDateString(
        "en-IN"
      ),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Settlements");
    XLSX.writeFile(workbook, "Settlement_History.xlsx");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            {filteredData.length} settlements
          </div>

          {isFetching && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm"
          />

          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="px-3 py-2 rounded-lg border text-sm"
            >
              Clear
            </button>
          )}

          <button
            onClick={downloadExcel}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
          >
            Download Excel
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Vendor Name
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Account Holder
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Account Number
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Bank Name
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  IFSC Code
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Phone Number
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Commission
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Net Amount
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Total Amount
                </th>

                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Created Date
                </th>

                <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Action
                </th>
              </tr>
            </thead>

            <tbody
              className={
                isFetching
                  ? "opacity-50 transition-opacity"
                  : "transition-opacity"
              }
            >
                          {filteredData.map((item: any) => (
                <tr
                  key={item.settlement_id}
                  className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    {item.vendor_name}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {item.account_holder_name}
                  </td>

                  <td className="px-4 py-3 text-xs font-mono">
                    {item.account_number}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {item.bank_name}
                  </td>

                  <td className="px-4 py-3 text-xs font-mono">
                    {item.ifsc_code}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {item.phone}
                  </td>

                  <td className="px-4 py-3 text-sm font-semibold text-red-500">
                    ₹{item.commission_amount}
                  </td>

                  <td className="px-4 py-3 text-sm font-semibold text-green-600">
                    ₹{item.net_amount}
                  </td>

                  <td className="px-4 py-3 text-sm font-semibold">
                    ₹{item.total_amount}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {new Date(item.created_date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                    onClick={() => settleMutation({"settlement_id": item.settlement_id, "vendor_id": item.vendor_id, "date":  new Date(item.created_date).toISOString().split("T")[0]})}
                      className="px-3 py-1.5 rounded-lg bg-emerald-brand text-black text-xs font-semibold hover:opacity-90 transition bg-green-300"
                    >
                      Settled
                    </button>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && !isFetching && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No settlement records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ManualSettlement;
            