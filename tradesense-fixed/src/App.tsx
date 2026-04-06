import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import PerformanceAnalytics from "./pages/PerformanceAnalytics";
import RiskAnalytics from "./pages/RiskAnalytics";
import BehavioralPatterns from "./pages/BehavioralPatterns";
import Journal from "./pages/Journal";
import Progress from "./pages/Progress";
import Import from "./pages/Import";
import SettingsPage from "./pages/SettingsPage";
import SessionAnalysis from "./pages/SessionAnalysis";
import Connect from "./pages/Connect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics/performance" element={<PerformanceAnalytics />} />
                <Route path="/analytics/risk" element={<RiskAnalytics />} />
                <Route path="/analytics/behavior" element={<BehavioralPatterns />} />
                <Route path="/sessions" element={<SessionAnalysis />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/connect" element={<Connect />} />
                <Route path="/import" element={<Import />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
