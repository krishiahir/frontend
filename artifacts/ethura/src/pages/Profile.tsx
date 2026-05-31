import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Save, CheckCircle, AlertCircle, LogOut, ChevronRight, Package, Shield,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function lookupPincode(pin: string): Promise<{ city: string; state: string } | null> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      const p = data[0].PostOffice[0];
      return { city: p.Division || p.District || p.Name || "", state: p.State || "" };
    }
  } catch {}
  return null;
}

export default function Profile() {
  const { user, userLoading, updateProfile, logout } = useApp();
  const [, navigate] = useLocation();

  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [emailError, setEmailError] = useState("");
  const [phone, setPhone]     = useState("");
  const [street, setStreet]   = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity]       = useState("");
  const [state, setState]     = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!userLoading && !user) navigate("/login");
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setStreet(user.address ?? "");
    }
  }, [user, userLoading, navigate]);

  async function handlePincodeChange(pin: string) {
    setPincode(pin);
    setPincodeError("");
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      setPincodeLoading(true);
      const result = await lookupPincode(pin);
      setPincodeLoading(false);
      if (result) {
        setCity(result.city);
        setState(result.state);
      } else {
        setPincodeError("Invalid pincode — please check and try again.");
        setCity(""); setState("");
      }
    } else if (pin.length < 6) {
      setCity(""); setState("");
    }
  }

  function validateEmail(val: string): boolean {
    if (!val.trim()) { setEmailError("Email is required"); return false; }
    if (!EMAIL_RE.test(val.trim())) { setEmailError("Enter a valid email address (e.g. you@example.com)"); return false; }
    setEmailError(""); return true;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Full name is required."); return; }
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    const parts = [street.trim(), city.trim(), state.trim(), pincode.trim()].filter(Boolean);
    const fullAddress = parts.join(", ");
    setSaving(true); setError(""); setSuccess(false);
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim(), address: fullAddress });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() { logout(); navigate("/"); }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#d4a853] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const initials = user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#faf8f5] pt-[88px] sm:pt-[72px]">

        <div className="bg-gradient-to-b from-[#1a1612] to-[#2a231c] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16 sm:pb-20">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#d4a853] to-[#b8903f] flex items-center justify-center text-lg sm:text-2xl font-bold text-[#1a1612] border-4 border-white/10 shadow-xl flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-serif text-xl sm:text-3xl break-words">{user.name}</h1>
                  <p className="text-white/50 text-xs sm:text-sm break-all mt-0.5">{user.email}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            <div className="lg:col-span-1 space-y-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="hidden lg:block">
                <Link href="/orders" className="block bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-5 hover:shadow-md hover:border-[#d4a853]/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-[#d4a853]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1612]">My Orders</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Track & manage orders</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-[#d4a853] transition-colors flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="hidden lg:block">
                <div className="bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[#d4a853]" />
                    <p className="text-xs font-semibold text-[#1a1612] uppercase tracking-wider">Account</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Mail size={13} className="flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Phone size={13} className="flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-xl border border-transparent hover:border-red-200 transition-all mt-1">
                    <LogOut size={13} strokeWidth={1.5} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-5 border-b border-border bg-gradient-to-r from-[#faf8f5] to-white flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-[#d4a853]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg text-[#1a1612]">Personal Information</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Update your details for a seamless checkout</p>
                  </div>
                </div>

                <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-5">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-widest">Full Name *</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Your full name"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-[#faf8f5] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30 focus:border-[#d4a853] focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-widest">Email Address *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
                        <input
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); validateEmail(e.target.value); }}
                          placeholder="your@email.com"
                          required
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-[#faf8f5] text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            emailError ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-[#d4a853]/30 focus:border-[#d4a853]"
                          }`}
                        />
                      </div>
                      {emailError && <p className="text-[11px] text-red-500 mt-1.5 pl-1 flex items-center gap-1"><AlertCircle size={10} /> {emailError}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-widest">Phone Number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-[#faf8f5] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30 focus:border-[#d4a853] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="border border-[#e8e2d9] rounded-2xl p-4 sm:p-5 space-y-4 bg-[#faf8f5]/60">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={11} className="text-[#d4a853]" strokeWidth={2} />
                      Delivery Address
                    </p>

                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-widest">Street / Flat / Area</label>
                      <input
                        type="text"
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        placeholder="e.g. Flat 4B, Rose Garden, MG Road"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30 focus:border-[#d4a853] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-widest">
                          PIN Code
                          {pincodeLoading && <span className="normal-case font-normal text-[#d4a853] ml-1">· fetching…</span>}
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          value={pincode}
                          onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ""))}
                          placeholder="6-digit PIN"
                          className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 transition-all ${
                            pincodeError ? "border-red-400 focus:ring-red-200" : pincode.length === 6 && city ? "border-green-400 focus:ring-green-200" : "border-border focus:ring-[#d4a853]/30 focus:border-[#d4a853]"
                          }`}
                        />
                        {pincodeError && <p className="text-[10px] text-red-500 mt-1">{pincodeError}</p>}
                        {pincode.length === 6 && city && !pincodeError && <p className="text-[10px] text-green-600 mt-1">Location found</p>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-widest">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          readOnly
                          placeholder="Auto-filled from PIN"
                          className="w-full px-4 py-3 rounded-xl border border-border bg-[#f0ebe3] text-sm text-muted-foreground cursor-not-allowed select-none"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-widest">
                          State
                        </label>
                        <input
                          type="text"
                          value={state}
                          readOnly
                          placeholder="Auto-filled from PIN"
                          className="w-full px-4 py-3 rounded-xl border border-border bg-[#f0ebe3] text-sm text-muted-foreground cursor-not-allowed select-none"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 border border-red-200">
                        <AlertCircle size={15} className="flex-shrink-0" /> {error}
                      </motion.div>
                    )}
                    {success && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded-xl px-4 py-3 border border-green-200">
                        <CheckCircle size={15} className="flex-shrink-0" /> Profile updated successfully!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#d4a853] text-[#1a1612] text-[11px] uppercase tracking-widest font-semibold hover:bg-[#c49840] disabled:opacity-60 transition-all duration-300 shadow-[0_4px_14px_0_rgba(212,168,83,0.3)]"
                  >
                    {saving
                      ? <span className="w-4 h-4 border-2 border-[#1a1612]/30 border-t-[#1a1612] rounded-full animate-spin" />
                      : <Save size={14} strokeWidth={2} />
                    }
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </form>

                <div className="lg:hidden p-4 border-t border-border space-y-3">
                  <Link href="/orders" className="flex items-center gap-3 bg-[#faf8f5] rounded-xl p-3 hover:bg-[#f0ebe3] transition-colors">
                    <Package size={16} className="text-[#d4a853] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#1a1612]">My Orders</span>
                    <ChevronRight size={14} className="text-muted-foreground ml-auto flex-shrink-0" />
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-xl border border-red-200/50 transition-all">
                    <LogOut size={13} strokeWidth={1.5} />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
