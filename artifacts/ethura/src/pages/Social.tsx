import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";

import img1 from "@assets/1820634780966981632_1775578540037.jpg";
import img2 from "@assets/1658729348133425152_1775578540034.jpg";
import img3 from "@assets/1829102247812927488_1775578540040.jpg";
import img4 from "@assets/2040050587508281344_1775578540031.jpg";
import img5 from "@assets/1928289647822245888_1775578540040.jpg";

const FALLBACK_IMAGES = [img1, img2, img3, img4, img5, img1, img2, img3, img4];

const BADGE_COLORS: Record<string, string> = {
  Trending: "#d4a853",
  Popular:  "#a08060",
  Viral:    "#c5343c",
  New:      "#1a1612",
};

const BADGE_LABELS = ["Trending", "Popular", "Viral", "New", "Trending", "Popular", "Viral", "New", "Trending"];

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
    </svg>
  );
}

export default function Social() {
  const [reels, setReels] = useState<any[]>([]);
  const [instagramHandle, setInstagramHandle] = useState("@ethura.jewelry");
  const [followers, setFollowers] = useState("47K+");
  const [reelViews, setReelViews] = useState("2.1M");
  const [positiveReviews, setPositiveReviews] = useState("98%");

  useEffect(() => {
    api.reels.list().then(data => {
      if (data && data.length > 0) setReels(data.filter((r: any) => r.isActive));
    }).catch(() => {});
    api.siteContent.get().then(content => {
      if (content["social.instagram_handle"]) setInstagramHandle(content["social.instagram_handle"]);
      if (content["social.followers"]) setFollowers(content["social.followers"]);
      if (content["social.reel_views"]) setReelViews(content["social.reel_views"]);
      if (content["social.positive_reviews"]) setPositiveReviews(content["social.positive_reviews"]);
    }).catch(() => {});
  }, []);

  const displayReels = reels.length > 0
    ? reels.map((r, i) => ({
        id: r.id,
        img: r.thumbnailUrl || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
        caption: r.title || "",
        tag: BADGE_LABELS[i % BADGE_LABELS.length],
        views: "",
      }))
    : FALLBACK_IMAGES.map((img, i) => ({
        id: i + 1,
        img,
        caption: ["The tiny heart that stole every heart ✨", "Layered & luminous — how we do everyday gold 💛", "Teardrop studs under golden hour light 🌅", "Crystal heart earrings — a whole moment 🤍", "The bow charm necklace you didn't know you needed 🎀", "Styling our bestsellers three ways 🔁", "18k gold that never turns — promise ✦", "The GRWM with our full layering set 🛁", "Your new everyday earring ritual begins here 🌙"][i],
        tag: BADGE_LABELS[i],
        views: ["1.2M", "890K", "2.1M", "670K", "1.5M", "430K", "980K", "1.8M", "760K"][i],
      }));

  const instagramUrl = `https://instagram.com/${instagramHandle.replace("@", "")}`;

  return (
    <div className="bg-[#faf9f7] min-h-screen text-foreground">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-4 text-center border-b border-[#e8e2d9]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-3 bg-white border border-[#e8e2d9] px-5 py-2.5 rounded-full mb-8 shadow-sm">
            <InstagramIcon size={16} />
            <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/70">{instagramHandle}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif mb-5 leading-tight">
            As Seen on <span className="italic text-[#d4a853]">Reels</span>
          </h1>
          <p className="text-muted-foreground font-light max-w-md mx-auto text-sm leading-relaxed">
            Our most-loved, shared, and saved moments — straight from the Ethura Instagram feed.
          </p>
        </motion.div>
      </section>

      {/* Reels Grid */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-5">
          {displayReels.map((reel, i) => (
            <motion.div
              key={reel.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
              className="group relative aspect-[9/16] overflow-hidden bg-[#f0ebe3] cursor-pointer"
              data-testid={`reel-card-${reel.id}`}
            >
              <img
                src={reel.img}
                alt={reel.caption}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />

              {/* Dark overlay on hover */}
              <div className="absolute inset-0 bg-[#1a1612]/0 group-hover:bg-[#1a1612]/50 transition-all duration-400" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" width="18" height="18" className="translate-x-0.5">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </div>
              </div>

              {/* Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span
                  className="text-[8px] md:text-[9px] uppercase tracking-widest px-2 py-1 text-white font-medium"
                  style={{ background: BADGE_COLORS[reel.tag] }}
                >
                  {reel.tag}
                </span>
              </div>

              {/* Views badge — only if available */}
              {reel.views && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                  <svg viewBox="0 0 24 24" fill="white" width="10" height="10" className="opacity-80">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                  <span className="text-white text-[9px] font-medium">{reel.views}</span>
                </div>
              )}

              {/* Caption - slides up on hover */}
              {reel.caption && (
                <div className="absolute bottom-0 left-0 right-0 md:translate-y-2 md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 p-3 md:p-4">
                  <p className="text-white text-[11px] md:text-xs leading-relaxed font-light line-clamp-2">
                    {reel.caption}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Instagram CTA */}
      <section className="py-20 md:py-28 px-4 border-t border-[#e8e2d9]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-lg">
            <InstagramIcon size={34} />
          </div>

          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Follow <span className="italic text-[#d4a853]">{instagramHandle}</span>
          </h2>
          <p className="text-muted-foreground font-light text-sm leading-relaxed mb-10">
            Behind-the-scenes, new drops, and styling inspo — delivered straight to your feed. Join our growing community of gold lovers.
          </p>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white px-10 py-4 text-xs uppercase tracking-[0.2em] font-medium transition-opacity hover:opacity-90"
            data-testid="instagram-follow-btn"
          >
            <InstagramIcon size={16} />
            Follow on Instagram
          </a>

          <div className="flex items-center justify-center gap-10 mt-14 pt-10 border-t border-[#e8e2d9]">
            {[
              { val: followers,       lbl: "Followers" },
              { val: reelViews,       lbl: "Reel Views" },
              { val: positiveReviews, lbl: "Positive Reviews" },
            ].map(s => (
              <div key={s.lbl} className="text-center">
                <p className="font-serif text-2xl text-foreground mb-1">{s.val}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.lbl}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
