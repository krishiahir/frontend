import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import AboutUs from "@/pages/AboutUs";
import Contact from "@/pages/Contact";
import Terms from "@/pages/Terms";
import Social from "@/pages/Social";
import Wishlist from "@/pages/Wishlist";
import ProductDetail from "@/pages/ProductDetail";
import AdminPanel from "@/pages/AdminPanel";
import Profile from "@/pages/Profile";
import Orders from "@/pages/Orders";
import ForgotPassword from "@/pages/ForgotPassword";
import DiscountPopup from "@/components/DiscountPopup";
import CookieConsent from "@/components/CookieConsent";
import CartDrawer from "@/components/CartDrawer";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function ConditionalPopup() {
  const [location] = useLocation();
  if (location.startsWith("/admin")) return null;
  return <DiscountPopup />;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/about" component={AboutUs} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms" component={Terms} />
      <Route path="/social" component={Social} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/profile" component={Profile} />
      <Route path="/orders" component={Orders} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
      <ConditionalPopup />
      <CookieConsent />
      <CartDrawer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
