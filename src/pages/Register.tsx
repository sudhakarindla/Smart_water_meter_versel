// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { Droplet, Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import { useRegisterAdmin } from "@/Tanstack/allTanstack";
// import { z } from "zod";

// // ==========================================
// // ZOD SCHEMA FOR REGISTRATION
// // ==========================================
// const registerSchema = z.object({
//   firstName: z.string().min(1, "First name is required").max(100, "Max 100 characters"),
//   lastName: z.string().min(1, "Last name is required").max(100, "Max 100 characters"),
//   email: z.string().min(1, "Email is required").email("Please enter a valid email address (e.g., name@gmail.com)").max(150, "Max 150 characters"),
//   phone: z.string()
//     .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
//     .optional()
//     .or(z.literal("")),
//   password: z.string().min(8, "Password must be at least 8 characters"),
//   confirmPassword: z.string()
// }).refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords do not match",
//   path: ["confirmPassword"], 
// });

// const Register = () => {
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
  
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [serverError, setServerError] = useState("");
  
//   const navigate = useNavigate();
//   const registerMutation = useRegisterAdmin();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrors({});
//     setServerError("");

//     const result = registerSchema.safeParse({
//       firstName, lastName, email, phone, password, confirmPassword
//     });

//     if (!result.success) {
//       const fieldErrors: Record<string, string> = {};
//       result.error.issues.forEach((issue) => {
//         if (issue.path[0]) {
//           fieldErrors[issue.path[0] as string] = issue.message;
//         }
//       });
//       setErrors(fieldErrors);
//       return; 
//     }

//     const payload = {
//       first_name: result.data.firstName,
//       last_name: result.data.lastName,
//       email: result.data.email,
//       phone: result.data.phone || null, 
//       password: result.data.password,
//       role: "admin"
//     };

//     registerMutation.mutate(payload, {
//       onSuccess: () => {
//         toast.success("Admin account created successfully!");
        
//         // Clear fields
//         setFirstName("");
//         setLastName("");
//         setEmail("");
//         setPhone("");
//         setPassword("");
//         setConfirmPassword("");
//         setErrors({});
//         setServerError("");

//         navigate("/login");
//       },
//       onError: (err: any) => {
//         const backendMessage = err?.response?.data?.message || err?.response?.data?.error || "Failed to register account. Please try again.";
//         setServerError(backendMessage);
//         toast.error("Registration failed");
//       }
//     });
//   };

//   const getInputClass = (fieldName: string) => `w-full bg-background/40 border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/10 ${
//     errors[fieldName] ? "border-coral-brand focus:border-coral-brand" : "border-border focus:border-primary"
//   }`;

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
//       <div className="fixed top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(195 100% 50% / 0.06), transparent 70%)" }} />
//       <div className="fixed bottom-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(187 80% 58% / 0.04), transparent 70%)" }} />

//       <div className="w-full max-w-md relative z-10 animate-slide-up py-8">
//         <div className="flex items-center justify-center gap-3 mb-8">
//           <div className="w-10 h-10 rounded-lg gradient-primary shadow-glow flex items-center justify-center">
//             <Droplet className="w-5 h-5 text-primary-foreground" />
//           </div>
//           <div>
//             <h1 className="text-lg font-extrabold tracking-wide text-primary">SmartJal</h1>
//             <p className="text-[10px] text-muted-foreground font-mono">Water Payment System</p>
//           </div>
//         </div>

//         <div className="bg-card border border-border rounded-2xl p-7 shadow-card">
//           <h2 className="text-base font-extrabold mb-1">Admin Registration</h2>
//           <p className="text-xs text-muted-foreground mb-6">Create a new administrator account</p>

//           <form onSubmit={handleSubmit} className="space-y-4">
            
//             <div className="flex gap-3">
//               <div className="flex-1">
//                 <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">First Name *</label>
//                 <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={getInputClass("firstName")} disabled={registerMutation.isPending} />
//                 {errors.firstName && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.firstName}</p>}
//               </div>
//               <div className="flex-1">
//                 <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Last Name *</label>
//                 <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={getInputClass("lastName")} disabled={registerMutation.isPending} />
//                 {errors.lastName && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.lastName}</p>}
//               </div>
//             </div>

//             <div>
//               <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Email *</label>
//               <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@smartjal.in" className={getInputClass("email")} disabled={registerMutation.isPending} />
//               {errors.email && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.email}</p>}
//             </div>

//             <div>
//               <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Phone (Optional)</label>
//               <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className={getInputClass("phone")} disabled={registerMutation.isPending} />
//               {errors.phone && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.phone}</p>}
//             </div>

//             <div className="flex gap-3 flex-col sm:flex-row">
//               <div className="flex-1">
//                 <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Password *</label>
//                 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={getInputClass("password")} disabled={registerMutation.isPending} />
//                 {errors.password && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.password}</p>}
//               </div>
//               <div className="flex-1">
//                 <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Confirm Password *</label>
//                 <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={getInputClass("confirmPassword")} disabled={registerMutation.isPending} />
//                 {errors.confirmPassword && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.confirmPassword}</p>}
//               </div>
//             </div>

//             {serverError && (
//               <div className="bg-coral-subtle text-coral-brand text-xs font-semibold rounded-lg p-3">
//                 {serverError}
//               </div>
//             )}

//             <button 
//               type="submit" 
//               disabled={registerMutation.isPending}
//               className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity mt-2 flex justify-center items-center gap-2 disabled:opacity-70"
//             >
//               {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
//               {registerMutation.isPending ? "Creating Account..." : "Create Account"}
//             </button>
//           </form>

//           <div className="mt-6 pt-5 border-t border-border text-center">
//             <p className="text-xs text-muted-foreground">
//               Already have an account?{" "}
//               <Link to="/login" className="text-primary font-bold hover:underline transition-all">
//                 Sign In
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;





// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { Droplet, Loader2, Lock, ArrowLeft } from "lucide-react";
// import { toast } from "sonner";
// import { useRegisterAdmin } from "@/Tanstack/allTanstack";
// import { z } from "zod";

// // ==========================================
// // ZOD SCHEMA FOR REGISTRATION
// // ==========================================
// const registerSchema = z.object({
//   firstName: z.string().min(1, "First name is required").max(100, "Max 100 characters"),
//   lastName: z.string().min(1, "Last name is required").max(100, "Max 100 characters"),
//   email: z.string().min(1, "Email is required").email("Please enter a valid email address").max(150),
//   phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
//   password: z.string().min(8, "Password must be at least 8 characters"),
//   confirmPassword: z.string()
// }).refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords do not match",
//   path: ["confirmPassword"], 
// });

// const Register = () => {
//   // Step Management
//   const [step, setStep] = useState<1 | 2>(1);

//   // Form State
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [otp, setOtp] = useState("");
  
//   // UI State
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [serverError, setServerError] = useState("");
//   const [isDummyLoading, setIsDummyLoading] = useState(false); // Used for dummy APIs
  
//   const navigate = useNavigate();
  
//   // Keeping this here for when you combine the final step, 
//   // but we won't use it immediately in the dummy flow to prevent database errors.
//   const registerMutation = useRegisterAdmin(); 

//   // ==========================================
//   // STEP 1: REQUEST APPROVAL (DUMMY API)
//   // ==========================================
//   const handleRequestOtp = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrors({});
//     setServerError("");

//     // 1. Validate Form
//     const result = registerSchema.safeParse({ firstName, lastName, email, phone, password, confirmPassword });
//     if (!result.success) {
//       const fieldErrors: Record<string, string> = {};
//       result.error.issues.forEach((issue) => {
//         if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
//       });
//       setErrors(fieldErrors);
//       return; 
//     }

//     // 2. Trigger Dummy API Call
//     setIsDummyLoading(true);
//     try {
//       // ⚠️ DUMMY API DELAY: Replace this with your actual Axios/TanStack call later
//       // e.g., await axios.post('/admin_request_otp', { email, first_name: firstName, ... })
//       await new Promise(resolve => setTimeout(resolve, 1500)); 

//       toast.success("Request sent! The Main Admin has received an OTP for your approval.");
//       setStep(2); // Move to OTP screen
//     } catch (err) {
//       setServerError("Failed to request OTP. Please try again.");
//     } finally {
//       setIsDummyLoading(false);
//     }
//   };

//   // ==========================================
//   // STEP 2: VERIFY OTP & REGISTER (DUMMY API)
//   // ==========================================
//   const handleVerifyOtp = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrors({});
//     setServerError("");

//     if (otp.length < 4) {
//       setErrors({ otp: "Please enter a valid OTP" });
//       return;
//     }

//     setIsDummyLoading(true);
//     try {
//       // ⚠️ DUMMY API DELAY: Replace this entirely with your final Backend Registration Route
//       // e.g., await axios.post('/admin_verify_and_register', { email, otp, password, ... })
//       await new Promise(resolve => setTimeout(resolve, 2000));

//       toast.success("OTP Verified! Admin account created successfully.");
      
//       // Clear fields
//       setFirstName(""); setLastName(""); setEmail(""); setPhone("");
//       setPassword(""); setConfirmPassword(""); setOtp("");
      
//       navigate("/login");
//     } catch (err) {
//       setServerError("Invalid OTP or Registration Failed.");
//     } finally {
//       setIsDummyLoading(false);
//     }
//   };

//   const getInputClass = (fieldName: string) => `w-full bg-background/40 border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/10 ${
//     errors[fieldName] ? "border-coral-brand focus:border-coral-brand" : "border-border focus:border-primary"
//   }`;

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
//       {/* Background Decor */}
//       <div className="fixed top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(195 100% 50% / 0.06), transparent 70%)" }} />
//       <div className="fixed bottom-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(187 80% 58% / 0.04), transparent 70%)" }} />

//       <div className="w-full max-w-md relative z-10 animate-slide-up py-8">
//         {/* Header */}
//         <div className="flex items-center justify-center gap-3 mb-8">
//           <div className="w-10 h-10 rounded-lg gradient-primary shadow-glow flex items-center justify-center">
//             <Droplet className="w-5 h-5 text-primary-foreground" />
//           </div>
//           <div>
//             <h1 className="text-lg font-extrabold tracking-wide text-primary">SmartJal</h1>
//             <p className="text-[10px] text-muted-foreground font-mono">Water Payment System</p>
//           </div>
//         </div>

//         <div className="bg-card border border-border rounded-2xl p-7 shadow-card relative overflow-hidden">
          
//           {/* ==========================================
//               STEP 1 UI: DETAILS FORM
//               ========================================== */}
//           <div className={`transition-all duration-300 ${step === 1 ? "opacity-100 translate-x-0 relative" : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"}`}>
//             <h2 className="text-base font-extrabold mb-1">Admin Registration</h2>
//             <p className="text-xs text-muted-foreground mb-6">Enter your details to request access</p>

//             <form onSubmit={handleRequestOtp} className="space-y-4">
//               <div className="flex gap-3">
//                 <div className="flex-1">
//                   <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">First Name *</label>
//                   <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={getInputClass("firstName")} disabled={isDummyLoading} />
//                   {errors.firstName && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.firstName}</p>}
//                 </div>
//                 <div className="flex-1">
//                   <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Last Name *</label>
//                   <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={getInputClass("lastName")} disabled={isDummyLoading} />
//                   {errors.lastName && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.lastName}</p>}
//                 </div>
//               </div>

//               <div>
//                 <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Email *</label>
//                 <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@smartjal.in" className={getInputClass("email")} disabled={isDummyLoading} />
//                 {errors.email && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.email}</p>}
//               </div>

//               <div>
//                 <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Phone (Optional)</label>
//                 <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className={getInputClass("phone")} disabled={isDummyLoading} />
//                 {errors.phone && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.phone}</p>}
//               </div>

//               <div className="flex gap-3 flex-col sm:flex-row">
//                 <div className="flex-1">
//                   <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Password *</label>
//                   <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={getInputClass("password")} disabled={isDummyLoading} />
//                   {errors.password && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.password}</p>}
//                 </div>
//                 <div className="flex-1">
//                   <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Confirm Password *</label>
//                   <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={getInputClass("confirmPassword")} disabled={isDummyLoading} />
//                   {errors.confirmPassword && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.confirmPassword}</p>}
//                 </div>
//               </div>

//               {serverError && <div className="bg-coral-subtle text-coral-brand text-xs font-semibold rounded-lg p-3">{serverError}</div>}

//               <button type="submit" disabled={isDummyLoading} className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity mt-2 flex justify-center items-center gap-2 disabled:opacity-70">
//                 {isDummyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
//                 {isDummyLoading ? "Requesting..." : "Request Account Approval"}
//               </button>
//             </form>
            
//             <div className="mt-6 pt-5 border-t border-border text-center">
//               <p className="text-xs text-muted-foreground">
//                 Already have an account?{" "}
//                 <Link to="/login" className="text-primary font-bold hover:underline transition-all">Sign In</Link>
//               </p>
//             </div>
//           </div>

//           {/* ==========================================
//               STEP 2 UI: OTP VERIFICATION
//               ========================================== */}
//           <div className={`transition-all duration-300 ${step === 2 ? "opacity-100 translate-x-0 relative" : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"}`}>
//             <button onClick={() => setStep(1)} disabled={isDummyLoading} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold mb-4 transition-colors">
//               <ArrowLeft className="w-3 h-3" /> Back to details
//             </button>
            
//             <div className="w-12 h-12 rounded-full bg-emerald-subtle flex items-center justify-center mb-4 border border-emerald/20">
//               <Lock className="w-5 h-5 text-emerald-brand" />
//             </div>
            
//             <h2 className="text-base font-extrabold mb-1">Verify Approval</h2>
//             <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
//               We've notified the Main Administrator. Please enter the OTP they provide you to finalize your account creation.
//             </p>

//             <form onSubmit={handleVerifyOtp} className="space-y-4">
//               <div>
//                 <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Admin OTP *</label>
//                 <input 
//                   type="text" 
//                   value={otp} 
//                   onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Only allow numbers
//                   placeholder="Enter OTP code" 
//                   maxLength={6}
//                   className={getInputClass("otp")} 
//                   disabled={isDummyLoading} 
//                 />
//                 {errors.otp && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.otp}</p>}
//               </div>

//               {serverError && <div className="bg-coral-subtle text-coral-brand text-xs font-semibold rounded-lg p-3">{serverError}</div>}

//             <button type="submit" disabled={isDummyLoading || otp.length < 4} className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity mt-2 flex justify-center items-center gap-2 disabled:opacity-70">
//   {isDummyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
//   {isDummyLoading ? "Verifying..." : "Verify & Create Account"}
// </button>
//             </form>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;





import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Droplet, Loader2, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRequestAdminOtp, useVerifyAdminOtp } from "@/Tanstack/allTanstack";
import { z } from "zod";

// ==========================================
// ZOD SCHEMA FOR REGISTRATION
// ==========================================
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address").max(150),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], 
});

const Register = () => {
  const [step, setStep] = useState<1 | 2>(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  
  const navigate = useNavigate();
  
  // REAL TANSTACK MUTATIONS
  const requestOtpMutation = useRequestAdminOtp();
  const verifyOtpMutation = useVerifyAdminOtp();

  // ==========================================
  // STEP 1: REQUEST APPROVAL (REAL API)
  // ==========================================
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const result = registerSchema.safeParse({ firstName, lastName, email, phone, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return; 
    }

    const payload = {
      first_name: result.data.firstName,
      last_name: result.data.lastName,
      email: result.data.email,
      phone: result.data.phone || "", 
      password: result.data.password,
      role: "admin"
    };

    requestOtpMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Request sent! The Main Admin has received an OTP for your approval.");
        setStep(2); // Move to OTP screen
      },
      onError: (err: any) => {
        const backendMessage = err?.response?.data?.message || "Failed to request OTP.";
        setServerError(backendMessage);
      }
    });
  };

  // ==========================================
  // STEP 2: VERIFY OTP & REGISTER (REAL API)
  // ==========================================
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    if (otp.length < 4) {
      setErrors({ otp: "Please enter a valid OTP" });
      return;
    }

    verifyOtpMutation.mutate({ email: email, OTP: otp }, {
      onSuccess: (res: any) => {
        // Backend returns "status": "success" if verified
        if (res.status === "success" || res.message === "Verified") {
          toast.success("OTP Verified! Admin account created successfully.");
          navigate("/login");
        } else {
          setServerError(res.message || "Invalid OTP.");
        }
      },
      onError: (err: any) => {
        const backendMessage = err?.response?.data?.message || "Invalid OTP or Registration Failed.";
        setServerError(backendMessage);
      }
    });
  };

  const getInputClass = (fieldName: string) => `w-full bg-background/40 border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/10 ${
    errors[fieldName] ? "border-coral-brand focus:border-coral-brand" : "border-border focus:border-primary"
  }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="fixed top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(195 100% 50% / 0.06), transparent 70%)" }} />
      <div className="fixed bottom-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(187 80% 58% / 0.04), transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up py-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg gradient-primary shadow-glow flex items-center justify-center">
            <Droplet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wide text-primary">Rive Smart Meter</h1>
            <p className="text-[10px] text-muted-foreground font-mono">Water Payment System</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-7 shadow-card relative overflow-hidden">
          
          {/* STEP 1 UI */}
          <div className={`transition-all duration-300 ${step === 1 ? "opacity-100 translate-x-0 relative" : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"}`}>
            <h2 className="text-base font-extrabold mb-1">Admin Registration</h2>
            <p className="text-xs text-muted-foreground mb-6">Enter your details to request access</p>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">First Name *</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={getInputClass("firstName")} disabled={requestOtpMutation.isPending} />
                  {errors.firstName && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.firstName}</p>}
                </div>
                <div className="flex-1">
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Last Name *</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={getInputClass("lastName")} disabled={requestOtpMutation.isPending} />
                  {errors.lastName && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@smartjal.in" className={getInputClass("email")} disabled={requestOtpMutation.isPending} />
                {errors.email && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.email}</p>}
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Phone (Optional)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className={getInputClass("phone")} disabled={requestOtpMutation.isPending} />
                {errors.phone && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.phone}</p>}
              </div>

              <div className="flex gap-3 flex-col sm:flex-row">
                <div className="flex-1">
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Password *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={getInputClass("password")} disabled={requestOtpMutation.isPending} />
                  {errors.password && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.password}</p>}
                </div>
                <div className="flex-1">
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Confirm Password *</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={getInputClass("confirmPassword")} disabled={requestOtpMutation.isPending} />
                  {errors.confirmPassword && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.confirmPassword}</p>}
                </div>
              </div>

              {serverError && <div className="bg-coral-subtle text-coral-brand text-xs font-semibold rounded-lg p-3">{serverError}</div>}

              <button type="submit" disabled={requestOtpMutation.isPending} className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity mt-2 flex justify-center items-center gap-2 disabled:opacity-70">
                {requestOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {requestOtpMutation.isPending ? "Requesting..." : "Request Account Approval"}
              </button>
            </form>
            
            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-bold hover:underline transition-all">Sign In</Link>
              </p>
            </div>
          </div>

          {/* STEP 2 UI */}
          <div className={`transition-all duration-300 ${step === 2 ? "opacity-100 translate-x-0 relative" : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"}`}>
            <button onClick={() => setStep(1)} disabled={verifyOtpMutation.isPending} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold mb-4 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to details
            </button>
            
            <div className="w-12 h-12 rounded-full bg-emerald-subtle flex items-center justify-center mb-4 border border-emerald/20">
              <Lock className="w-5 h-5 text-emerald-brand" />
            </div>
            
            <h2 className="text-base font-extrabold mb-1">Verify Approval</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              We've notified the Main Administrator. Please enter the OTP they provide you to finalize your account creation.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5">Admin OTP *</label>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} 
                  placeholder="Enter OTP code" 
                  maxLength={6}
                  className={getInputClass("otp")} 
                  disabled={verifyOtpMutation.isPending} 
                />
                {errors.otp && <p className="text-[10px] text-coral-brand mt-1 font-semibold">{errors.otp}</p>}
              </div>

              {serverError && <div className="bg-coral-subtle text-coral-brand text-xs font-semibold rounded-lg p-3">{serverError}</div>}

              <button type="submit" disabled={verifyOtpMutation.isPending || otp.length < 4} className="w-full gradient-primary text-primary-foreground font-bold text-sm rounded-lg py-3 shadow-glow hover:opacity-90 transition-opacity mt-2 flex justify-center items-center gap-2 disabled:opacity-70">
                {verifyOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Create Account"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;