import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, CreditCard, Smartphone, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { inr } from "@/data/products";
import { api } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const DARK = "#1a1612";
const GOLD = "#d4a853";
const CREAM = "#f5ede0";

type Step = "shipping" | "payment" | "success";

const steps: { label: string; id: Step | "confirm" }[] = [
  { label: "Shipping", id: "shipping" },
  { label: "Payment", id: "payment" },
  { label: "Confirm",  id: "confirm" },
];

function StepBar({ current }: { current: Step }) {
  const idx = current === "success" ? 2 : current === "payment" ? 1 : 0;
  return (
    <div className="flex items-center justify-center gap-0 mb-8 md:mb-10">
      {steps.map((step, i) => {
        const done   = i < idx;
        const active = i === idx && current !== "success";
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                  done   ? "border-2 border-primary bg-primary text-primary-foreground"
                  : active ? "border-2 border-foreground bg-foreground text-background"
                           : "border-2 border-border bg-transparent text-muted-foreground"
                }`}
              >
                {done ? <Check size={13} strokeWidth={2.5} /> : i + 1}
              </div>
              <span className={`mt-1.5 text-[9px] md:text-[10px] uppercase tracking-widest ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 md:w-20 h-px mx-2 mb-5 transition-all duration-300 ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { cart, cartTotal, giftTotal, clearCart, removeFromCart, user, userLoading, shippingFee: ctxShippingFee, freeShippingMin, freeShippingEnabled, offerDiscount, offerEnabled, offerLabel } = useApp();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("shipping");

  // Redirect unauthenticated users to login, then back here after
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/login?redirect=/checkout");
    }
  }, [user, userLoading]);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [razorpayConfigured, setRazorpayConfigured] = useState<boolean | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const [calcShippingFee, setCalcShippingFee] = useState<number | null>(null);
  const [shippingDistance, setShippingDistance] = useState<number | null>(null);
  const [shippingCalcLoading, setShippingCalcLoading] = useState(false);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoError("");
    setPromoLoading(true);
    try {
      const result = await api.promo.validate(promoCode.trim());
      setPromoDiscount(result.discountPercent);
      setPromoApplied(result.code);
      setPromoError("");
    } catch (err: any) {
      setPromoError(err.message || "Invalid promo code");
      setPromoDiscount(0);
      setPromoApplied("");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoCode("");
    setPromoDiscount(0);
    setPromoApplied("");
    setPromoError("");
  };

  const [shippingData, setShippingData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName:  user?.name?.split(" ").slice(1).join(" ") || "",
    email:     user?.email || "",
    phone:     "",
    address:   "",
    city:      "",
    state:     "",
    zip:       "",
    country:   "India",
  });

  // ─── Phone validation ───
  const [phoneError, setPhoneError] = useState("");
  const validatePhone = (val: string) => {
    if (!val) { setPhoneError(""); return true; }
    if (!/^[6-9]\d{9}$/.test(val.replace(/\s/g, ""))) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // ─── Pincode auto-fetch ───
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const pinFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setShippingData(s => ({ ...s, zip: cleaned }));
    setPincodeError("");
    setCalcShippingFee(null);
    setShippingDistance(null);
    if (pinFetchRef.current) clearTimeout(pinFetchRef.current);
    if (cleaned.length === 6) {
      setPincodeLoading(true);
      setShippingCalcLoading(true);
      pinFetchRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
          const data = await res.json();
          if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            setShippingData(s => ({ ...s, city: po.District, state: po.State }));
          } else {
            setPincodeError("Pincode not found — please enter city and state manually");
          }
        } catch {
          setPincodeError("Could not fetch pincode details");
        } finally {
          setPincodeLoading(false);
        }
        try {
          const result = await api.shipping.calculate(cleaned);
          setCalcShippingFee(result.charge);
          setShippingDistance(result.distance);
        } catch {
          setCalcShippingFee(null);
        } finally {
          setShippingCalcLoading(false);
        }
      }, 400);
    }
  };

  const discountedSubtotal = cartTotal - offerDiscount;
  const promoAmount = promoApplied ? Math.round(discountedSubtotal * promoDiscount / 100) : 0;
  const afterPromo = discountedSubtotal - promoAmount;
  const shippingFee = calcShippingFee !== null ? calcShippingFee : 0;
  const shippingResolved = calcShippingFee !== null;
  const total       = afterPromo + giftTotal + shippingFee;

  useEffect(() => {
    api.payments.config().then(c => setRazorpayConfigured(c.configured)).catch(() => setRazorpayConfigured(false));
  }, []);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(shippingData.phone)) return;
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrderMock = async () => {
    setPaymentLoading(true);
    setPaymentError("");
    try {
      const fullAddress = `${shippingData.address}, ${shippingData.city}, ${shippingData.state} ${shippingData.zip}, ${shippingData.country}`;
      const order = await api.orders.create({
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isGift: item.isGift,
          giftMessage: item.giftMessage,
        })),
        shippingData: { ...shippingData },
        total,
        paymentId: "MOCK_" + Date.now(),
      });
      if (promoApplied) api.promo.use(promoApplied).catch(() => {});
      setOrderId(order.id);
      clearCart();
      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setPaymentError(err.message || "Failed to place order. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const placeOrderRazorpay = async () => {
    setPaymentLoading(true);
    setPaymentError("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Could not load payment gateway. Please try again.");

      const amountInPaise = Math.round(total * 100);
      const rzpOrder = await api.payments.createOrder(amountInPaise);

      if (rzpOrder.mock) {
        await placeOrderMock();
        return;
      }

      const config = await api.payments.config();

      const options = {
        key: config.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        name: "Ethura Jewelry",
        description: "Order Payment",
        order_id: rzpOrder.id,
        prefill: {
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          email: shippingData.email,
          contact: shippingData.phone,
        },
        theme: { color: GOLD },
        handler: async (response: any) => {
          try {
            const verified = await api.payments.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verified.verified) throw new Error("Payment verification failed.");

            const fullAddress = `${shippingData.address}, ${shippingData.city}, ${shippingData.state} ${shippingData.zip}, ${shippingData.country}`;
            const order = await api.orders.create({
              items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                isGift: item.isGift,
                giftMessage: item.giftMessage,
              })),
              shippingData: { ...shippingData },
              total,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            });
            if (promoApplied) api.promo.use(promoApplied).catch(() => {});
            setOrderId(order.id);
            clearCart();
            setStep("success");
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch (err: any) {
            setPaymentError(err.message || "Payment failed. Please contact support.");
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => { setPaymentLoading(false); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setPaymentError(err.message || "Payment failed. Please try again.");
      setPaymentLoading(false);
    }
  };

  if (cart.length === 0 && step !== "success") {
    return (
      <div className="bg-background min-h-screen text-foreground">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen flex-col gap-6 text-center px-4">
          <h2 className="font-serif text-2xl">Your cart is empty</h2>
          <Link href="/shop">
            <Button className="rounded-none bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-10 py-6 text-xs uppercase tracking-widest">
              Shop the Collection
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="bg-background min-h-screen text-foreground">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-28 md:pt-32 pb-24 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 flex items-center justify-center mx-auto mb-8" style={{ borderColor: GOLD }}>
              <Check size={32} strokeWidth={1.5} style={{ color: GOLD }} />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">Thank You!</h2>
            <p className="text-muted-foreground font-light mb-2 leading-relaxed">
              Your order has been confirmed and is being lovingly prepared.
            </p>
            {orderId && (
              <p className="text-muted-foreground text-xs font-light mb-2">Order ID: <span className="font-mono text-foreground">{orderId}</span></p>
            )}
            <p className="text-muted-foreground text-sm font-light mb-2">
              A confirmation has been sent to <strong>{shippingData.email}</strong>
            </p>
            <p className="text-muted-foreground text-sm font-light mb-12">We'll keep you updated on your order status.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop">
                <Button
                  className="rounded-none bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-8 py-5 text-xs uppercase tracking-widest w-full sm:w-auto"
                  data-testid="order-success-shop"
                >
                  Continue Shopping
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="rounded-none border-border hover:border-foreground px-8 py-5 text-xs uppercase tracking-widest w-full sm:w-auto"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-24 md:pt-28 pb-16">
        <div className="text-center mb-2">
          <h1 className="text-2xl md:text-3xl font-serif mb-6">Checkout</h1>
          <StepBar current={step} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 shadow-xl overflow-hidden rounded-sm">
          {/* RIGHT — Form panel */}
          <div className="lg:col-span-3 bg-white p-6 md:p-10 lg:p-12 order-2 lg:order-2">
            <AnimatePresence mode="wait">
              {step === "shipping" && (
                <motion.form
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleShippingSubmit}
                  className="space-y-4"
                  data-testid="shipping-form"
                >
                  <div className="mb-6">
                    <h2 className="font-serif text-xl md:text-2xl mb-1">Shipping Details</h2>
                    <p className="text-muted-foreground text-sm font-light">Where should we send your order?</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">First Name *</label>
                      <Input required value={shippingData.firstName} onChange={e => setShippingData(s => ({ ...s, firstName: e.target.value }))} className="rounded-sm border-gray-200 h-11 focus-visible:ring-primary" data-testid="input-first-name" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Last Name *</label>
                      <Input required value={shippingData.lastName} onChange={e => setShippingData(s => ({ ...s, lastName: e.target.value }))} className="rounded-sm border-gray-200 h-11 focus-visible:ring-primary" data-testid="input-last-name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Email *</label>
                      <Input required type="email" value={shippingData.email} onChange={e => setShippingData(s => ({ ...s, email: e.target.value }))} className="rounded-sm border-gray-200 h-11 focus-visible:ring-primary" data-testid="input-email" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Phone *</label>
                      <Input
                        required
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={shippingData.phone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setShippingData(s => ({ ...s, phone: val }));
                          if (phoneError) validatePhone(val);
                        }}
                        onBlur={() => validatePhone(shippingData.phone)}
                        className={`rounded-sm h-11 focus-visible:ring-primary ${phoneError ? "border-red-400 focus-visible:ring-red-300" : "border-gray-200"}`}
                        data-testid="input-phone"
                      />
                      {phoneError && <p className="text-[11px] text-red-500 mt-1">{phoneError}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Street Address *</label>
                    <Input required value={shippingData.address} onChange={e => setShippingData(s => ({ ...s, address: e.target.value }))} className="rounded-sm border-gray-200 h-11 focus-visible:ring-primary" placeholder="House no., street, area" data-testid="input-address" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="col-span-2 sm:col-span-3">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">PIN Code *</label>
                      <div className="relative">
                        <Input
                          required
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="6-digit PIN code"
                          value={shippingData.zip}
                          onChange={e => handlePincodeChange(e.target.value)}
                          className={`rounded-sm h-11 focus-visible:ring-primary pr-10 ${pincodeError ? "border-red-400" : "border-gray-200"}`}
                          data-testid="input-zip"
                        />
                        {pincodeLoading && (
                          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#d4a853]" />
                        )}
                      </div>
                      {pincodeError && <p className="text-[11px] text-amber-600 mt-1">{pincodeError}</p>}
                      {!pincodeError && shippingData.zip.length === 6 && !pincodeLoading && shippingData.city && (
                        <p className="text-[11px] text-green-600 mt-1">✓ {shippingData.city}, {shippingData.state}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">City *</label>
                      <Input required value={shippingData.city} onChange={e => setShippingData(s => ({ ...s, city: e.target.value }))} className="rounded-sm border-gray-200 h-11 focus-visible:ring-primary" data-testid="input-city" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">State</label>
                      <Input value={shippingData.state} onChange={e => setShippingData(s => ({ ...s, state: e.target.value }))} className="rounded-sm border-gray-200 h-11 focus-visible:ring-primary" data-testid="input-state" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Country</label>
                    <Input value={shippingData.country} onChange={e => setShippingData(s => ({ ...s, country: e.target.value }))} className="rounded-sm border-gray-200 h-11 focus-visible:ring-primary" data-testid="input-country" />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-sm py-6 text-xs uppercase tracking-widest mt-4 font-medium"
                    style={{ background: DARK, color: CREAM }}
                    data-testid="continue-to-payment"
                  >
                    Continue to Payment →
                  </Button>
                </motion.form>
              )}

              {step === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                  data-testid="payment-form"
                >
                  <div className="mb-6">
                    <h2 className="font-serif text-xl md:text-2xl mb-1">Payment</h2>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock size={11} />
                      <span>Secure, encrypted payment</span>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-sm">
                      {paymentError}
                    </div>
                  )}

                  {razorpayConfigured ? (
                    <div className="space-y-4">
                      <div className="border border-gray-100 rounded-sm p-5 bg-gray-50">
                        <div className="flex items-center gap-3 mb-3">
                          <Smartphone size={18} className="text-[#0066cc]" />
                          <span className="text-sm font-medium">Razorpay — All Payment Methods</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Pay securely with UPI, cards, net banking, or wallets via Razorpay. You will be redirected to the Razorpay payment gateway.
                        </p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-muted-foreground">UPI</span>
                          <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-muted-foreground">Cards</span>
                          <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-muted-foreground">Net Banking</span>
                          <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-muted-foreground">Wallets</span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => { setStep("shipping"); setPaymentError(""); }}
                          className="flex-1 border border-gray-200 py-3 md:py-4 text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-sm text-muted-foreground"
                          data-testid="back-to-shipping"
                        >
                          ← Back
                        </button>
                        <Button
                          type="button"
                          disabled={paymentLoading}
                          onClick={placeOrderRazorpay}
                          className="flex-1 rounded-sm py-3 md:py-4 text-xs uppercase tracking-widest font-medium"
                          style={{ background: GOLD, color: DARK }}
                          data-testid="place-order-btn"
                        >
                          {paymentLoading ? "Processing..." : `Pay ${inr(total)}`}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border border-amber-200 bg-amber-50 rounded-sm p-4 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard size={16} className="text-amber-700" />
                          <span className="font-medium text-amber-800">Demo Mode</span>
                        </div>
                        <p className="text-amber-700 text-xs leading-relaxed">
                          Razorpay is not configured. This is a demo checkout — your order will be created but no real payment will be processed.
                        </p>
                      </div>

                      <div className="border border-gray-100 rounded-sm p-4 bg-gray-50 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Shipping to:</p>
                        <p>{shippingData.firstName} {shippingData.lastName}</p>
                        <p>{shippingData.address}, {shippingData.city}</p>
                        <p className="text-xs mt-1">{shippingData.email}</p>
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => { setStep("shipping"); setPaymentError(""); }}
                          className="flex-1 border border-gray-200 py-3 md:py-4 text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-sm text-muted-foreground"
                          data-testid="back-to-shipping"
                        >
                          ← Back
                        </button>
                        <Button
                          type="button"
                          disabled={paymentLoading}
                          onClick={placeOrderMock}
                          className="flex-1 rounded-sm py-3 md:py-4 text-xs uppercase tracking-widest font-medium"
                          style={{ background: GOLD, color: DARK }}
                          data-testid="place-order-btn"
                        >
                          {paymentLoading ? "Placing order..." : `Confirm Order · ${inr(total)}`}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LEFT — Order Summary Sidebar */}
          <div className="lg:col-span-2 p-6 md:p-8 lg:p-10 flex flex-col order-1 lg:order-1" style={{ background: "#1a1612" }}>
            <div className="mb-6 md:mb-8">
              <h2 className="font-serif text-xl md:text-2xl mb-1 tracking-wider" style={{ color: GOLD }}>ETHURA</h2>
              <p className="text-xs uppercase tracking-widest" style={{ color: "#c4b59e" }}>Your Order · {cart.reduce((a, i) => a + i.quantity, 0)} item{cart.reduce((a, i) => a + i.quantity, 0) !== 1 ? "s" : ""}</p>
            </div>

            <div className="space-y-5 mb-8 flex-1 overflow-y-auto max-h-72 pr-1 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 items-center rounded-lg px-3 py-3 transition-colors" style={{ background: "#3d3228", border: "1px solid #d4a85325" }} data-testid={`checkout-item-${item.id}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 md:w-[72px] md:h-[72px] overflow-hidden rounded-lg border" style={{ background: "#2a2218", borderColor: "#3a322a" }}>
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm" style={{ background: GOLD, color: DARK }}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>{item.name}</p>
                    <p className="text-xs capitalize mt-0.5" style={{ color: "#c4b59e" }}>{item.category}</p>
                    {item.isGift && <p className="text-[10px] mt-0.5" style={{ color: GOLD }}>Gift +₹99</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold" style={{ color: CREAM }}>{inr(item.price * item.quantity)}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "#ff4d4f18", border: "1px solid #ff4d4f30" }}
                      title="Remove item"
                    >
                      <Trash2 size={13} style={{ color: "#ff7875" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {step === "shipping" && (
              <div className="border-t pt-5 mb-2" style={{ borderColor: "#3a322a" }}>
                {!promoApplied ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: GOLD }}>Promo Code</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                        placeholder="Enter code"
                        className="flex-1 min-w-0 px-4 py-3 text-sm rounded-lg focus:outline-none font-medium tracking-wider"
                        style={{ background: "#2e2519", border: `1px solid ${GOLD}35`, color: "#fff" }}
                      />
                      <button
                        onClick={applyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-lg transition-all disabled:opacity-30 hover:shadow-lg shrink-0"
                        style={{ background: GOLD, color: DARK }}
                      >
                        {promoLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {promoError && <p className="text-red-400 text-xs mt-2">{promoError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "#2e2519", border: `1px solid ${GOLD}40` }}>
                    <div className="flex items-center gap-2">
                      <Check size={14} style={{ color: "#4ade80" }} />
                      <span className="text-sm font-bold tracking-wider" style={{ color: "#fff" }}>{promoApplied}</span>
                      <span className="text-xs font-semibold" style={{ color: GOLD }}>– {promoDiscount}% off</span>
                    </div>
                    <button onClick={removePromo} className="text-xs font-semibold transition-colors" style={{ color: "#ff7875" }}>Remove</button>
                  </div>
                )}
              </div>
            )}

            {step === "payment" && promoApplied && (
              <div className="border-t pt-4 mb-1" style={{ borderColor: "#3a322a" }}>
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: "#2e2519", border: `1px solid ${GOLD}30` }}>
                  <Check size={14} style={{ color: "#4ade80" }} />
                  <span className="text-xs font-bold" style={{ color: "#fff" }}>{promoApplied}</span>
                  <span className="text-[10px] font-semibold" style={{ color: GOLD }}>({promoDiscount}% off applied)</span>
                </div>
              </div>
            )}

            <div className="border-t pt-5 space-y-3 text-sm" style={{ borderColor: "#3a322a" }}>
              <div className="flex justify-between" style={{ color: "#c4b59e" }}>
                <span>Subtotal</span>
                <span style={{ color: offerDiscount > 0 ? "#8a7a68" : "#fff", textDecoration: offerDiscount > 0 ? "line-through" : "none" }}>{inr(cartTotal)}</span>
              </div>
              {offerEnabled && offerDiscount > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: GOLD, fontSize: "11px" }}>🏷 {offerLabel}</span>
                  <span style={{ color: GOLD, fontWeight: 600 }}>-{inr(offerDiscount)}</span>
                </div>
              )}
              {promoApplied && promoAmount > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: GOLD, fontSize: "11px" }}>🎟 Promo: {promoApplied} ({promoDiscount}%)</span>
                  <span style={{ color: GOLD, fontWeight: 600 }}>-{inr(promoAmount)}</span>
                </div>
              )}
              {giftTotal > 0 && (
                <div className="flex justify-between" style={{ color: "#c4b59e" }}>
                  <span>Gift Wrapping</span>
                  <span style={{ color: "#fff" }}>{inr(giftTotal)}</span>
                </div>
              )}
              <div className="flex justify-between" style={{ color: "#c4b59e" }}>
                <span>Shipping</span>
                <span style={{ color: shippingResolved ? (shippingFee === 0 ? GOLD : "#fff") : "#8a7a68" }}>
                  {shippingCalcLoading ? "Calculating..." : !shippingResolved ? "Enter pincode" : shippingFee === 0 ? "Free" : inr(shippingFee)}
                </span>
              </div>
              {shippingResolved && shippingDistance !== null && shippingDistance > 0 && (
                <p className="text-[10px]" style={{ color: "#8a7a68" }}>Distance: ~{shippingDistance} km from store</p>
              )}
              <div className="flex justify-between font-semibold text-base pt-3 border-t" style={{ borderColor: "#3a322a", color: "#fff" }}>
                <span>Total</span>
                <span style={{ color: GOLD }}>{inr(total)}</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t flex items-center gap-2" style={{ borderColor: "#3a322a" }}>
              <ShieldCheck size={14} style={{ color: GOLD }} />
              <p className="text-xs font-medium" style={{ color: "#c4b59e" }}>256-bit SSL encrypted checkout</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
