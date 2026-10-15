import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { MessageSquare, PlusCircle, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useVendorIssuesData, useCreateVendorIssueMutation } from "@/Tanstack/allTanstack";

const VendorIssues = () => {
  const user = useAppSelector((s) => s.auth.user);
  const isVendor = user?.role !== "admin";

  const { data: issues, isLoading } = useVendorIssuesData(isVendor);
  const createIssue = useCreateVendorIssueMutation();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
 const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
const filteredIssues = useMemo(() => {
    if (!issues) return [];
    
    return issues.filter((issue: any) => {
      const isResolved = issue.status === 1 || issue.admin_response !== null;
      
      if (statusFilter === "pending") return !isResolved;
      if (statusFilter === "resolved") return isResolved;
      return true; // "all"
    });
  }, [issues, statusFilter]);
  const counts = useMemo(() => {
    const pending = issues?.filter((i: any) => !(i.status === 1 || i.admin_response !== null)).length || 0;
    const resolved = issues?.filter((i: any) => (i.status === 1 || i.admin_response !== null)).length || 0;
    return { pending, resolved, all: issues?.length || 0 };
  }, [issues]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both the subject and message.");
      return;
    }

    createIssue.mutate({ subject, message }, {
      onSuccess: () => {
        toast.success("Issue submitted successfully!");
        setSubject("");
        setMessage("");
      },
      onError: () => toast.error("Failed to submit issue. Please try again.")
    });
  };

  if (!isVendor) return <div className="p-10 text-center text-muted-foreground">Unauthorized Access</div>;

  return (
    <div className="animate-fade-in max-w-4xl space-y-6">
      
      {/* --- ADD ISSUE FORM --- */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <h2 className="text-sm font-extrabold flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" /> Report an Issue
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Subject *</label>
            <input 
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="e.g., Repair, Amount Issue" 
              className="w-full bg-background/40 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
              disabled={createIssue.isPending}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Message *</label>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Describe your issue in detail..." 
              className="w-full h-24 bg-background/40 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
              disabled={createIssue.isPending}
            />
          </div>
          <button 
            type="submit" 
            disabled={createIssue.isPending || !subject || !message}
            className="gradient-primary text-primary-foreground font-bold text-sm rounded-lg px-6 py-2.5 shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {createIssue.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            {createIssue.isPending ? "Submitting..." : "Submit Issue"}
          </button>
        </form>
      </div>

     {/* --- ISSUES HISTORY --- */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          
          {/* Header & Dynamic Badge */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-extrabold text-muted-foreground flex items-center gap-2">
              Your Support History {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            </h3>
            
            {/* 👇 THIS IS THE NEW DYNAMIC LOGIC: Changes color based on issue state! */}
            {!isLoading && counts.all > 0 && (
              counts.pending > 0 ? (
                <div className="text-[10px] font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">
                  {counts.pending} Pending Ticket
                </div>
              ) : (
                <div className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                  All Resolved
                </div>
              )
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(["all", "pending", "resolved"] as const).map((f) => {
              const isActive = statusFilter === f;
              
              // Standard colors when the button IS clicked
              const activeStyles = {
                all: "bg-primary text-primary-foreground border-primary shadow-sm",
                pending: "bg-red-500 text-white border-red-500 shadow-sm", 
                resolved: "bg-green-600 text-white border-green-600 shadow-sm" 
              };

              // 👇 If there are pending issues, keep the pending button red EVEN WHEN NOT CLICKED
              const inactiveStyles = (f === "pending" && counts.pending > 0)
                ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100" // Always reddish warning
                : "bg-card text-muted-foreground border-border hover:border-primary/50"; // Normal gray

              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    isActive ? activeStyles[f] : inactiveStyles
                  }`}
                >
                  {f} ({counts[f]})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          {!isLoading && filteredIssues.length === 0 && (
            <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
              No {statusFilter === "all" ? "" : statusFilter} issues found.
            </div>
          )}

          {filteredIssues?.map((issue: any, index: number) => {
            const isResolved = issue.status === 1 || issue.admin_response !== null;

            return (
              <div key={index} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/10 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-bold text-foreground">{issue.subject}</div>
                  
                  {/* Status Badge inside the card */}
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                    isResolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {isResolved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {isResolved ? "Resolved" : "Pending"}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {issue.message}
                </p>

                {/* Admin Reply Box */}
                {issue.admin_response ? (
                  <div className="bg-green-50 border-l-2 border-green-600 p-3 rounded-r-lg">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-1">Admin Reply</div>
                    <p className="text-sm text-green-900">{issue.admin_response}</p>
                  </div>
                ) : (
                  <div className="bg-background border border-dashed border-border p-3 rounded-lg text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Waiting for admin response...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default VendorIssues;