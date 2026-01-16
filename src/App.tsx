import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Doctors from "./pages/Doctors";
import DoctorProfile from "./pages/DoctorProfile";
import Appointments from "./pages/Appointments";
import Reports from "./pages/Reports";
import Curax from "./pages/Curax";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/profile" element={<DoctorProfile />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/curax" element={<Curax />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
