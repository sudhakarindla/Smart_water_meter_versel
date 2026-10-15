// import { useState } from "react";
// import { useAppSelector } from "@/lib/store/hooks";
// import { fmt } from "@/lib/data";
// import { BarChart3, DollarSign, Zap, FileText, Loader2 } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
// import { 
//   useDashboardData, useFilteredTrend, 
//   useVendorDashboardData, useVendorFilteredTrend 
// } from "@/Tanstack/allTanstack";
// const Dashboard = () => {
//   const user = useAppSelector((s) => s.auth.user);
//   const transactions = useAppSelector((s) => s.app.transactions); // Keeping as fallback for admin
//   const navigate = useNavigate();
  
//   const role = user?.role || "vendor";
//   const isAdmin = role === "admin";
  
//   // NOTE: Assuming your user object doesn't have an ID yet, we hardcode to 1 for testing. 
//   // You will need to add `id` to your authSlice User type later!
//   const vendorId = user?.id || 1; 

//   const [chartFilter, setChartFilter] = useState("today");

//   // Fetch Data using TanStack
// const backendFilterMap: Record<string, string> = {
//     today: "today",
//     last7: "last_week", last30: "last_month", year: "last_year"
//   };
//   const mappedFilter = backendFilterMap[chartFilter] || chartFilter;

//   // 1. Fire Admin Hooks (These do nothing if isAdmin is false)
//   const { data: adminApiData, isLoading: isAdminLoading } = useDashboardData(isAdmin);
//   const { data: adminTrend } = useFilteredTrend(mappedFilter, isAdmin);

//   // 2. Fire Vendor Hooks (These do nothing if role is 'admin')
//   const isVendor = !isAdmin;
//   const { data: vendorApiData, isLoading: isVendorLoading } = useVendorDashboardData(role, vendorId);
//   // Note: Your vendor hook requires role & vendorId to be enabled properly
//   const { data: vendorTrend } = useVendorFilteredTrend(mappedFilter, role, vendorId);

//   // 3. Consolidate the active data based on role
//   const isLoading = isAdmin ? isAdminLoading : isVendorLoading;
//   const apiData = isAdmin ? adminApiData : vendorApiData;
//   const trendResponse = isAdmin ? adminTrend : vendorTrend;

//   if (isLoading || !apiData) {
//       return (
//         <div className="h-[70vh] flex flex-col items-center justify-center text-muted-foreground animate-pulse gap-3">
//           <Loader2 className="w-8 h-8 animate-spin text-primary" />
//           <p className="font-mono text-sm">Loading Dashboard Data...</p>
//         </div>
//       );
//   }
//   // --- Dynamic Mappings from your Backend ---

//   // 1. KPIs
//   const kpis = isAdmin ? [
//     { label: "Total Collected", value: apiData.total_collected || 0, color: "hsl(195 100% 50%)", glow: "hsl(195 100% 50% / 0.07)", icon: <BarChart3 className="w-3.5 h-3.5" /> },
//     { label: "Total Settled", value: apiData.total_settled || 0, color: "hsl(195 100% 62%)", glow: "hsl(195 100% 62% / 0.07)", icon: <DollarSign className="w-3.5 h-3.5" /> },
//     { label: "Pending Settlement", value: apiData.pending_settlements || 0, color: "hsl(187 80% 58%)", glow: "hsl(187 80% 58% / 0.07)", icon: <Zap className="w-3.5 h-3.5" /> },
//     { label: "Commission Earned", value: apiData.total_commission || 0, color: "hsl(220 60% 68%)", glow: "hsl(220 60% 68% / 0.07)", icon: <FileText className="w-3.5 h-3.5" /> },
//   ] : [
//     { label: "Total Collected", value: apiData.total_collected || 0, color: "hsl(195 100% 50%)", glow: "hsl(195 100% 50% / 0.07)", icon: <BarChart3 className="w-3.5 h-3.5" /> },
//     { label: "Total Settled", value: apiData.total_settled || 0, color: "hsl(195 100% 62%)", glow: "hsl(195 100% 62% / 0.07)", icon: <DollarSign className="w-3.5 h-3.5" /> },
//     { label: "Pending Settlement", value: apiData.pending_settlements || 0, color: "hsl(187 80% 58%)", glow: "hsl(187 80% 58% / 0.07)", icon: <Zap className="w-3.5 h-3.5" /> },
//   ];

//   // 2. Trend Data
//   const currentTrendData = trendResponse?.collection_trend || apiData.collection_trend || [];
//   const barChartData = currentTrendData.map((item: any) => ({
//       name: new Date(item.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//       value: item.total_amount || 0
//   }));

//   // 3. Pie Chart (Parsed from backend total_meters_status)
//   let activeCount = 0;
//   let offlineCount = 0;
//   if (apiData.total_meters_status) {
//     apiData.total_meters_status.forEach((m: any) => {
//       if (m.status === 'active') activeCount += m.meter_count;
//       if (m.status === 'inactive') offlineCount += m.meter_count;
//     });
//   }
//   const pieData = [
//     { name: "Active", value: activeCount, color: "hsl(195, 100%, 50%)" },
//     { name: "Offline", value: offlineCount, color: "hsl(0, 72%, 51%)" },
//   ];

//   // 4. Today's Activity (Parsed from backend todays_activity)
//   const todayRev = apiData.todays_activity?.total_amount || 0;
//   const todayL = apiData.todays_activity?.total_liters || 0;
//   const todayTxnCount = apiData.todays_activity?.row_count || 0;

//   // 5. Recent Transactions
//   const recentTxns = apiData.transaction_details || transactions;

//   return (
//     <div className="animate-fade-in space-y-5">
//       {/* KPIs */}
//       <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-3"} gap-4`}>
//         {kpis.map((k, i) => (
//           <div key={i} className="bg-card border border-border rounded-xl p-5 relative overflow-hidden shadow-card hover:border-primary/20 transition-all">
//             <div className="absolute top-0 right-0 w-[90px] h-[90px] rounded-bl-full" style={{ background: k.glow }} />
//             <div className="absolute top-4 right-4 opacity-60" style={{ color: k.color }}>{k.icon}</div>
//             <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">{k.label}</div>
//             <div className="text-2xl font-extrabold mb-2.5 animate-count-up" style={{ color: k.color }}>{fmt(k.value)}</div>
//           </div>
//         ))}
//       </div>

//       {/* Chart Filter */}
//       <div className="flex items-center justify-between flex-wrap gap-2">
//         <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Charts & Analytics</div>
//         <Select value={chartFilter} onValueChange={setChartFilter}>
//           <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="today">Today</SelectItem>
//             <SelectItem value="year">This Year</SelectItem>
//             <SelectItem value="last7">Last 7 Days</SelectItem>
//             <SelectItem value="last30">Last 30 Days</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Middle row */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         {/* Meter Status Pie */}
//         <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
          
//           {/* 👇 UPDATED HEADER WITH BADGES */}
//           <div className="flex justify-between items-center mb-4">
//             <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Meter Status</div>
//             <div className="flex gap-2 text-[9px] font-bold uppercase tracking-widest">
//               <span className="text-emerald-brand bg-emerald-subtle px-2 py-1 rounded-md border border-emerald-subtle">
//                 ● {activeCount} Active
//               </span>
//               <span className="text-coral-brand bg-coral-subtle px-2 py-1 rounded-md border border-coral/20">
//                 ● {offlineCount} Offline
//               </span>
//             </div>
//           </div>
//           <ResponsiveContainer width="100%" height={160}>
//             <PieChart>
//               <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
//                 {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
//               </Pie>
//               <Legend verticalAlign="bottom" height={30} formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>} />
//               <Tooltip contentStyle={{ background: "hsl(210,14%,7%)", border: "1px solid hsl(195,30%,14%)", borderRadius: "8px", fontSize: "12px",color: "#fff"}} itemStyle={{ color: "#fff" }}/>
//             </PieChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Today's Activity */}
//         <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
//           <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Today's Activity</div>
//           {[
//             { l: "Transactions", v: todayTxnCount, c: "text-emerald-brand" },
//             { l: "Revenue", v: fmt(todayRev), c: "text-emerald-brand" },
//             { l: "Liters Dispensed", v: todayL + "L", c: "text-teal-brand" },
//             { l: "Active Meters", v: activeCount, c: "text-lavender-brand" },
//           ].map((r, i) => (
//             <div key={i} className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0">
//               <span className="text-xs text-muted-foreground">{r.l}</span>
//               <span className={`text-sm font-bold ${r.c}`}>{r.v}</span>
//             </div>
//           ))}
//         </div>

//         {/* Collection Bar Chart */}
//         <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
//           <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Collection Trend</div>
//           <ResponsiveContainer width="100%" height={160}>
//             <BarChart data={barChartData}>
//               <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(200,12%,48%)" }} axisLine={false} tickLine={false} />
//               {/* <YAxis tick={{ fontSize: 10, fill: "hsl(200,12%,48%)" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} /> */}
//               <YAxis 
//   tick={{ fontSize: 10, fill: "hsl(200,12%,48%)" }} 
//   axisLine={false} 
//   tickLine={false} 
//   width={45} 
//   tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : `₹${v}`} 
// />
//               <Tooltip contentStyle={{ background: "hsl(210,14%,7%)", border: "1px solid hsl(195,30%,14%)", borderRadius: "8px", fontSize: "12px", color: "#fff"}} itemStyle={{ color: "#fff" }} formatter={(value: number) => [fmt(value), "Collection"]} />
//               <Bar dataKey="value" fill="hsl(195,100%,50%)" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Recent Transactions */}
//       <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
//         <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
//           <h3 className="text-sm font-bold">Recent Transactions</h3>
//           <button onClick={() => navigate("/transactions")} className="text-xs text-muted-foreground font-bold hover:text-foreground transition-colors">View All →</button>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-border">
//                 {["ID", "Meter", "Amount", "Liters", "Status", "Time"].map((h) => (
//                   <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {recentTxns.slice(0, 5).map((tx: any, idx: number) => {
//                 // Determine values depending on if it came from backend or Redux fallback
//                 const id = tx.payment_id || tx.id;
//                 const meter = tx.meter_id || tx.meter;
//                 const amount = Number(tx.amount_paid) || tx.amount;
//                 const liters = tx.liters_calculated || tx.liters;
//                 const status = tx.payment_status || tx.status;
//                 const time = tx.created_at || tx.time;

//                 return (
//                   <tr key={id || idx} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
//                     <td className="px-4 py-3 text-xs font-mono text-emerald-brand">{id}</td>
//                     <td className="px-4 py-3 text-xs font-mono">{meter}</td>
//                     <td className="px-4 py-3 text-sm font-bold">{fmt(amount)}</td>
//                     <td className="px-4 py-3 text-teal-brand">{liters}L</td>
//                     <td className="px-4 py-3">
//                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${status === "completed" ? "bg-emerald-subtle text-emerald-brand" : "bg-coral-subtle text-coral-brand"}`}>
//                         {status === "completed" ? "✓ DONE" : "✗ FAILED"}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">
//                       {new Date(time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;



import { useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { fmt } from "@/lib/data";
import { BarChart3, DollarSign, Zap, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { 
  useDashboardData, useFilteredTrend, 
  useVendorDashboardData, useVendorFilteredTrend 
} from "@/Tanstack/allTanstack";

const Dashboard = () => {
  const user = useAppSelector((s) => s.auth.user);
  const transactions = useAppSelector((s) => s.app.transactions); // Keeping as fallback for admin
  const navigate = useNavigate();
  
  const role = user?.role || "vendor";
  const isAdmin = role === "admin";
  
  // NOTE: Assuming your user object doesn't have an ID yet, we hardcode to 1 for testing. 
  // You will need to add `id` to your authSlice User type later!
  const vendorId = user?.id || 1; 

  const [chartFilter, setChartFilter] = useState("today");

  // Fetch Data using TanStack
  const backendFilterMap: Record<string, string> = {
    today: "today",
    last7: "last_week", last30: "last_month", year: "last_year"
  };
  const mappedFilter = backendFilterMap[chartFilter] || chartFilter;

  // 1. Fire Admin Hooks (These do nothing if isAdmin is false)
  const { data: adminApiData, isLoading: isAdminLoading } = useDashboardData(isAdmin);
  const { data: adminTrend } = useFilteredTrend(mappedFilter, isAdmin);

  // 2. Fire Vendor Hooks (These do nothing if role is 'admin')
  const isVendor = !isAdmin;
  const { data: vendorApiData, isLoading: isVendorLoading } = useVendorDashboardData(role, vendorId);
  // Note: Your vendor hook requires role & vendorId to be enabled properly
  const { data: vendorTrend } = useVendorFilteredTrend(mappedFilter, role, vendorId);

  // 3. Consolidate the active data based on role
  const isLoading = isAdmin ? isAdminLoading : isVendorLoading;
  const apiData = isAdmin ? adminApiData : vendorApiData;
  const trendResponse = isAdmin ? adminTrend : vendorTrend;

  if (isLoading || !apiData) {
      return (
        <div className="h-[70vh] flex flex-col items-center justify-center text-muted-foreground animate-pulse gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-mono text-sm">Loading Dashboard Data...</p>
        </div>
      );
  }

  // --- Dynamic Mappings from your Backend ---

  // 👇 Calculate Meter Counts early so we can use them in the KPIs
  let activeCount = 0;
  let offlineCount = 0;
  if (apiData.total_meters_status) {
    apiData.total_meters_status.forEach((m: any) => {
      if (m.status === 'active') activeCount += m.meter_count;
      if (m.status === 'inactive') offlineCount += m.meter_count;
    });
  }
  const totalMeters = activeCount + offlineCount;

  // 1. KPIs (Now includes Total Meters right beside Total Collected)
  const kpis = isAdmin ? [
     { label: "Total Units", value: totalMeters, color: "hsl(280 80% 65%)", glow: "hsl(280 80% 65% / 0.07)", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { label: "Total Collected", value: apiData.total_collected || 0, color: "hsl(195 100% 50%)", glow: "hsl(195 100% 50% / 0.07)", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { label: "Total Settled", value: apiData.total_settled || 0, color: "hsl(195 100% 62%)", glow: "hsl(195 100% 62% / 0.07)", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { label: "Pending Settlement", value: apiData.pending_settlements || 0, color: "hsl(187 80% 58%)", glow: "hsl(187 80% 58% / 0.07)", icon: <Zap className="w-3.5 h-3.5" /> },
    { label: "Commission Earned", value: apiData.total_commission || 0, color: "hsl(220 60% 68%)", glow: "hsl(220 60% 68% / 0.07)", icon: <FileText className="w-3.5 h-3.5" /> },
  ] : [
    { label: "Total Units", value: totalMeters, color: "hsl(280 80% 65%)", glow: "hsl(280 80% 65% / 0.07)", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { label: "Total Collected", value: apiData.total_collected || 0, color: "hsl(195 100% 50%)", glow: "hsl(195 100% 50% / 0.07)", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { label: "Total Settled", value: apiData.total_settled || 0, color: "hsl(195 100% 62%)", glow: "hsl(195 100% 62% / 0.07)", icon: <DollarSign className="w-3.5 h-3.5" /> },
    { label: "Pending Settlement", value: apiData.pending_settlements || 0, color: "hsl(187 80% 58%)", glow: "hsl(187 80% 58% / 0.07)", icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  // 2. Trend Data
  const currentTrendData = trendResponse?.collection_trend || apiData.collection_trend || [];
  const barChartData = currentTrendData.map((item: any) => ({
      name: new Date(item.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.total_amount || 0
  }));

  // 3. Pie Chart (Parsed from backend total_meters_status)
  const pieData = [
    { name: "Active", value: activeCount, color: "hsl(195, 100%, 50%)" },
    { name: "Offline", value: offlineCount, color: "hsl(0, 72%, 51%)" },
  ];

  // 4. Today's Activity (Parsed from backend todays_activity)
  const todayRev = apiData.todays_activity?.total_amount || 0;
  const todayL = apiData.todays_activity?.total_liters || 0;
  const todayTxnCount = apiData.todays_activity?.row_count || 0;

  // 5. Recent Transactions
  const recentTxns = apiData.transaction_details || transactions;

  return (
    <div className="animate-fade-in space-y-5">
      {/* KPIs 👇 Updated to grid-cols-5 for Admin to fit all 5 in one row */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${isAdmin ? "xl:grid-cols-5" : "xl:grid-cols-4"} gap-4`}>
        {kpis.map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 relative overflow-hidden shadow-card hover:border-primary/20 transition-all">
            <div className="absolute top-0 right-0 w-[90px] h-[90px] rounded-bl-full" style={{ background: k.glow }} />
            <div className="absolute top-4 right-4 opacity-60" style={{ color: k.color }}>{k.icon}</div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">{k.label}</div>
            <div className="text-2xl font-extrabold mb-2.5 animate-count-up" style={{ color: k.color }}>
              {k.label === "Total Units" ? k.value : fmt(k.value)} {/* Don't format the raw count as currency! */}
            </div>
          </div>
        ))}
      </div>

      {/* Chart Filter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Charts & Analytics</div>
        <Select value={chartFilter} onValueChange={setChartFilter}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="last7">Last 7 Days</SelectItem>
            <SelectItem value="last30">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Middle row 👇 Updated to lg:grid-cols-2 so the two remaining cards take up more space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ========================================================
            COMMENTED OUT: Meter Status Pie 
            ======================================================== */}
        {/* <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Meter Status</div>
            <div className="flex gap-2 text-[9px] font-bold uppercase tracking-widest">
              <span className="text-emerald-brand bg-emerald-subtle px-2 py-1 rounded-md border border-emerald-subtle">
                ● {activeCount} Active
              </span>
              <span className="text-coral-brand bg-coral-subtle px-2 py-1 rounded-md border border-coral/20">
                ● {offlineCount} Offline
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend verticalAlign="bottom" height={30} formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>} />
              <Tooltip contentStyle={{ background: "hsl(210,14%,7%)", border: "1px solid hsl(195,30%,14%)", borderRadius: "8px", fontSize: "12px",color: "#fff"}} itemStyle={{ color: "#fff" }}/>
            </PieChart>
          </ResponsiveContainer>
        </div> */}

        {/* Today's Activity */}
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Today's Activity</div>
          {[
            { l: "Transactions", v: todayTxnCount, c: "text-emerald-brand" },
            { l: "Revenue", v: fmt(todayRev), c: "text-emerald-brand" },
            { l: "Liters Dispensed", v: todayL + "L", c: "text-teal-brand" },
            { l: "Active Meters", v: activeCount, c: "text-lavender-brand" },
          ].map((r, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground">{r.l}</span>
              <span className={`text-sm font-bold ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Collection Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all flex flex-col">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Collection Trend</div>
          
          {/* 👇 Check if there is data. If not, show "No data found". If there is, render chart. */}
          {barChartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-[160px]">
              <span className="text-sm font-semibold text-muted-foreground/60">No data found</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(200,12%,48%)" }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 10, fill: "hsl(200,12%,48%)" }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={45} 
                  tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(1).replace(/\.0$/, '')}k` : `₹${v}`} 
                />
                <Tooltip contentStyle={{ background: "hsl(210,14%,7%)", border: "1px solid hsl(195,30%,14%)", borderRadius: "8px", fontSize: "12px", color: "#fff"}} itemStyle={{ color: "#fff" }} formatter={(value: number) => [fmt(value), "Collection"]} />
                <Bar dataKey="value" fill="hsl(195,100%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold">Recent Transactions</h3>
          <button onClick={() => navigate("/transactions")} className="text-xs text-muted-foreground font-bold hover:text-foreground transition-colors">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Meter", "Amount", "Liters", "Status", "Time"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTxns.slice(0, 5).map((tx: any, idx: number) => {
                // Determine values depending on if it came from backend or Redux fallback
                const id = tx.payment_id || tx.id;
                const meter = tx.meter_id || tx.meter;
                const amount = Number(tx.amount_paid) || tx.amount;
                const liters = tx.liters_calculated || tx.liters;
                const status = tx.payment_status || tx.status;
                const time = tx.created_at || tx.time;

                return (
                  <tr key={id || idx} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-emerald-brand">{id}</td>
                    <td className="px-4 py-3 text-xs font-mono">{meter}</td>
                    <td className="px-4 py-3 text-sm font-bold">{fmt(amount)}</td>
                    <td className="px-4 py-3 text-teal-brand">{liters}L</td>
                    <td className="px-4 py-3">
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
    ["captured", "success", "completed"].includes(status?.toLowerCase()) 
        ? "bg-green-100 text-green-600"
  : "bg-red-100 text-red-600"
  }`}>
                       {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">
                      {new Date(time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;