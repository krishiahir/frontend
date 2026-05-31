import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

import heroImg from "@assets/1820634780966981632_1775578540037.jpg";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setStep("otp");
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      otpRefs.current[5]?.focus();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await api.auth.verifyOtp(email.trim(), code);
      setStep("password");
    } catch (err: any) {
      setError(err.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain both letters and numbers");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword(email.trim(), otp.join(""), password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-serif text-[#1a1612] mb-2">Password Updated</h2>
          <p className="text-sm text-muted-foreground mb-4">Your password has been reset successfully. Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={heroImg} alt="Ethura" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1612]/80 via-[#1a1612]/30 to-transparent" />
        <div className="absolute bottom-16 left-12 right-12">
          <span className="text-[9px] uppercase tracking-[0.4em] text-[#d4a853] flex items-center gap-2">
            <span className="w-6 h-px bg-[#d4a853]" /> Since 2024
          </span>
          <h2 className="text-4xl text-[#f5ede0] font-serif mt-4 leading-snug">
            Gold that<br /><em className="text-[#d4a853]">never fades.</em>
          </h2>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col bg-[#faf8f5]">
        <div className="flex items-center justify-between px-6 sm:px-10 pt-6">
          <Link href="/" className="text-2xl tracking-[0.3em] font-serif text-[#1a1612]">ETHURA</Link>
          <Link href="/login" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            Back to Login <ArrowLeft size={12} />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#d4a853]/10 flex items-center justify-center mb-4">
                      <Mail size={22} className="text-[#d4a853]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif text-[#1a1612] mb-2">Forgot password?</h1>
                    <p className="text-sm text-muted-foreground">Enter your email and we'll send you a verification code to reset your password.</p>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-medium text-[#1a1612] mb-2 block">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3.5 border border-[#e0d8cc] bg-white text-sm focus:outline-none focus:border-[#d4a853] transition-colors rounded-none"
                        autoFocus
                      />
                    </div>

                    {error && (
                      <div className="text-red-500 text-xs">
                        <p>{error}</p>
                        {error.toLowerCase().includes("not registered") && (
                          <p className="mt-1">
                            <Link href="/login" className="text-[#d4a853] hover:underline font-medium">
                              Create an account
                            </Link>{" "}
                            to get started.
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#1a1612] text-white text-xs uppercase tracking-widest hover:bg-[#2a231c] transition-colors disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send Verification Code"}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#d4a853]/10 flex items-center justify-center mb-4">
                      <KeyRound size={22} className="text-[#d4a853]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif text-[#1a1612] mb-2">Enter verification code</h1>
                    <p className="text-sm text-muted-foreground">
                      We've sent a 6-digit code to <strong className="text-[#1a1612]">{email}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          className="w-12 h-14 text-center text-xl font-bold border border-[#e0d8cc] bg-white focus:outline-none focus:border-[#d4a853] transition-colors rounded-none"
                        />
                      ))}
                    </div>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#1a1612] text-white text-xs uppercase tracking-widest hover:bg-[#2a231c] transition-colors disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>

                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-xs text-muted-foreground">Resend code in {resendTimer}s</p>
                      ) : (
                        <button type="button" onClick={() => handleSendOtp()} className="text-xs text-[#d4a853] hover:text-[#b8903f] transition-colors underline">
                          Resend Code
                        </button>
                      )}
                    </div>

                    <button type="button" onClick={() => { setStep("email"); setError(""); setOtp(["","","","","",""]); }} className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
                      ← Change email
                    </button>
                  </form>
                </motion.div>
              )}

              {step === "password" && (
                <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-8">
                    <div className="w-12 h-12 rounded-xl bg-[#d4a853]/10 flex items-center justify-center mb-4">
                      <Lock size={22} className="text-[#d4a853]" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-serif text-[#1a1612] mb-2">Set new password</h1>
                    <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-medium text-[#1a1612] mb-2 block">New Password</label>
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3.5 border border-[#e0d8cc] bg-white text-sm focus:outline-none focus:border-[#d4a853] transition-colors rounded-none pr-12"
                          autoFocus
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-medium text-[#1a1612] mb-2 block">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirm}
                          onChange={e => setConfirm(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3.5 border border-[#e0d8cc] bg-white text-sm focus:outline-none focus:border-[#d4a853] transition-colors rounded-none pr-12"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-1">
                      <p className={password.length >= 6 ? "text-green-600" : ""}>• At least 6 characters</p>
                      <p className={/[a-zA-Z]/.test(password) && /\d/.test(password) ? "text-green-600" : ""}>• Contains letters and numbers</p>
                      <p className={password && confirm && password === confirm ? "text-green-600" : ""}>• Passwords match</p>
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#1a1612] text-white text-xs uppercase tracking-widest hover:bg-[#2a231c] transition-colors disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
