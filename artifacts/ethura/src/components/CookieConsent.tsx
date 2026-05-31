import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "ethura_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const decision = localStorage.getItem(STORAGE_KEY);
    if (!decision) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[9990] bg-[#1a1612] text-[#f5ede0] border-t border-[#d4a853]/20 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[#d4a853]/10 rounded-full mt-0.5">
                <Cookie size={14} className="text-[#d4a853]" />
              </div>
              <div className="text-xs leading-relaxed text-[#f5ede0]/80">
                <span className="font-medium text-[#f5ede0]">We use cookies </span>
                to enhance your experience, remember your preferences, and understand how you shop with us.
                By clicking "Accept", you consent to our use of cookies.{" "}
                <Link href="/terms" className="text-[#d4a853] hover:underline" onClick={accept}>
                  Learn more
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={decline}
                className="flex-1 sm:flex-initial text-[10px] uppercase tracking-widest text-[#f5ede0]/50 hover:text-[#f5ede0]/80 transition-colors px-4 py-2.5 border border-white/10 hover:border-white/20"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="flex-1 sm:flex-initial text-[10px] uppercase tracking-widest bg-[#d4a853] text-[#1a1612] hover:bg-[#f5ede0] transition-colors px-6 py-2.5 font-semibold"
              >
                Accept All
              </button>
              <button
                onClick={decline}
                className="text-[#f5ede0]/40 hover:text-[#f5ede0]/70 transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
