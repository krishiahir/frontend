import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag } from "lucide-react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { getSiteContent, SITE_CONTENT_DEFAULTS } from "@/lib/siteContent";

export default function DiscountPopup() {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const get = useCallback((key: string) => getSiteContent(content, key), [content]);

  useEffect(() => {
    api.siteContent.get().then(c => { setContent(c); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const enabled = get("popup.enabled");
    if (enabled !== "true") return;

    const delayMin = Math.max(0.5, parseFloat(get("popup.delay_minutes")) || 5);
    const intervalMin = Math.max(0.5, parseFloat(get("popup.interval_minutes")) || 10);

    const t1 = setTimeout(() => setVisible(true), delayMin * 60 * 1000);
    const t2 = setInterval(() => setVisible(true), intervalMin * 60 * 1000);

    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [loaded, content]);

  const enabled = get("popup.enabled");
  if (!loaded || enabled !== "true") return null;

  const imageUrl = get("popup.image_url");
  const quote = get("popup.quote");
  const badge = get("popup.badge");
  const cta = get("popup.cta");
  const ctaLink = get("popup.cta_link") || "/shop";
  const discount = get("popup.discount_text");

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
            onClick={() => setVisible(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#1a1612] text-[#f5ede0] max-w-md w-full shadow-2xl overflow-hidden pointer-events-auto relative">
              <button
                onClick={() => setVisible(false)}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors rounded-full"
              >
                <X size={14} />
              </button>

              {imageUrl && (
                <div className="relative w-full h-52 overflow-hidden">
                  <img src={imageUrl} alt="Offer" className="w-full h-full object-cover object-center opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1612] via-[#1a1612]/30 to-transparent" />
                  {badge && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#d4a853] text-[#1a1612] px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold">
                      <Tag size={10} />
                      {badge}
                    </div>
                  )}
                </div>
              )}

              <div className="px-7 py-6">
                {!imageUrl && badge && (
                  <div className="flex items-center gap-1.5 bg-[#d4a853] text-[#1a1612] px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold w-fit mb-4">
                    <Tag size={10} />
                    {badge}
                  </div>
                )}

                {discount && (
                  <div className="text-center mb-3">
                    <span className="font-serif text-4xl text-[#d4a853]">{discount}</span>
                  </div>
                )}

                {quote && (
                  <div className="text-center mb-6">
                    <div className="w-8 h-px bg-[#d4a853]/50 mx-auto mb-4" />
                    <p className="font-serif italic text-lg leading-snug text-[#f5ede0]/90">
                      "{quote}"
                    </p>
                  </div>
                )}

                <Link href={ctaLink}>
                  <button
                    onClick={() => setVisible(false)}
                    className="w-full bg-[#d4a853] text-[#1a1612] hover:bg-[#f5ede0] transition-colors py-3.5 text-xs uppercase tracking-[0.25em] font-semibold"
                  >
                    {cta || "Shop Now"}
                  </button>
                </Link>

                <button
                  onClick={() => setVisible(false)}
                  className="w-full mt-3 text-[10px] uppercase tracking-widest text-[#f5ede0]/40 hover:text-[#f5ede0]/60 transition-colors py-2"
                >
                  No thanks
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
