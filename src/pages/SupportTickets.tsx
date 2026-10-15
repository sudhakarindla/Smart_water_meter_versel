import { useState, useMemo } from "react"; 
import { useAppSelector } from "@/lib/store/hooks";
import { MessageSquare, CheckCircle, Loader2, Filter } from "lucide-react"; 
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminIssuesData, useResolveIssueMutation } from "@/Tanstack/allTanstack";

const SupportTickets = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === "admin";

  // 1. Fetch Data FIRST
  const { data: issues, isLoading } = useAdminIssuesData(isAdmin);
  const resolveIssue = useResolveIssueMutation();

  // 2. Define State
  const [statusFilter, setStatusFilter] = useState<"pending" | "completed" | "all">("pending");
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");

  // 3. Logic for Filtering (Calculated AFTER issues is fetched)
  const getIsOpen = (issue: any) => issue.status === 'open' || issue.status === 0 || issue.status === "0" || issue.status === false;

  const pendingIssues = useMemo(() => issues?.filter((i: any) => getIsOpen(i)) || [], [issues]);
  const completedIssues = useMemo(() => issues?.filter((i: any) => !getIsOpen(i)) || [], [issues]);
  
  const totalPending = pendingIssues.length;
  const totalCompleted = completedIssues.length;

  const displayedIssues = useMemo(() => {
    if (statusFilter === "pending") return pendingIssues;
    if (statusFilter === "completed") return completedIssues;
    return issues || [];
  }, [issues, statusFilter, pendingIssues, completedIssues]);

  const openResolveModal = (issue: any) => {
    setSelectedIssue(issue);
    setReplyText(issue.admin_response || "");
  };

  const handleResolve = () => {
    if (!replyText.trim()) {
      toast.error("Please enter a response for the vendor.");
      return;
    }
    const payload = { id: selectedIssue.id, response: replyText };
    resolveIssue.mutate(payload, {
      onSuccess: (res: any) => {
        if (res?.error) { toast.error(res.error); return; }
        toast.success("Ticket resolved successfully!");
        setSelectedIssue(null);
      },
      onError: () => toast.error("Failed to resolve ticket.")
    });
  };

  if (!isAdmin) return <div className="p-10 text-center text-muted-foreground">Unauthorized Access</div>;
  if (isLoading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading Tickets...</div>;

  return (
    <div className="animate-fade-in space-y-5">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Support Tickets
        </h2>
        
        {totalPending > 0 ? (
          <div className="text-sm font-bold text-coral-brand bg-coral-subtle px-3 py-1 rounded-full border border-coral-brand/20 animate-pulse">
            {totalPending} Tickets Action Required
          </div>
        ) : (
          <div className="text-sm font-bold text-emerald-brand bg-emerald-subtle px-3 py-1 rounded-full border border-emerald-brand/20">
            {totalCompleted} Tickets Resolved
          </div>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(["pending", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
              statusFilter === f 
                ? "bg-primary text-primary-foreground border-primary shadow-glow" 
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {f} {f === "pending" ? `(${totalPending})` : f === "completed" ? `(${totalCompleted})` : ""}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2">
                {["Ticket ID","Phone Number", "Vendor", "Subject", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
           <tbody>
              {displayedIssues.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No {statusFilter} tickets found.</td></tr>
              ) : displayedIssues.map((issue: any) => {
                const isOpen = getIsOpen(issue);
                return (
                  <tr key={issue.id} className="border-b border-border/20 hover:bg-primary/[0.025] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-emerald-brand">TKT-{issue.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold">{issue.first_name} {issue.last_name}</div>
                    </td>
                     <td className="px-4 py-3">
                      <div className="text-[11px] text-muted-foreground text-blue-400">{issue.phone}</div>
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold">{issue.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                        isOpen ? 'bg-gold-subtle text-gold-brand' : 'bg-emerald-subtle text-emerald-brand'
                      }`}>
                        {isOpen ? 'OPEN' : 'RESOLVED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {isOpen ? (
                        <button onClick={() => openResolveModal(issue)} className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-bold text-foreground hover:border-primary transition-colors">
                          Review & Resolve
                        </button>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-emerald-subtle text-emerald-brand">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Ticket TKT-{selectedIssue?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-surface2 border border-border p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">Vendor Message</div>
                <div className="text-[10px] font-mono text-muted-foreground">{selectedIssue?.first_name}</div>
              </div>
              <p className="text-sm text-foreground">{selectedIssue?.message}</p>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1">Admin Response</label>
              <textarea 
                value={replyText} 
                onChange={(e) => setReplyText(e.target.value)} 
                placeholder="Type your response to the vendor here..." 
                className="w-full h-24 bg-background/40 border border-border rounded-lg p-3 text-sm text-foreground outline-none focus:border-primary resize-none disabled:opacity-50"
              />
            </div>
            <button onClick={handleResolve} disabled={resolveIssue.isPending} className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              {resolveIssue.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {resolveIssue.isPending ? "Sending Reply..." : "Submit Reply & Resolve"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTickets;