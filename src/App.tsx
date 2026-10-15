import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { useAppSelector } from "@/lib/store/hooks";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Meters from "./pages/Meters";
import Transactions from "./pages/Transactions";
import Settlements from "./pages/Settlements";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import VendorMeters from "./pages/VendorMeters";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import SupportTickets from "./pages/SupportTickets";
import ProfilePage from './pages/ProfilePage';
import WaterSettingsPage from "./pages/WaterSettingsPage";
import VendorIssues from "./pages/VendorIssues";
import ManualSettlement from "./pages/ManualSettlement";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = !!user;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  const isAuthenticated = !!useAppSelector((s) => s.auth.user);
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path='/register' element={<Register/>}/>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/meters" element={<ProtectedRoute adminOnly><Meters /></ProtectedRoute>} />
      <Route path="/my-meters" element={<ProtectedRoute><VendorMeters /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/settlements" element={<ProtectedRoute><Settlements /></ProtectedRoute>} />
      <Route path="/support-tickets" element={<ProtectedRoute adminOnly><SupportTickets /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
      <Route path="/profile-page" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/watersettings" element={<ProtectedRoute><WaterSettingsPage /></ProtectedRoute>} />
      <Route path='/vendor-issues' element={<ProtectedRoute><VendorIssues/></ProtectedRoute>}/>
      <Route path="/Manual-Settlement" element={<ProtectedRoute><ManualSettlement /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
