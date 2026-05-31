import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";

import heroImg from "@assets/1820634780966981632_1775578540037.jpg";

export default function Login() {
  const { login, register, user, logout } = useApp();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Read ?redirect= param so we can return the user to where they came from
  const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateField(field: string, value: string) {
    const errs = { ...fieldErrors };
    if (field === "name") {
      if (!value.trim()) errs.name = "Name is required";
      else if (value.trim().length < 2) errs.name = "Name must be at least 2 characters";
      else delete errs.name;
    }
    if (field === "email") {
      if (!value.trim()) errs.email = "Email is required";
      else if (!EMAIL_RE.test(value.trim())) errs.email = "Enter a valid email (e.g. you@gmail.com)";
      else delete errs.email;
    }
    if (field === "password") {
      if (value.length > 0 && value.length < 6) errs.password = "At least 6 characters";
      else if (value.length >= 6 && (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value))) errs.password = "Must contain a letter and a number";
      else delete errs.password;
    }
    setFieldErrors(errs);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginForm.email || !loginForm.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      setSuccess("Welcome back!");
      const updatedUser = await import("@/lib/api").then(m => m.api.auth.me());
      setTimeout(() => setLocation(updatedUser.isAdmin ? "/admin" : redirectTo), 1000);
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!registerForm.name || !registerForm.email || !registerForm.password) { setError("Please fill in all fields."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email.trim())) { setError("Please enter a valid email address."); return; }
    if (registerForm.password !== registerForm.confirm) { setError("Passwords do not match."); return; }
    if (registerForm.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!/[a-zA-Z]/.test(registerForm.password) || !/[0-9]/.test(registerForm.password)) { setError("Password must contain at least one letter and one number (e.g. pass123)."); return; }
    setLoading(true);
    try {
      await register(registerForm.name, registerForm.email, registerForm.password);
      setSuccess("Account created! Welcome to Ethura.");
      setTimeout(() => setLocation(redirectTo), 1200);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-serif text-3xl text-[#6b3f2a] mb-1">Hello, {user.name.split(" ")[0]}</h2>
          <p className="text-muted-foreground text-sm mb-8">{user.email}</p>
          <div className="space-y-3">
            {redirectTo !== "/" && (
              <Link href={redirectTo}>
                <button className="w-full py-3 px-6 bg-[#d4a853] text-[#1a1612] text-xs uppercase tracking-widest font-medium hover:bg-[#c4983f] transition-colors rounded-none">
                  Continue to {redirectTo === "/checkout" ? "Checkout" : redirectTo.replace("/", "")}
                </button>
              </Link>
            )}
            {user.isAdmin && (
              <Link href="/admin">
                <button className="w-full py-3 px-6 bg-[#d4a853] text-[#1a1612] text-xs uppercase tracking-widest font-medium hover:bg-[#c4983f] transition-colors rounded-none">
                  Admin Panel
                </button>
              </Link>
            )}
            <Link href="/shop">
              <button className="w-full py-3 px-6 bg-[#1a1612] text-[#f5ede0] text-xs uppercase tracking-widest font-medium hover:bg-[#2a2419] transition-colors rounded-none">
                Shop Collection
              </button>
            </Link>
            <button
              onClick={logout}
              className="w-full py-3 px-6 border border-border text-foreground text-xs uppercase tracking-widest hover:border-foreground transition-colors rounded-none"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — brand visual */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col">
        <img
          src={heroImg}
          alt="Ethura Jewelry"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1612]/70 via-[#1a1612]/40 to-[#1a1612]/20" />
        <div className="relative z-10 flex flex-col h-full p-10">
          <Link href="/" className="text-2xl font-serif tracking-[0.25em] text-[#f5ede0]">ETHURA</Link>
          <div className="mt-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8 bg-[#d4a853]" />
              <span className="text-[#d4a853] text-[10px] uppercase tracking-[0.35em]">Since 2024</span>
            </div>
            <h2 className="font-serif text-4xl xl:text-5xl text-[#f5ede0] leading-[1.15] mb-4">
              Gold that<br />
              <span className="italic text-[#d4a853]">never fades.</span>
            </h2>
            <p className="text-[#c5b8a8] text-sm font-light leading-relaxed max-w-xs">
              18k gold-plated, anti-tarnish jewelry crafted for real life. Wear it every day, forever.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {["18k Gold Plated", "Anti-Tarnish", "Hypoallergenic"].map(f => (
                <span key={f} className="flex items-center gap-1.5 text-[#c5b8a8] text-[10px] uppercase tracking-widest">
                  <Sparkles size={10} className="text-[#d4a853]" /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f7]">
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-8 pb-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-serif tracking-widest text-[#6b3f2a]">ETHURA</Link>
          <Link href="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            Back to store <ArrowRight size={11} />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Hidden on desktop — back link */}
            <div className="hidden lg:flex justify-end mb-8">
              <Link href="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                Back to store <ArrowRight size={11} />
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="font-serif text-3xl text-[#6b3f2a] mb-1">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {mode === "login"
                  ? "Sign in to your Ethura account"
                  : "Join thousands of women who love Ethura"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-white border border-border p-1 rounded-xl mb-8">
              <button
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className={`flex-1 py-2.5 text-xs uppercase tracking-widest rounded-lg transition-all duration-200 font-medium ${
                  mode === "login"
                    ? "bg-[#1a1612] text-[#f5ede0] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                className={`flex-1 py-2.5 text-xs uppercase tracking-widest rounded-lg transition-all duration-200 font-medium ${
                  mode === "register"
                    ? "bg-[#1a1612] text-[#f5ede0] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Register
              </button>
            </div>

            {/* Messages */}
            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6"
                >
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white fill-none stroke-current" strokeWidth="2"><polyline points="2,6 5,9 10,3"/></svg>
                  </div>
                  {success}
                </motion.div>
              )}
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6"
                >
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">!</div>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full h-12 px-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853] transition placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-foreground uppercase tracking-wide">Password</label>
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={loginForm.password}
                        onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full h-12 pl-4 pr-12 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853] transition placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-[11px] text-[#d4a853] hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#1a1612] text-[#f5ede0] text-xs uppercase tracking-widest font-medium hover:bg-[#d4a853] hover:text-[#1a1612] disabled:opacity-60 transition-all duration-300 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : "Sign In"}
                  </button>

                  <p className="text-center text-xs text-muted-foreground pt-1">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setError(""); }}
                      className="text-[#d4a853] hover:underline font-medium"
                    >
                      Create one free
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      required
                      value={registerForm.name}
                      onChange={e => { setRegisterForm(f => ({ ...f, name: e.target.value })); validateField("name", e.target.value); }}
                      placeholder="Your full name"
                      className={`w-full h-12 px-4 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 transition placeholder:text-muted-foreground/60 ${
                        fieldErrors.name ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                      }`}
                    />
                    {fieldErrors.name && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={e => { setRegisterForm(f => ({ ...f, email: e.target.value })); validateField("email", e.target.value); }}
                      placeholder="you@example.com"
                      className={`w-full h-12 px-4 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 transition placeholder:text-muted-foreground/60 ${
                        fieldErrors.email ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                      }`}
                    />
                    {fieldErrors.email && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.email}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">Password</label>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          required
                          value={registerForm.password}
                          onChange={e => { setRegisterForm(f => ({ ...f, password: e.target.value })); validateField("password", e.target.value); }}
                          placeholder="Min. 6 chars"
                          className={`w-full h-12 pl-4 pr-10 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 transition placeholder:text-muted-foreground/60 ${
                            fieldErrors.password ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                          }`}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {fieldErrors.password && <p className="text-[10px] text-red-500 mt-1">{fieldErrors.password}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5 uppercase tracking-wide">Confirm</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          required
                          value={registerForm.confirm}
                          onChange={e => setRegisterForm(f => ({ ...f, confirm: e.target.value }))}
                          placeholder="Repeat password"
                          className={`w-full h-12 pl-4 pr-10 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 transition placeholder:text-muted-foreground/60 ${
                            registerForm.confirm.length === 0
                              ? "border-border focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                              : registerForm.password === registerForm.confirm
                              ? "border-green-400 focus:ring-green-200 focus:border-green-500"
                              : "border-red-400 focus:ring-red-100 focus:border-red-500"
                          }`}
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {registerForm.confirm.length > 0 && (
                        <p className={`text-[10px] mt-1 ${registerForm.password === registerForm.confirm ? "text-green-600" : "text-red-500"}`}>
                          {registerForm.password === registerForm.confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#1a1612] text-[#f5ede0] text-xs uppercase tracking-widest font-medium hover:bg-[#d4a853] hover:text-[#1a1612] disabled:opacity-60 transition-all duration-300 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : "Create My Account"}
                  </button>

                  <p className="text-center text-xs text-muted-foreground pt-1">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); }}
                      className="text-[#d4a853] hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {["Secure Login", "No Spam", "100% Authentic"].map(item => (
                  <span key={item} className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-[#d4a853] fill-none stroke-current" strokeWidth="1.5"><polyline points="1,6 4,9 11,3"/></svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
