import { useState } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import { loginSuccess, type UserRole } from "@/lib/store/authSlice"; 
import { useNavigate, Link } from "react-router-dom";
import { Droplet, Loader2 ,Eye, EyeOff} from "lucide-react";
import { toast } from "sonner";
import { useLoginMutation } from "@/Tanstack/allTanstack";
import { z } from "zod"; 

// ==========================================
// ZOD SCHEMA FOR LOGIN
// ==========================================
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(true);
  const [isPasswordReadOnly, setIsPasswordReadOnly] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  // Zod field errors and Backend server errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const loginMutation = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    // Validate inputs against Zod Schema
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return; 
    }

    // Fire TanStack Mutation
    loginMutation.mutate(
      { email: result.data.email, password: result.data.password, role },
      {
        onSuccess: (data) => {
          localStorage.setItem("smartjal_token", data.token);

          let userId = 0;
          try {
            const base64Payload = data.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const decodedToken = JSON.parse(window.atob(base64Payload));
            userId = role === "admin" ? decodedToken.admin_id : decodedToken.vendor_id; 
          } catch (err) {
            console.error("Failed to decode token", err);
          }

          dispatch(loginSuccess({
            id: userId,
            email: data.email,
            role: data.role as UserRole,
            name: data.name || ( data.role === "admin" ? "Administrator" : "Vendor User"), 
            avatar: data.name ? data.name.charAt(0).toUpperCase() : (data.role === "admin" ? "A" : "V")
          }));

         toast.success(`Welcome back, ${data.name || (role === "admin" ? "Administrator" : "Vendor")}!`);
          
          // Clear fields
          setEmail("");
          setPassword("");
          setErrors({});
          setServerError("");

          navigate("/dashboard");
        },
        onError: (err: any) => {
          const backendMessage = err.response?.data?.message || err.response?.data?.error || "Invalid credentials. Please try again.";
          setServerError(backendMessage);
          toast.error("Login failed");
        }
      }
    );
  };

  const getInputClass = (fieldName: string) => `w-full bg-background/40 border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/10 ${
    errors[fieldName] ? "border-coral-brand focus:border-coral-brand" : "border-border focus:border-primary"
  }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="fixed top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(195 100% 50% / 0.06), transparent 70%)" }} />
      <div className="fixed bottom-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(187 80% 58% / 0.04), transparent 70%)" }} />

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

        <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1">
          {(["admin", "vendor"] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button" 
              onClick={() => { setRole(r); setErrors({}); setServerError(""); }}
              className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                role === r ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-7 shadow-card">
          <h2 className="text-base font-extrabold mb-1">
            {role === "admin" ? "Admin Login" : "Vendor Login"}
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Sign in to your {role === "admin" ? "administrator" : "vendor"} portal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Email</label>
              <input
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isEmailReadOnly}
                onFocus={() => setIsEmailReadOnly(false)}
                placeholder={role === "admin" ? "admin@smartjal.in" : "vendor@smartjal.in"}
                className={getInputClass("email")}
                disabled={loginMutation.isPending} 
                autoComplete="username"
              />
              {errors.email && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.email}</p>}
            </div>
            
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Password</label>
              
              {/* 👇 Wrap input in a relative div */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} // 👈 Toggle type
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  readOnly={isPasswordReadOnly}
                  onFocus={() => setIsPasswordReadOnly(false)}
                  placeholder="••••••••"
                  className={`${getInputClass("password")} pr-10`} // 👈 Add pr-10 so text doesn't overlap the icon
                  disabled={loginMutation.isPending} 
                  autoComplete="current-password"
                />
                
                {/* 👇 Add the absolute positioned button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center h-full"
                  tabIndex={-1} // Prevents tab key from highlighting the icon
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errors.password && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.password}</p>}
            </div>

            {serverError && (
              <div className="bg-coral-subtle text-coral-brand text-xs font-semibold rounded-lg p-3">
                {serverError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loginMutation.isPending}
              className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                `Sign In as ${role === "admin" ? "Admin" : "Vendor"}`
              )}
            </button>
          </form>

          <div className="flex justify-between mt-5">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Forgot Password?
            </Link>
            {role === "admin" && (
            <Link to="/register" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Register
            </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
