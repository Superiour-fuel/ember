import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/styles/mobile.css";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "./hooks/useAuth";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "./pages/Landing";
import App from "./pages/App";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Timeline from "./pages/Timeline";
import Technology from "./pages/Technology";
import Mission from "./pages/Mission";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoot = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AccessibilityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <ErrorBoundary fallbackTitle="Something went wrong">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/app" element={<App />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/technology" element={<Technology />} />
                <Route path="/mission" element={<Mission />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AccessibilityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppRoot;
