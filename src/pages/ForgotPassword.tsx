import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Droplet, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { type UserRole } from "@/lib/store/authSlice"; 
import { useForgotPasswordMutation, useUpdatePasswordMutation } from "@/Tanstack/allTanstack";

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // Step 1 State
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  
  // Step 2 State
  const [step, setStep] = useState<1 | 2>(1); // Controls which form to show
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const resetMutation = useForgotPasswordMutation();
  const updatePasswordMutation = useUpdatePasswordMutation();

  // --- Handle Step 1 (Sending Email) ---
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email"); 

    resetMutation.mutate(
      { email, role },
      {
        onSuccess: () => {
          toast.success("OTP sent to your email!");
          setStep(2); // Move to Step 2
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to send reset link.");
        }
      }
    );
  };

  // --- Handle Step 2 (Verifying OTP & Updating Password) ---
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) return toast.error("Please enter the 6-digit OTP");
    if (!newPassword || newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    updatePasswordMutation.mutate(
      { email, role, otp_code: otpCode, new_password: newPassword },
      {
        onSuccess: () => {
          toast.success("Password updated successfully!");
          navigate("/login"); // Send them back to login!
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Invalid OTP or failed to update password.");
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="fixed top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(195 100% 50% / 0.06), transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg gradient-primary shadow-glow flex items-center justify-center">
            <Droplet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wide text-primary">Rive Smart Meter</h1>
            <p className="text-[10px] text-muted-foreground font-mono">Water Payment System</p>
          </div>
        </div>

        {/* Hide Role Switcher if we are in Step 2 */}
        {step === 1 && (
          <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1">
            {(["admin", "vendor"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button" 
                onClick={() => { setRole(r); setEmail(""); }}
                className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                  role === r ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-7 shadow-card">
          {step === 1 ? (
            // ==========================================
            // STEP 1: REQUEST OTP FORM
            // ==========================================
            <>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-5 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
              <h2 className="text-base font-extrabold mb-1">Reset {role === "admin" ? "Admin" : "Vendor"} Password</h2>
              <p className="text-xs text-muted-foreground mb-6">Enter your email and we'll send you an OTP.</p>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={resetMutation.isPending}
                    className="w-full bg-background/40 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={resetMutation.isPending}
                  className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                >
                  {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            // ==========================================
            // STEP 2: VERIFY OTP & NEW PASSWORD FORM
            // ==========================================
            <div className="animate-fade-in">
              <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-5 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Use a different email
              </button>
              
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-emerald-brand" />
                <h2 className="text-base font-extrabold">Enter OTP</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                    autoComplete="one-time-code"
                    placeholder="123456"
                    disabled={updatePasswordMutation.isPending}
                    className="w-full bg-background/40 border border-border rounded-lg px-3.5 py-2.5 text-sm font-mono tracking-[0.5em] text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={updatePasswordMutation.isPending}
                    className="w-full bg-background/40 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={updatePasswordMutation.isPending}
                  className="w-full bg-emerald-subtle text-emerald-brand border border-emerald-brand/20 font-bold text-sm rounded-lg py-3 hover:bg-emerald-brand hover:text-white transition-colors flex justify-center items-center gap-2"
                >
                  {updatePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;