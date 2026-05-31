import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ShoppingBag, Minus, Plus, ChevronDown, ChevronLeft,
  Truck, RotateCcw, ShieldCheck, Gift, Star, Check, X, ZoomIn
} from "lucide-react";
import { inr } from "@/data/products";
import { resolveImage } from "@/data/imageMap";
import { useApp } from "@/context/AppContext";
import { api, type ApiReview } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const imageCrops = [
  { label: "Full",    pos: "object-center",     scale: "scale-100" },
  { label: "Detail",  pos: "object-top",         scale: "scale-110" },
  { label: "Close",   pos: "object-[50%_60%]",  scale: "scale-125" },
  { label: "Side",    pos: "object-[30%_40%]",  scale: "scale-115" },
];

const accordionItems = [
  {
    icon: Truck,
    title: "Shipping & Delivery",
    content: "Ships within 24 hours. Delivered in 3–5 business days across India. Free shipping on orders above ₹2,000 — flat ₹99 otherwise. Tracking link sent via WhatsApp & email.",
  },
  {
    icon: RotateCcw,
    title: "Exchange Policy",
    content: "Need a different size or style? Contact us within 7 days of delivery and we'll help you with an exchange. Reach out via email or our contact form with your order details.",
  },
  {
    icon: ShieldCheck,
    title: "Anti-Tarnish Promise",
    content: "Every Ethura piece is coated with a 100% anti-tarnish layer over 18k gold plating. Hypoallergenic and safe for all skin types. Your gold stays gold — guaranteed.",
  },
  {
    icon: Gift,
    title: "Gift Packaging",
    content: "All orders arrive in our signature ivory & gold gift box with a satin ribbon — at no extra charge. Add a personal message card at checkout, complimentary.",
  },
];

function parseGalleryImages(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addToCart, toggleWishlist, wishlist, products, giftPrice, reviewsEnabled } = useApp();

  const product = products.find(p => p.id === Number(id));
  const mainImage = product ? ((product as any).featureImageUrl || resolveImage(product.imageKey, product.imageUrl) || "") : "";
  const galleryRaw = parseGalleryImages((product as any)?.images);
  const allImages = [mainImage, ...galleryRaw].filter(Boolean);
  const productImage = allImages[0] || "";

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [reviews, setReviews] = useState<ApiReview[]>([]);

  useEffect(() => {
    if (!product) return;
    api.reviews.forProduct(product.id).then(setReviews).catch(() => {});
  }, [product?.id]);

  const similar = useMemo(
    () => products.filter(p => product && p.category === product.category && p.id !== product.id).slice(0, 4),
    [product, products]
  );

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#faf9f7" }}>
        <Navbar />
        <p className="font-serif text-3xl text-foreground/30 mt-32">Product not found.</p>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);

  const handleAddToCart = () => {
    const giftOpts = isGift ? { isGift: true, giftMessage } : undefined;
    for (let i = 0; i < qty; i++) addToCart(product, giftOpts);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="min-h-screen" style={{ background: "#faf9f7" }}>
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-0">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-8">
          <button onClick={() => navigate("/shop")} className="flex items-center gap-1 hover:text-[#d4a853] transition-colors">
            <ChevronLeft size={11} /> The Boutique
          </button>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-foreground truncate max-w-[140px]">{product.name}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-24">

          {/* ── Image Gallery ── */}
          <div className="flex flex-col gap-4">
            {/* Main image */}
            <motion.div
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="relative aspect-square overflow-hidden bg-white"
            >
              <img
                src={allImages[activeImg] || productImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-500"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 bg-[#1a1612] text-[#f5ede0] text-[9px] uppercase tracking-widest px-3 py-1.5">
                  {product.badge}
                </span>
              )}
              {product.stock && product.stock <= 4 && (
                <span
                  className="absolute top-4 right-4 text-[9px] uppercase tracking-widest px-3 py-1.5 font-medium"
                  style={{ background: "#f5ede0", color: "#d4a853", border: "1px solid #d4a853" }}
                >
                  Only {product.stock} left
                </span>
              )}
            </motion.div>

            {/* Thumbnails — real gallery images */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.slice(0, 8).map((imgSrc, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative aspect-square overflow-hidden bg-white transition-all duration-200 ${
                      activeImg === i ? "ring-2 ring-[#d4a853]" : "ring-1 ring-[#e8e2d9] hover:ring-[#d4a853]/50"
                    }`}
                  >
                    <img src={imgSrc} alt={`View ${i + 1}`} className="w-full h-full object-cover object-center" />
                  </button>
                ))}
              </div>
            )}

            {/* Star rating strip — only shown when real reviews exist */}
            {reviews.length > 0 && (() => {
              const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
              return (
                <div className="flex items-center gap-2 px-1">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= Math.round(avg) ? "fill-[#d4a853] text-[#d4a853]" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground tracking-wide">{avg.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                </div>
              );
            })()}
          </div>

          {/* ── Product Info ── */}
          <div className="flex flex-col">
            {/* Category + name */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="text-[#d4a853] text-[10px] uppercase tracking-[0.3em] mb-3 font-medium capitalize">
                {product.category}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight mb-4">
                {product.name}
              </h1>
              {product.compareAtPrice && product.compareAtPrice > product.price ? (
                <div className="mb-4">
                  <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
                    <span className="text-2xl font-bold text-[#d4a853] tracking-wide">{inr(product.price)}</span>
                    <span className="text-base line-through text-muted-foreground/50 font-normal">{inr(product.compareAtPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 text-white font-extrabold text-[13px] uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-sm"
                      style={{ background: "#e8303a" }}
                    >
                      -{Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
                    </span>
                    <span className="text-[11px] text-green-600 font-semibold tracking-wider">
                      You save {inr(product.compareAtPrice - product.price)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-medium text-foreground mb-2">{inr(product.price)}</p>
              )}
              <p className="text-[10px] text-muted-foreground tracking-widest mb-6">
                Inclusive of all taxes · Free shipping above ₹2,000
              </p>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-sm text-muted-foreground font-light leading-relaxed mb-8 border-l-2 border-[#d4a853] pl-4"
            >
              {product.description}
            </motion.p>

            {/* Metal + care tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {["18k Gold Plated", "Anti-Tarnish", "Hypoallergenic", "Stainless Steel Base"].map(tag => (
                <span key={tag} className="text-[9px] uppercase tracking-widest px-3 py-1.5 border border-[#e8e2d9] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>

            {/* Gift Option */}
            <div className="mb-6 border border-[#e8e2d9]">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer group"
                onClick={() => setIsGift(g => !g)}
              >
                <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  isGift ? "bg-[#d4a853] border-[#d4a853]" : "border-[#c8c0b4] group-hover:border-[#d4a853]"
                }`}>
                  {isGift && <Check size={10} strokeWidth={2.5} className="text-white" />}
                </div>
                <Gift size={13} className="text-[#d4a853] flex-shrink-0" strokeWidth={1.5} />
                <span className="text-[11px] uppercase tracking-widest text-foreground flex-1">This is a gift</span>
                <span className="text-[10px] font-medium text-[#d4a853]">+ ₹{giftPrice}</span>
              </div>

              <AnimatePresence initial={false}>
                {isGift && (
                  <motion.div
                    key="gift-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-[#e8e2d9] bg-[#fdfcfa]">
                      <label className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground mb-2 block">
                        Personal Message <span className="text-[#d4a853]/70 normal-case tracking-normal">(optional · printed on a handwritten-style card)</span>
                      </label>
                      <textarea
                        value={giftMessage}
                        onChange={e => setGiftMessage(e.target.value)}
                        placeholder="Write something heartfelt for the recipient..."
                        maxLength={150}
                        rows={3}
                        className="w-full text-sm font-light text-foreground bg-white border border-[#e8e2d9] focus:border-[#d4a853] outline-none p-3 resize-none placeholder:text-muted-foreground/40 transition-colors duration-200"
                      />
                      <p className="text-[9px] text-muted-foreground/60 mt-1 text-right">{giftMessage.length}/150</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Qty + Add to Bag */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Quantity */}
              <div className="flex items-center gap-0">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-4 w-16">Qty</span>
                <div className="flex items-center border border-[#e8e2d9]">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center text-sm font-medium text-foreground border-x border-[#e8e2d9]">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Add to Bag */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-300"
                  style={{
                    background: added ? "#d4a853" : "#1a1612",
                    color: added ? "#1a1612" : "#f5ede0",
                  }}
                >
                  {added ? (
                    <><Check size={14} strokeWidth={2} /> Added to Bag</>
                  ) : (
                    <><ShoppingBag size={14} strokeWidth={1.5} /> Add to Bag</>
                  )}
                </motion.button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-14 flex items-center justify-center border transition-all duration-300 ${
                    isWishlisted
                      ? "border-[#d4a853] bg-[#d4a853]/10"
                      : "border-[#e8e2d9] hover:border-[#d4a853]"
                  }`}
                  title="Save to wishlist"
                >
                  <Heart
                    size={16}
                    strokeWidth={1.5}
                    className={isWishlisted ? "fill-[#d4a853] text-[#d4a853]" : "text-foreground"}
                  />
                </button>
              </div>
            </div>

            {/* Accordion */}
            <div className="border-t border-[#e8e2d9]">
              {accordionItems.map((item, i) => (
                <div key={i} className="border-b border-[#e8e2d9]">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
                    className="w-full flex items-center justify-between py-4 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={14} className="text-[#d4a853] flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-[11px] uppercase tracking-widest text-foreground group-hover:text-[#d4a853] transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform duration-300 flex-shrink-0 ${openAccordion === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {openAccordion === i && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pl-[26px] text-sm text-muted-foreground font-light leading-relaxed">
                          {item.content}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ─── Customer Reviews — hidden when no reviews or feature disabled ─── */}
      {reviewsEnabled && reviews.length > 0 && (
      <section id="all-reviews" className="py-14 md:py-20 border-t border-[#e8e2d9]" style={{ background: "linear-gradient(135deg,#1a1612 0%,#2a2018 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 md:px-8">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4a853] font-medium mb-2">Verified Buyers</p>
              <h2 className="font-serif text-2xl md:text-3xl text-white">What Our Customers Say</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-3 mt-3">
                  {/* Big avg rating */}
                  <span className="text-4xl font-serif text-[#d4a853] leading-none">
                    {(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                  <div>
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={15}
                          className={s <= Math.round(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) ? "fill-[#d4a853] text-[#d4a853]" : "text-white/20"}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <p className="text-white/50 text-xs">{reviews.length} verified review{reviews.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-14 border border-white/10 rounded-2xl">
              <Star size={36} strokeWidth={1} className="mx-auto mb-4 text-[#d4a853]/40" />
              <p className="font-serif text-xl text-white/70">No reviews yet</p>
              <p className="text-sm text-white/30 mt-2">Purchase this piece to be the first to share your experience</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-colors"
                >
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={13}
                        className={s <= r.rating ? "fill-[#d4a853] text-[#d4a853]" : "text-white/15"}
                        strokeWidth={1.5}
                      />
                    ))}
                    <span className="ml-2 text-[10px] text-white/40 uppercase tracking-widest">Verified</span>
                  </div>

                  {/* Title + body */}
                  {r.title && (
                    <p className="text-sm font-semibold text-white mb-1.5">"{r.title}"</p>
                  )}
                  <p className="text-sm text-white/60 leading-relaxed">{r.body}</p>

                  {/* Photo */}
                  {r.imageUrl && (
                    <div className="mt-3">
                      <div
                        className="relative h-20 w-20 rounded-xl overflow-hidden border border-white/10 cursor-pointer group/img"
                        onClick={() => setPreviewImage(r.imageUrl!)}
                      >
                        <img
                          src={r.imageUrl}
                          alt="Review"
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                          <ZoomIn size={16} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-200" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Author + date */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#d4a853]/20 flex items-center justify-center text-[10px] font-semibold text-[#d4a853]">
                        {r.reviewerName.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs text-white/60 font-medium">{r.reviewerName}</p>
                    </div>
                    <p className="text-[10px] text-white/30">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* Similar Products */}
      {similar.length > 0 && (
        <section className="border-t border-[#e8e2d9] py-16 md:py-20" style={{ background: "#f5ede0" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-8 h-px bg-[#d4a853]" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4a853] font-medium">You May Also Love</p>
              </div>
              <button
                onClick={() => navigate(`/shop?category=${product.category}`)}
                className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-[#d4a853] transition-colors duration-200"
              >
                View All {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                <span className="text-base leading-none">→</span>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10">
              {similar.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden aspect-[4/5] bg-white mb-3">
                    <img
                      src={resolveImage(p.imageKey, p.imageUrl)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-600"
                    />
                    {p.badge && (
                      <span className="absolute top-2 left-2 bg-[#1a1612] text-[#f5ede0] text-[8px] uppercase tracking-widest px-2 py-1">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-sm text-foreground group-hover:text-[#d4a853] transition-colors duration-300 truncate">
                    {p.name}
                  </h3>
                  <p className="text-sm font-medium text-foreground mt-1">{inr(p.price)}</p>
                </motion.div>
              ))}
            </div>

            {/* Full collection CTA */}
            <div className="mt-12 text-center">
              <button
                onClick={() => navigate(`/shop?category=${product.category}`)}
                className="inline-flex items-center gap-3 border border-[#1a1612] px-10 py-4 text-[11px] uppercase tracking-[0.25em] text-foreground hover:bg-[#1a1612] hover:text-[#f5ede0] transition-all duration-300"
              >
                Explore All {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── Image Preview Lightbox ─── */}
      <AnimatePresence>
        {previewImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/90 z-[100] backdrop-blur-sm"
              onClick={() => setPreviewImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="relative max-w-lg w-full pointer-events-auto">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-[11px] uppercase tracking-widest"
                >
                  <X size={14} /> Close
                </button>
                <img
                  src={previewImage}
                  alt="Review photo"
                  className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
