import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ChevronDown, SlidersHorizontal, X, Check, Gift, Sparkles, Search, Star, Filter } from "lucide-react";
import { inr } from "@/data/products";
import { resolveImage } from "@/data/imageMap";
import { useApp } from "@/context/AppContext";
import type { ApiProduct, ApiProductType, ApiProductCategory } from "@/lib/api";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";
const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Featured",           value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "New Arrivals",       value: "newest" },
];

const DEFAULT_PRICE_MIN = 0;
const DEFAULT_PRICE_MAX = 5000;

interface Toast { id: number; name: string; image: string }

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-4 md:right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.92 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{ opacity: 0, x: 80,  scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto flex items-center gap-3 bg-[#1a1612] text-[#f5ede0] pl-2 pr-4 py-2 shadow-2xl min-w-[240px] max-w-[300px]"
          >
            <div className="w-11 h-11 flex-shrink-0 overflow-hidden">
              <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-[#d4a853] mb-0.5">Added to bag</p>
              <p className="text-sm font-serif truncate">{t.name}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-[#8a7a68] hover:text-[#f5ede0] transition-colors flex-shrink-0 ml-1"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function Shop() {
  const { addToCart, toggleWishlist, wishlist, products, productsLoading } = useApp();
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [location, navigate] = useLocation();

  // ─── Dynamic types & categories ───
  const [productTypes, setProductTypes] = useState<ApiProductType[]>([]);
  const [productCategories, setProductCategories] = useState<ApiProductCategory[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ─── Search ───
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Price Filter ───
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priceMin, setPriceMin] = useState(DEFAULT_PRICE_MIN);
  const [priceMax, setPriceMax] = useState(DEFAULT_PRICE_MAX);
  const isPriceFiltered = priceMin > DEFAULT_PRICE_MIN || priceMax < DEFAULT_PRICE_MAX;
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.master.listTypes(),
      api.master.listCategories(),
    ]).then(([types, cats]) => {
      const active = types.filter(t => t.isActive);
      setProductTypes(active);
      setProductCategories(cats);
      if (active.length > 0 && !selectedTypeId) {
        const params = new URLSearchParams(window.location.search);
        const typeSlug = params.get("type");
        const cat = params.get("category");
        if (typeSlug) {
          const found = active.find(t => t.slug === typeSlug);
          if (found) {
            setSelectedTypeId(found.id);
            setActiveCategory(cat || "all");
            return;
          }
        }
        if (cat) {
          const matchingCat = cats.find(c => c.slug === cat);
          if (matchingCat) {
            const ownerType = active.find(t => t.id === matchingCat.typeId);
            if (ownerType) {
              setSelectedTypeId(ownerType.id);
              setActiveCategory(cat);
              return;
            }
          }
        }
        setSelectedTypeId(active[0].id);
      }
    }).catch(() => {});
  }, []);

  // categories visible for the selected type
  const visibleCategories = useMemo(() => {
    if (!selectedTypeId) return [];
    return productCategories.filter(c => c.typeId === selectedTypeId && c.isActive);
  }, [selectedTypeId, productCategories]);

  useEffect(() => {
    if (productTypes.length === 0) return;
    const params = new URLSearchParams(location.split("?")[1] || "");
    const typeSlug = params.get("type");
    const cat = params.get("category");
    if (typeSlug) {
      const found = productTypes.find(t => t.slug === typeSlug);
      if (found) {
        setSelectedTypeId(found.id);
        setActiveCategory(cat || "all");
      }
    } else if (cat) {
      const matchingCat = productCategories.find(c => c.slug === cat);
      if (matchingCat) {
        const ownerType = productTypes.find(t => t.id === matchingCat.typeId);
        if (ownerType) {
          setSelectedTypeId(ownerType.id);
          setActiveCategory(cat);
          return;
        }
      }
      setActiveCategory(cat);
    }
  }, [location, productTypes, productCategories]);


  const filtered = useMemo(() => {
    let r: ApiProduct[] = products;

    // Search filter (across all types when active)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    } else {
      // Filter by type: only show products whose category slug matches any active category in the selected type
      if (selectedTypeId) {
        const typeSlugSet = new Set(
          productCategories.filter(c => c.typeId === selectedTypeId && c.isActive).map(c => c.slug)
        );
        if (typeSlugSet.size > 0) {
          r = r.filter(p => typeSlugSet.has(p.category));
        }
      }
    }

    // Price range filter
    r = r.filter(p => p.price >= priceMin && p.price <= priceMax);

    // Filter by category within the type
    if (activeCategory !== "all") {
      r = r.filter(p => p.category === activeCategory);
    }

    if (sortBy === "price-asc")  return [...r].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") return [...r].sort((a, b) => b.price - a.price);
    if (sortBy === "newest")     return [...r].sort((a, b) => b.id - a.id);
    // "featured" default: first 6 featured (newest first), then rest newest first
    const featured = [...r].filter(p => p.isFeatured).sort((a, b) => b.id - a.id).slice(0, 6);
    const featuredIds = new Set(featured.map(p => p.id));
    const rest = [...r].filter(p => !featuredIds.has(p.id)).sort((a, b) => b.id - a.id);
    return [...featured, ...rest];
  }, [activeCategory, selectedTypeId, sortBy, products, productCategories, searchQuery, priceMin, priceMax]);

  type GridItem =
    | { type: "product"; product: ApiProduct; idx: number }
    | { type: "ribbon" };

  const gridItems = useMemo((): GridItem[] => {
    const items: GridItem[] = filtered.map((product, idx) => ({ type: "product", product, idx }));
    if (items.length >= 9) items.splice(8, 0, { type: "ribbon" });
    return items;
  }, [filtered]);

  const handleAddToCart = (product: ApiProduct) => {
    addToCart(product);
    const id = Date.now();
    setToasts(prev => [...prev, { id, name: product.name, image: product.featureImageUrl || resolveImage(product.imageKey, product.imageUrl) }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const currentSortLabel = sortOptions.find(s => s.value === sortBy)?.label || "Featured";
  const selectedType = productTypes.find(t => t.id === selectedTypeId);

  return (
    <div className="min-h-screen text-foreground" style={{ background: "#faf9f7" }} onClick={() => { sortOpen && setSortOpen(false); searchOpen && !searchQuery && setSearchOpen(false); }}>
      <Navbar />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Page Header */}
      <div className="pt-24 md:pt-28 pb-4 md:pb-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center">
          <span className="text-[6rem] md:text-[16rem] font-serif font-bold text-foreground/[0.03] leading-none tracking-tighter select-none">
            ETHURA
          </span>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative">
          <p className="text-[#d4a853] tracking-[0.3em] uppercase text-[10px] mb-4 font-medium">Ethura Collection</p>
          <h1 className="text-5xl md:text-7xl font-serif text-foreground mb-4 leading-none">The Boutique</h1>
          <p className="text-muted-foreground font-light text-sm max-w-xs mx-auto leading-relaxed">
            18k gold-plated. Tarnish-resistant. Crafted to last.
          </p>
        </motion.div>
      </div>

      {/* ─── Mobile Filter Drawer (right slide) ─── */}
      <AnimatePresence>
        {filterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#1a1612]/50 z-50 md:hidden"
              onClick={() => setFilterDrawerOpen(false)}
            />
            <motion.div
              ref={drawerRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 w-[88vw] max-w-[340px] bg-[#faf9f7] z-50 flex flex-col shadow-2xl md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-[#e8e2d9]">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-[#d4a853]" />
                  <span className="font-serif text-lg text-[#1a1612]">Filters</span>
                  {(isPriceFiltered || activeCategory !== "all") && (
                    <span className="w-5 h-5 rounded-full bg-[#d4a853] text-[#1a1612] text-[10px] font-bold flex items-center justify-center">
                      {(isPriceFiltered ? 1 : 0) + (activeCategory !== "all" ? 1 : 0)}
                    </span>
                  )}
                </div>
                <button onClick={() => setFilterDrawerOpen(false)} className="p-2 rounded-full hover:bg-[#e8e2d9] transition-colors">
                  <X size={18} className="text-[#1a1612]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

                {/* Type */}
                {productTypes.length > 1 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4a853] font-semibold mb-3">Collection</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => { setSelectedTypeId(null); setActiveCategory("all"); }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                          selectedTypeId === null ? "bg-[#d4a853] text-[#1a1612] border-[#d4a853]" : "bg-white border-[#e0d8cc] text-foreground"
                        }`}
                      >
                        All Collections
                        {selectedTypeId === null && <Check size={14} className="text-[#1a1612]" />}
                      </button>
                      {productTypes.map(type => (
                        <button
                          key={type.id}
                          onClick={() => { setSelectedTypeId(type.id); setActiveCategory("all"); }}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                            selectedTypeId === type.id ? "bg-[#d4a853] text-[#1a1612] border-[#d4a853]" : "bg-white border-[#e0d8cc] text-foreground"
                          }`}
                        >
                          {type.name}
                          {selectedTypeId === type.id && <Check size={14} className="text-[#1a1612]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category */}
                {selectedTypeId !== null && visibleCategories.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4a853] font-semibold mb-3">Category</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveCategory("all")}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                          activeCategory === "all" ? "bg-[#d4a853] text-[#1a1612] border-[#d4a853]" : "bg-white border-[#e0d8cc] text-foreground"
                        }`}
                      >
                        All {selectedType?.name ?? "Jewellery"}
                        {activeCategory === "all" && <Check size={14} className="text-[#1a1612]" />}
                      </button>
                      {visibleCategories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.slug)}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                            activeCategory === cat.slug ? "bg-[#d4a853] text-[#1a1612] border-[#d4a853]" : "bg-white border-[#e0d8cc] text-foreground"
                          }`}
                        >
                          {cat.name}
                          {activeCategory === cat.slug && <Check size={14} className="text-[#1a1612]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4a853] font-semibold mb-3">Price Range</p>
                  <div className="bg-white border border-[#e0d8cc] rounded-xl p-4">
                    <div className="flex justify-between text-sm font-semibold text-[#1a1612] mb-4">
                      <span>₹{priceMin.toLocaleString()}</span>
                      <span>₹{priceMax.toLocaleString()}</span>
                    </div>
                    <div className="relative h-2 bg-[#e8e2d9] rounded-full mb-4">
                      <div
                        className="absolute h-2 bg-[#d4a853] rounded-full"
                        style={{ left: `${(priceMin / DEFAULT_PRICE_MAX) * 100}%`, right: `${100 - (priceMax / DEFAULT_PRICE_MAX) * 100}%` }}
                      />
                      <input type="range" min={0} max={DEFAULT_PRICE_MAX} step={100} value={priceMin}
                        onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax - 100))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" style={{ zIndex: priceMin > DEFAULT_PRICE_MAX - 100 ? 5 : 3 }} />
                      <input type="range" min={0} max={DEFAULT_PRICE_MAX} step={100} value={priceMax}
                        onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin + 100))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" style={{ zIndex: 4 }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-[#e0d8cc] rounded-lg px-3 py-2.5 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">Min ₹</span>
                        <input type="number" min={0} max={priceMax - 100} step={100} value={priceMin}
                          onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax - 100))}
                          className="flex-1 text-sm outline-none bg-transparent font-medium min-w-0" />
                      </div>
                      <div className="border border-[#e0d8cc] rounded-lg px-3 py-2.5 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">Max ₹</span>
                        <input type="number" min={priceMin + 100} max={DEFAULT_PRICE_MAX} step={100} value={priceMax}
                          onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin + 100))}
                          className="flex-1 text-sm outline-none bg-transparent font-medium min-w-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4a853] font-semibold mb-3">Sort By</p>
                  <div className="space-y-2">
                    {sortOptions.map(opt => (
                      <button key={opt.value} onClick={() => setSortBy(opt.value)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                          sortBy === opt.value ? "bg-[#d4a853] text-[#1a1612] border-[#d4a853]" : "bg-white border-[#e0d8cc] text-foreground"
                        }`}>
                        {opt.label}
                        {sortBy === opt.value && <Check size={14} className="text-[#1a1612]" />}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Drawer footer */}
              <div className="px-5 py-4 border-t border-[#e8e2d9] flex gap-3">
                <button
                  onClick={() => { setPriceMin(DEFAULT_PRICE_MIN); setPriceMax(DEFAULT_PRICE_MAX); setActiveCategory("all"); setSelectedTypeId(productTypes[0]?.id ?? null); setSortBy("featured"); }}
                  className="flex-1 py-3.5 rounded-xl border border-[#e0d8cc] text-sm font-medium text-muted-foreground hover:border-[#d4a853] transition-all"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="flex-1 py-3.5 rounded-xl bg-[#d4a853] text-[#1a1612] text-sm font-semibold hover:bg-[#c49840] transition-all"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Filter Bar ─── */}
      <div className="sticky top-[65px] z-30 bg-[#faf9f7]/98 backdrop-blur-md border-b border-[#e8e2d9] shadow-[0_2px_16px_0_rgba(26,22,18,0.04)]">
        <div className="max-w-7xl mx-auto px-4">

          {/* ── MOBILE: Type pills + Subcategory dropdown + Search + Filter ── */}
          <div className="md:hidden py-2 space-y-2">
            {productTypes.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                {productTypes.map(type => (
                  <button key={type.id}
                    onClick={() => { setSelectedTypeId(type.id); setActiveCategory("all"); }}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap transition-all ${
                      selectedTypeId === type.id ? "bg-[#d4a853] text-[#1a1612] shadow-sm" : "bg-white border border-[#e0d8cc] text-muted-foreground"
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              {selectedTypeId !== null && visibleCategories.length > 0 && (
                <div className="relative flex-shrink-0">
                  <select
                    value={activeCategory}
                    onChange={e => setActiveCategory(e.target.value)}
                    className="appearance-none h-10 pl-3 pr-8 bg-white border border-[#e0d8cc] rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-[#d4a853] cursor-pointer"
                  >
                    <option value="all">All {selectedType?.name ?? "Items"}</option>
                    {visibleCategories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              )}
              <div className="flex items-center gap-2 bg-white border border-[#e0d8cc] rounded-xl px-3 h-10 flex-1 min-w-0">
                <Search size={14} className="text-muted-foreground flex-shrink-0" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground/50 min-w-0" />
                {searchQuery && <button onClick={() => setSearchQuery("")}><X size={13} className="text-muted-foreground" /></button>}
              </div>
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
                  isPriceFiltered || sortBy !== "featured"
                    ? "bg-[#d4a853] text-[#1a1612] border-[#d4a853]"
                    : "bg-white border-[#e0d8cc] text-foreground"
                }`}
              >
                <Filter size={16} />
              </button>
            </div>
          </div>

          {/* ── DESKTOP Row 1: Product Type pills — only shown when 2+ types exist ── */}
          {productTypes.length > 1 && (
            <div className="hidden md:flex items-center gap-1.5 pt-3 pb-2 overflow-x-auto scrollbar-none border-b border-[#e8e2d9]/50">
              <button
                onClick={() => { setSelectedTypeId(null); setActiveCategory("all"); }}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedTypeId === null ? "bg-[#d4a853] text-[#1a1612] shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-[#d4a853]/10"
                }`}
              >
                All {selectedTypeId === null && <span className="w-1 h-1 rounded-full bg-[#1a1612] flex-shrink-0" />}
              </button>
              {productTypes.map(type => (
                <button key={type.id}
                  onClick={() => { setSelectedTypeId(type.id); setActiveCategory("all"); }}
                  className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedTypeId === type.id ? "bg-[#d4a853] text-[#1a1612] shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-[#d4a853]/10"
                  }`}
                >
                  {type.name} {selectedTypeId === type.id && <span className="w-1 h-1 rounded-full bg-[#1a1612] flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* ── DESKTOP Row 2: Category underline tabs + search/sort/filter ── */}
          <div className="hidden md:flex items-stretch justify-between gap-4">
            <div className="flex items-stretch gap-0 overflow-x-auto scrollbar-none flex-1 min-w-0">
              {selectedTypeId !== null ? (
                <>
                  <button onClick={() => setActiveCategory("all")}
                    className={`px-4 md:px-5 py-3.5 text-[10px] uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-b-2 flex-shrink-0 ${
                      activeCategory === "all" ? "border-[#d4a853] text-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}>
                    All {selectedType?.name ?? "Jewellery"}
                  </button>
                  {visibleCategories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.slug)} data-testid={`filter-${cat.slug}`}
                      className={`px-4 md:px-5 py-3.5 text-[10px] uppercase tracking-widest whitespace-nowrap transition-all duration-200 border-b-2 flex-shrink-0 ${
                        activeCategory === cat.slug ? "border-[#d4a853] text-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}>
                      {cat.name}
                    </button>
                  ))}
                </>
              ) : (
                <div className="flex items-center py-3.5">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">All Collections</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 py-2">
              <span className="text-[10px] text-muted-foreground/70 tabular-nums hidden md:block whitespace-nowrap">
                {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              </span>
              <div className="flex items-center gap-1 bg-white border border-[#e0d8cc] rounded-full px-3 h-8" onClick={e => e.stopPropagation()}>
                <Search size={11} className="text-muted-foreground flex-shrink-0" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-24 sm:w-32 text-[11px] outline-none bg-transparent text-foreground placeholder:text-muted-foreground/50" />
                {searchQuery && <button onClick={() => setSearchQuery("")}><X size={11} className="text-muted-foreground" /></button>}
              </div>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setFilterPanelOpen(v => !v)}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[10px] uppercase tracking-widest transition-all border ${
                    filterPanelOpen || isPriceFiltered ? "bg-[#d4a853] text-[#1a1612] border-[#d4a853] font-semibold" : "bg-white border-[#e0d8cc] text-muted-foreground hover:text-foreground"
                  }`}>
                  <SlidersHorizontal size={11} />
                  <span className="hidden sm:block">Price</span>
                  {isPriceFiltered && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </button>
              </div>
              <div className="w-px h-4 bg-[#e0d8cc]" />
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  data-testid="sort-btn">
                  <ChevronDown size={11} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
                  <span className="hidden sm:block">{currentSortLabel}</span>
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white border border-[#e8e2d9] shadow-2xl z-40 min-w-[190px] rounded-xl overflow-hidden">
                      {sortOptions.map(opt => (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-[11px] tracking-wide transition-colors flex items-center justify-between ${
                            sortBy === opt.value ? "text-[#d4a853] bg-[#faf9f7] font-semibold" : "text-foreground hover:bg-[#faf9f7]"
                          }`} data-testid={`sort-${opt.value}`}>
                          {opt.label}
                          {sortBy === opt.value && <Check size={11} className="text-[#d4a853]" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── DESKTOP Price Range Panel ── */}
          <AnimatePresence>
            {filterPanelOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden hidden md:block">
                <div className="py-4 px-2 border-t border-[#e8e2d9]/60">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">
                        <span>Price Range</span>
                        <span className="font-semibold text-[#d4a853]">₹{priceMin.toLocaleString()} – ₹{priceMax.toLocaleString()}</span>
                      </div>
                      <div className="relative h-2 bg-[#e8e2d9] rounded-full">
                        <div className="absolute h-2 bg-[#d4a853] rounded-full"
                          style={{ left: `${(priceMin / DEFAULT_PRICE_MAX) * 100}%`, right: `${100 - (priceMax / DEFAULT_PRICE_MAX) * 100}%` }} />
                        <input type="range" min={0} max={DEFAULT_PRICE_MAX} step={100} value={priceMin}
                          onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax - 100))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" style={{ zIndex: priceMin > DEFAULT_PRICE_MAX - 100 ? 5 : 3 }} />
                        <input type="range" min={0} max={DEFAULT_PRICE_MAX} step={100} value={priceMax}
                          onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin + 100))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" style={{ zIndex: 4 }} />
                      </div>
                      <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/60"><span>₹0</span><span>₹5,000+</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 border border-[#e0d8cc] rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-muted-foreground">Min ₹</span>
                        <input type="number" min={0} max={priceMax - 100} step={100} value={priceMin}
                          onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax - 100))}
                          className="w-16 text-[11px] outline-none bg-transparent font-medium" />
                      </div>
                      <div className="flex items-center gap-1.5 border border-[#e0d8cc] rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-muted-foreground">Max ₹</span>
                        <input type="number" min={priceMin + 100} max={DEFAULT_PRICE_MAX} step={100} value={priceMax}
                          onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin + 100))}
                          className="w-16 text-[11px] outline-none bg-transparent font-medium" />
                      </div>
                      {isPriceFiltered && (
                        <button onClick={() => { setPriceMin(DEFAULT_PRICE_MIN); setPriceMax(DEFAULT_PRICE_MAX); }}
                          className="text-[10px] text-[#d4a853] hover:text-[#b8903f] uppercase tracking-widest underline underline-offset-2">Reset</button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Category Banner */}
      <AnimatePresence mode="wait">
        {activeCategory !== "all" && (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="border-b border-[#e8e2d9] bg-[#f5ede0]/50"
          >
            <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-3">
              <div className="w-5 h-px bg-[#d4a853]" />
              <p className="font-serif italic text-lg text-[#1a1612]">
                {visibleCategories.find(c => c.slug === activeCategory)?.name ?? activeCategory}
              </p>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-2">
                — {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {activeCategory !== "all" && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Showing {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            </p>
            <button
              onClick={() => setActiveCategory("all")}
              className="text-[10px] text-muted-foreground hover:text-[#d4a853] transition-colors uppercase tracking-widest flex items-center gap-1"
              data-testid="clear-filter"
            >
              Clear <X size={10} />
            </button>
          </div>
        )}

        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-14">
          <AnimatePresence mode="popLayout">
            {gridItems.map((item) => {
              if (item.type === "ribbon") {
                return (
                  <motion.div
                    key="ribbon"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="col-span-2 md:col-span-3 xl:col-span-4 my-2"
                  >
                    <div className="relative overflow-hidden border border-[#e8e2d9] bg-[#f5ede0]/60 px-8 md:px-16 py-10 md:py-12 flex flex-col md:flex-row items-center gap-6 md:gap-12">
                      <div className="flex-shrink-0 text-center md:text-left">
                        <div className="w-8 h-px bg-[#d4a853] mx-auto md:mx-0 mb-4" />
                        <p className="font-serif italic text-2xl md:text-3xl text-[#1a1612] leading-snug max-w-xs">
                          "Gold that stays gold — through every workout, every shower, every season."
                        </p>
                        <p className="text-[9px] uppercase tracking-[0.3em] text-[#d4a853] mt-4">— The Ethura Anti-Tarnish Promise</p>
                      </div>
                      <div className="hidden md:block w-px self-stretch bg-[#e8e2d9] mx-4" />
                      <div className="flex flex-col gap-3 text-sm text-muted-foreground font-light">
                        {[
                          "100% anti-tarnish coating on every piece",
                          "Hypoallergenic — safe for sensitive skin",
                          "18k gold-plated, anti-tarnish sealed — every single piece",
                          "Free shipping on orders above ₹2,000",
                        ].map(line => (
                          <div key={line} className="flex items-start gap-3">
                            <Sparkles size={12} className="text-[#d4a853] flex-shrink-0 mt-0.5" />
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              const { product, idx } = item;
              return (
                <motion.article
                  key={`${product.id}-${sortBy}`}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                  className="group"
                  data-testid={`product-card-${product.id}`}
                >
                  {/* Image container */}
                  <div
                    className="relative overflow-hidden mb-3 md:mb-4 aspect-[4/5] bg-white cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.featureImageUrl || resolveImage(product.imageKey, product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                    />

                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-[#1a1612] text-[#f5ede0] text-[9px] uppercase tracking-widest px-2.5 py-1">
                        {product.badge}
                      </span>
                    )}

                    {/* Low stock badge */}
                    {product.stock && product.stock <= 4 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`absolute ${product.badge ? "top-9" : "top-2.5"} left-2.5 text-[9px] uppercase tracking-widest px-2.5 py-1 font-medium`}
                        style={{ background: "#f5ede0", color: "#d4a853", border: "1px solid #d4a853" }}
                      >
                        Only {product.stock} left
                      </motion.span>
                    )}

                    {/* Discount ribbon — top-right diagonal */}
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

                    {/* Wishlist */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      className={`absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 ${
                        wishlist.includes(product.id)
                          ? "bg-white/90"
                          : "bg-white/70 md:opacity-0 md:group-hover:opacity-100"
                      }`}
                      data-testid={`wishlist-${product.id}`}
                      title="Add to wishlist"
                    >
                      <Heart
                        size={13}
                        strokeWidth={1.5}
                        className={wishlist.includes(product.id) ? "fill-[#d4a853] text-[#d4a853]" : "text-[#1a1612]"}
                      />
                    </button>

                    {/* Add to Bag — slides up on hover */}
                    <div className="absolute bottom-0 left-0 right-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 ease-out">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        className="w-full bg-[#1a1612]/90 backdrop-blur-sm text-[#f5ede0] hover:bg-[#d4a853] hover:text-[#1a1612] py-3 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors duration-200"
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        <ShoppingBag size={12} strokeWidth={1.5} />
                        Add to Bag
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="font-serif text-sm md:text-base text-foreground leading-snug truncate group-hover:text-[#d4a853] transition-colors duration-300 cursor-pointer"
                      >
                        {product.name}
                      </h3>
                      {/* Star rating */}
                      {product.avgRating && product.avgRating > 0 ? (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={10}
                                className={s <= Math.round(product.avgRating!) ? "fill-[#d4a853] text-[#d4a853]" : "text-[#d4a853]/25"}
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">{product.avgRating.toFixed(1)}</span>
                          <span className="text-[9px] text-muted-foreground/60">({product.reviewCount})</span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-[10px] mt-1 capitalize tracking-wide">
                          {product.category}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 mt-0.5 gap-1">
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
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-28">
            <p className="font-serif text-3xl text-foreground/30 mb-3">Nothing here yet</p>
            <p className="text-sm text-muted-foreground font-light">Check back soon for new arrivals.</p>
          </div>
        )}
      </div>

      {/* Bottom gifting banner */}
      <div className="border-t border-[#e8e2d9] bg-[#1a1612] text-[#f5ede0]">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="font-serif text-xl md:text-2xl mb-2">Gifting someone special?</p>
            <p className="text-sm text-[#f5ede0]/60 font-light leading-relaxed max-w-md">
              Every Ethura piece arrives in a signature ivory &amp; gold gift box — ready to be given, always ready to be worn.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-[#d4a853] text-[10px] uppercase tracking-widest">
              <Gift size={14} />
              Complimentary gift wrapping
            </div>
            <div className="hidden sm:block w-px h-8 bg-[#f5ede0]/20" />
            <div className="flex items-center gap-2 text-[#d4a853] text-[10px] uppercase tracking-widest">
              <Sparkles size={14} />
              Personal message card included
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
