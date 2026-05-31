import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Check, ArrowRight, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useApp } from "@/context/AppContext";
import { inr } from "@/data/products";
import { resolveImage } from "@/data/imageMap";
import { api } from "@/lib/api";
import type { ApiSiteFeature, ApiFeatureCard, ApiProductCategory, ApiProductType } from "@/lib/api";
import { useSiteContent } from "@/hooks/useSiteContent";

import tinyHeartNecklace   from "@assets/1820634780966981632_1775578540037.jpg";
import layeredNecklace      from "@assets/1658729348133425152_1775578540034.jpg";
import teardropStuds        from "@assets/1829102247812927488_1775578540040.jpg";
import crystalHeartEarring  from "@assets/2040050587508281344_1775578540031.jpg";
import bowCharmNecklace     from "@assets/1928289647822245888_1775578540040.jpg";
import snakeRing            from "@assets/1570216754091790336_1775578540033.jpg";
import pearlDropEarrings    from "@assets/2039912385875152896_1775578540042.jpg";

const MARQUEE_STATIC = [
  "Water Resistant", "Ships Across India", "Lifetime Elegance",
];

const CATEGORY_FALLBACK_ICONS: Record<string, string> = {
  necklaces: "💎",
  earrings: "✨",
  rings: "💍",
  bracelets: "⚡",
  jewelry: "🌟",
  bags: "👜",
};

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity1 = useTransform(scrollY, [0, 500], [1, 0]);

  const { wishlist, toggleWishlist, addToCart, products } = useApp();
  const [siteFeatures, setSiteFeatures] = useState<ApiSiteFeature[]>([]);
  const [featureCards, setFeatureCards] = useState<ApiFeatureCard[]>([]);
  const [productCategories, setProductCategories] = useState<ApiProductCategory[]>([]);
  const [productTypes, setProductTypes] = useState<ApiProductType[]>([]);
  const get = useSiteContent();
  const [, navigate] = useLocation();

  useEffect(() => {
    api.siteFeatures.list().then(setSiteFeatures).catch(() => {});
    api.featureCards.list().then(cards => setFeatureCards(cards.filter(c => c.isActive))).catch(() => {});
    Promise.all([api.master.listTypes(), api.master.listCategories()]).then(([types, cats]) => {
      const activeTypes = types.filter(t => t.isActive);
      const activeTypeIds = new Set(activeTypes.map(t => t.id));
      setProductTypes(activeTypes);
      setProductCategories(cats.filter(c => c.isActive && activeTypeIds.has(c.typeId)));
    }).catch(() => {});
  }, []);

  const featuredProducts = products.filter(p => p.isFeatured);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts.slice(0, 6) : products.slice(0, 6);

  const marqueeItems: string[] = [];
  const allFeatures = siteFeatures.length > 0
    ? siteFeatures.map(f => f.label)
    : ["18k Gold Plated", "Anti-Tarnish", "Hypoallergenic", "Stainless Steel Base"];
  [...MARQUEE_STATIC, ...allFeatures].forEach((item, i, arr) => {
    marqueeItems.push(item);
    if (i < arr.length - 1) marqueeItems.push("·");
  });
  marqueeItems.push("·");

  const heroImgSrc = get("hero.image_url") || tinyHeartNecklace;

  return (
    <div className="bg-[#faf9f7] min-h-screen text-foreground overflow-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-0 md:h-[95vh] w-full flex items-center justify-center overflow-hidden bg-muted/30">
        <motion.div style={{ y: y1, opacity: opacity1 }} className="absolute inset-0 z-0">
          <img
            src={heroImgSrc}
            alt="Model wearing Ethura jewelry"
            className="w-full h-full object-cover object-top opacity-80 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#faf9f7] via-[#faf9f7]/40 to-transparent" />
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-24 pb-10 md:pt-0 md:pb-0 md:mt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            <span className="text-[#d4a853] tracking-[0.35em] uppercase text-xs mb-6 block font-medium">{get("hero.badge")}</span>
            <h1 className="text-5xl md:text-8xl font-serif text-foreground/70 mb-4 md:mb-6 leading-[1.05]">
              {get("hero.title1")}<br />
              <span className="italic text-primary/90">{get("hero.title2")}</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-4 max-w-md mx-auto font-light leading-relaxed">
              {get("hero.description")}
            </p>
            <p className="text-sm text-[#d4a853] mb-8 font-light italic">
              For the woman who never takes her gold off.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center px-4 sm:px-0">
              <Link href="/shop" className="block w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-[#d4a853] text-[#1a1612] hover:bg-[#1a1612] hover:text-[#f5ede0] transition-all duration-500 rounded-none px-8 md:px-12 py-5 md:py-7 text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em] uppercase font-semibold shadow-lg w-full sm:w-auto"
                  data-testid="button-buy-now-hero"
                >
                  Buy Now — Shop The Collection
                </Button>
              </Link>
              <Link href="/shop" className="block w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-none border-[#1a1612]/30 text-[#1a1612] hover:bg-[#1a1612] hover:text-[#f5ede0] transition-all duration-500 px-8 md:px-12 py-5 md:py-7 text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em] uppercase font-semibold w-full sm:w-auto"
                >
                  {get("hero.cta_primary")} <ArrowRight size={12} className="ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2 hidden md:flex"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-px h-10 bg-foreground/30"
          />
        </motion.div>
      </section>

      {/* ── Animated Marquee ── */}
      <section className="py-5 border-y border-[#e8e2d9] bg-white overflow-hidden">
        <div className="flex">
          <div className="animate-marquee flex flex-shrink-0 gap-0">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className={`whitespace-nowrap text-[10px] uppercase tracking-[0.25em] px-6 ${
                  item === "·" ? "text-[#d4a853]" : "text-[#5a4a3a]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop By Category (jewelry subcategories) ── */}
      {productCategories.length > 0 && (
        <section className="py-10 md:py-20 px-4 bg-[#faf9f7]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-10"
            >
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="h-px w-8 bg-[#d4a853]" />
                <span className="text-[#d4a853] text-[10px] uppercase tracking-[0.3em]">Explore By Style</span>
                <div className="h-px w-8 bg-[#d4a853]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif">Shop By Category</h2>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {productCategories.map((cat, i) => {
                const fallbackProduct = products.find(p =>
                  p.isActive && (
                    p.category.toLowerCase() === cat.slug.toLowerCase() ||
                    p.category.toLowerCase().includes(cat.slug.toLowerCase()) ||
                    cat.slug.toLowerCase().includes(p.category.toLowerCase())
                  )
                );
                const imgSrc = fallbackProduct
                  ? (fallbackProduct.featureImageUrl || resolveImage(fallbackProduct.imageKey, fallbackProduct.imageUrl))
                  : null;

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                  >
                    <button
                      onClick={() => {
                        const type = productTypes.find(t => t.id === cat.typeId);
                        navigate(type ? `/shop?type=${type.slug}&category=${cat.slug}` : `/shop?category=${cat.slug}`);
                      }}
                      className="group w-full text-left"
                    >
                      <div className="relative overflow-hidden aspect-square bg-[#f0ebe3] mb-3 rounded-lg">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={cat.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">
                            {CATEGORY_FALLBACK_ICONS[cat.slug] || "💎"}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300">
                          <span className="text-white text-[10px] uppercase tracking-widest flex items-center gap-1">
                            Shop Now <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                      <h3 className="font-serif text-base md:text-lg text-foreground group-hover:text-[#d4a853] transition-colors duration-300 text-center">
                        {cat.name}
                      </h3>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Product Showcase (The Ethura Edit) ── */}
      <section id="collection" className="py-10 md:py-28 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 md:mb-16 gap-4">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px w-8 bg-[#d4a853]" />
                <span className="text-[#d4a853] text-[10px] uppercase tracking-[0.3em]">{get("collection.label")}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif leading-tight">{get("collection.title")}</h2>
            </div>
            <Link href="/shop" className="group inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
              View all pieces
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-8 md:gap-y-20">
            {displayProducts.map((product, i) => (
              <HomeProductCard key={product.id} product={product} delay={(i % 3) * 0.1 + 0.1} />
            ))}
          </div>

          <div className="mt-10 md:mt-20 text-center">
            <Link href="/shop" className="block sm:inline-block">
              <Button
                variant="outline"
                size="lg"
                className="rounded-none border-[#1a1612] text-[#1a1612] hover:bg-[#1a1612] hover:text-[#f5ede0] transition-all duration-400 px-8 md:px-16 py-5 md:py-7 text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em] uppercase w-full sm:w-auto"
                data-testid="button-view-all"
              >
                Explore the Full Collection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Our Promise (Anti-Tarnish) — moved below The Ethura Edit ── */}
      <section className="py-10 md:py-28 px-4 relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img src={layeredNecklace} alt="Layered gold chain necklace" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-1/2 h-1/2 bg-[#f0ebe3] -z-10" />
            <div className="absolute -top-4 -left-4 md:-left-8 font-serif text-[80px] md:text-[120px] font-bold text-foreground/[0.04] leading-none select-none pointer-events-none">
              01
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.15 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-10 bg-[#d4a853]" />
              <span className="text-[#d4a853] text-[10px] uppercase tracking-[0.3em]">{get("promise.label")}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-[1.1]">
              {get("promise.title").split(" ").slice(0, -1).join(" ")}<br />
              <span className="italic text-primary">{get("promise.title").split(" ").slice(-1)[0]}</span>
            </h2>
            <p className="text-muted-foreground text-base mb-6 leading-relaxed font-light text-justify">{get("promise.para1")}</p>
            <p className="text-muted-foreground text-base mb-10 leading-relaxed font-light text-justify">{get("promise.para2")}</p>

            <div className="grid grid-cols-3 gap-6 mb-10 pt-8 border-t border-[#e8e2d9]">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <p className="font-serif text-2xl text-foreground mb-1">{get(`promise.stat${i}_num`)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{get(`promise.stat${i}_label`)}</p>
                </div>
              ))}
            </div>

            <Link href="/about" className="group inline-flex items-center gap-3 border border-[#1a1612] rounded-none px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-[#1a1612] hover:bg-[#1a1612] hover:text-[#f5ede0] transition-all duration-400" data-testid="link-read-story">
              Read our story
              <span className="w-4 h-px bg-current group-hover:w-7 transition-all duration-300" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Highlights (Feature Cards) ── */}
      {featureCards.length > 0 && (
        <section className="py-10 md:py-24 px-4 bg-[#faf9f7]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-14"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px w-8 bg-[#d4a853]" />
                <span className="text-[#d4a853] text-[10px] uppercase tracking-[0.3em]">Highlights</span>
                <div className="h-px w-8 bg-[#d4a853]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-serif">Why Ethura</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-white border border-border rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow"
                >
                  {card.badge && (
                    <span className="inline-block text-[9px] bg-[#d4a853]/15 text-[#b8903f] px-2.5 py-1 rounded font-semibold uppercase tracking-widest mb-4">
                      {card.badge}
                    </span>
                  )}
                  {card.subtitle && (
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#d4a853] mb-2">{card.subtitle}</p>
                  )}
                  <h3 className="font-serif text-xl text-foreground mb-3 leading-snug">{card.title}</h3>
                  {card.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed font-light">{card.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Lookbook ── */}
      <section className="py-10 md:py-20 px-4 md:px-8 overflow-hidden bg-[#faf9f7]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-5 mb-12"
          >
            <div className="h-px flex-1 bg-[#e8e2d9]" />
            <div className="text-center shrink-0">
              <p className="text-[#d4a853] text-[9px] uppercase tracking-[0.4em] mb-1">{get("lookbook.label")}</p>
              <h2 className="font-serif text-2xl md:text-3xl">{get("lookbook.title")}</h2>
            </div>
            <div className="h-px flex-1 bg-[#e8e2d9]" />
          </motion.div>

          <div className="hidden md:flex gap-4 items-start">
            <div className="flex-1 flex flex-col gap-4">
              <GalleryImg src={crystalHeartEarring} alt="Crystal heart earring" h="h-96" delay={0} />
              <GalleryQuote quote={get("lookbook.quote1")} delay={0.1} h="h-44" />
              <GalleryImg src={bowCharmNecklace} alt="Bow charm necklace" h="h-72" delay={0.15} />
            </div>
            <div className="flex-1 flex flex-col gap-4 mt-16">
              <GalleryImg src={layeredNecklace} alt="Layered gold necklace" h="h-72" delay={0.05} />
              <GalleryImg src={teardropStuds} alt="Gold teardrop studs" h="h-80" delay={0.2} />
              <GalleryQuote quote={get("lookbook.quote2")} delay={0.25} h="h-36" large />
            </div>
            <div className="flex-1 flex flex-col gap-4 mt-8">
              <GalleryQuote quote={get("lookbook.quote3")} delay={0.08} h="h-40" />
              <GalleryImg src={pearlDropEarrings} alt="Pearl drop earrings" h="h-72" delay={0.18} />
              <GalleryImg src={snakeRing} alt="Serpentine ring" h="h-64" delay={0.28} />
              <GalleryQuote quote={get("lookbook.quote4")} delay={0.35} h="h-36" />
            </div>
          </div>

          <div className="flex md:hidden gap-2.5 items-start">
            <div className="flex-1 flex flex-col gap-2.5">
              <GalleryImg src={crystalHeartEarring} alt="Crystal heart earring" h="h-52" delay={0} />
              <GalleryQuote quote={get("lookbook.quote1")} delay={0.1} h="h-32" />
              <GalleryImg src={layeredNecklace} alt="Layered gold necklace" h="h-44" delay={0.15} />
              <GalleryQuote quote={get("lookbook.quote4")} delay={0.35} h="h-28" />
              <GalleryImg src={snakeRing} alt="Serpentine ring" h="h-40" delay={0.28} />
            </div>
            <div className="flex-1 flex flex-col gap-2.5 mt-8">
              <GalleryQuote quote={get("lookbook.quote3")} delay={0.08} h="h-28" />
              <GalleryImg src={bowCharmNecklace} alt="Bow charm necklace" h="h-44" delay={0.05} />
              <GalleryImg src={teardropStuds} alt="Gold teardrop studs" h="h-52" delay={0.2} />
              <GalleryQuote quote={get("lookbook.quote2")} delay={0.25} h="h-28" large />
              <GalleryImg src={pearlDropEarrings} alt="Pearl drop earrings" h="h-44" delay={0.18} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Vault ── */}
      <section className="relative py-14 md:py-28 px-4" style={{ backgroundColor: "#1a1612" }}>
        <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-[#d4a853]/30 pointer-events-none" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-[#d4a853]/30 pointer-events-none" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-[#d4a853]/30 pointer-events-none" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-[#d4a853]/30 pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-10 bg-[#d4a853]/50" />
              <span className="text-[#d4a853]/80 tracking-[0.3em] uppercase text-[10px]">{get("vault.label")}</span>
              <div className="h-px w-10 bg-[#d4a853]/50" />
            </div>
            <h2 className="text-4xl md:text-6xl font-serif text-[#f5ede0] mb-6 leading-tight">
              {get("vault.title").replace(".", "")} <span className="italic text-[#d4a853]">Open.</span>
            </h2>
            <p className="text-[#9a8a76] mb-12 font-light leading-relaxed max-w-md mx-auto text-sm">
              {get("vault.description")}
            </p>
            <Link href="/shop">
              <button
                className="group inline-flex items-center gap-4 border border-[#d4a853]/40 hover:border-[#d4a853] text-[#f5ede0] hover:text-[#d4a853] transition-all duration-400 px-12 py-4 text-xs tracking-[0.2em] uppercase"
                data-testid="button-vault"
              >
                {get("vault.cta")}
                <span className="w-4 h-px bg-current group-hover:w-8 transition-all duration-300" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function HomeProductCard({ product, delay }: { product: import("@/lib/api").ApiProduct; delay: number }) {
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const [, navigate] = useLocation();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay }}
      className="group cursor-pointer"
      data-testid={`home-product-${product.id}`}
    >
      <div
        className="relative overflow-hidden mb-5 aspect-[5/4] bg-[#f5f3ef] cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img
          src={product.featureImageUrl || resolveImage(product.imageKey, product.imageUrl)}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#1a1612] text-[#f5ede0] text-[9px] uppercase tracking-widest px-2.5 py-1">
            {product.badge}
          </span>
        )}

        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <div
            className="absolute top-[22px] -right-[32px] rotate-45 z-20 pointer-events-none flex items-center justify-center"
            style={{ width: "130px", background: "#e8303a", padding: "9px 0", boxShadow: "0 3px 12px rgba(232,48,58,0.55)" }}
          >
            <span className="text-white font-extrabold text-[12px] uppercase tracking-widest leading-none">
              -{Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
            </span>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 ${
            wishlist.includes(product.id) ? "bg-white/90 opacity-100" : "bg-white/70 md:opacity-0 md:group-hover:opacity-100"
          }`}
          data-testid={`home-wishlist-${product.id}`}
        >
          <Heart size={13} strokeWidth={1.5} className={wishlist.includes(product.id) ? "fill-[#d4a853] text-[#d4a853]" : "text-[#1a1612]"} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleAdd}
            className="w-full bg-[#1a1612] text-[#f5ede0] hover:bg-[#d4a853] hover:text-[#1a1612] py-4 text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-2.5 transition-colors duration-200 font-medium"
            data-testid={`home-quick-add-${product.id}`}
          >
            {added ? <><Check size={13} /> Added to Bag</> : <><ShoppingBag size={13} strokeWidth={1.5} /> Quick Add</>}
          </button>
        </div>
      </div>
      <div className="flex justify-between items-start">
        <div className="min-w-0 pr-2">
          <h3
            onClick={() => navigate(`/product/${product.id}`)}
            className="font-serif text-base text-foreground group-hover:text-[#d4a853] transition-colors duration-300 truncate"
          >
            {product.name}
          </h3>
          <p className="text-muted-foreground text-[10px] mt-1 uppercase tracking-wider">18k Gold Plated</p>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 gap-1">
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <>
              <span className="text-[11px] line-through text-muted-foreground/50 font-normal tracking-wide">{inr(product.compareAtPrice)}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#d4a853] font-bold text-sm tracking-wide">{inr(product.price)}</span>
                <span className="text-[8px] bg-[#e8303a] text-white font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-sm">
                  Sale
                </span>
              </div>
            </>
          ) : (
            <span className="text-foreground font-medium text-sm">{inr(product.price)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GalleryImg({ src, alt, h, delay }: { src: string; alt: string; h: string; delay: number }) {
  return (
    <motion.div
      className={`group overflow-hidden ${h} w-full`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
      />
    </motion.div>
  );
}

function GalleryQuote({ quote, delay, h, large }: { quote: string; delay: number; h: string; large?: boolean }) {
  return (
    <motion.div
      className={`${h} w-full flex flex-col justify-center px-3 md:px-7 py-3 md:py-4 bg-white border border-[#e8e2d9]`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay }}
    >
      <div className="w-5 md:w-6 h-px bg-[#d4a853] mb-2 md:mb-4" />
      <p className={`font-serif italic leading-snug text-[#1a1612]/80 ${large ? "text-base md:text-2xl" : "text-sm md:text-lg"}`}>
        "{quote}"
      </p>
      <p className="text-[8px] uppercase tracking-[0.3em] text-[#d4a853] mt-2 md:mt-3">— Ethura</p>
    </motion.div>
  );
}
