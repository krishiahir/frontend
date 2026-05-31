import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, User, Heart, Menu, X, LogOut, ChevronDown, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SITE_CONTENT_DEFAULTS } from "@/lib/siteContent";
import { api, ApiProductType, ApiProductCategory, ApiProduct } from "@/lib/api";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [types, setTypes] = useState<ApiProductType[]>([]);
  const [categories, setCategories] = useState<ApiProductCategory[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState(64);
  const { cartCount, wishlist, user, logout, reelsEnabled, siteContent } = useApp();
  const brandName = siteContent["header.brand_name"] || "ETHURA";
  const announcementEnabled = (siteContent["header.announcement_enabled"] ?? SITE_CONTENT_DEFAULTS["header.announcement_enabled"]) === "true";
  const announcementText = siteContent["header.announcement"] || SITE_CONTENT_DEFAULTS["header.announcement"];
  const [location, navigate] = useLocation();

  useEffect(() => {
    Promise.allSettled([api.master.listTypes(), api.master.listCategories(), api.products.list()]).then(([tRes, cRes, pRes]) => {
      if (tRes.status === "fulfilled") setTypes(tRes.value.filter(x => x.isActive));
      if (cRes.status === "fulfilled") setCategories(cRes.value.filter(x => x.isActive));
      if (pRes.status === "fulfilled") setProducts(pRes.value.filter(x => x.isActive));
    });
  }, []);

  const navLinks: { label: string; href: string; enabled: boolean }[] = (() => {
    try {
      const raw = siteContent["header.nav_links"] ?? SITE_CONTENT_DEFAULTS["header.nav_links"];
      if (!raw) return [];
      return JSON.parse(raw).filter((l: { enabled: boolean }) => l.enabled !== false);
    } catch { return []; }
  })();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setNavHeight(e.contentRect.height);
    });
    ro.observe(navRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const isHome = location === "/";
  const isTransparent = isHome && !isScrolled;

  const linkClass = isTransparent
    ? "text-white/90 hover:text-[#d4a853] transition-colors"
    : "text-foreground hover:text-primary transition-colors";

  const iconClass = isTransparent
    ? "text-white/90 hover:text-[#d4a853] transition-colors"
    : "text-foreground hover:text-primary transition-colors";

  function handleLogout() {
    logout();
    setProfileOpen(false);
    navigate("/");
  }

  const firstName = user?.name?.split(" ")[0] ?? "";

  const searchMatches = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: { kind: "category" | "product"; label: string; subtitle?: string; typeSlug: string; catSlug?: string; typeName: string; productId?: number }[] = [];
    for (const type of types) {
      if (type.name.toLowerCase().includes(q)) {
        results.push({ kind: "category", label: type.name, typeSlug: type.slug, typeName: type.name });
      }
      const typeCats = categories.filter(c => c.typeId === type.id);
      for (const cat of typeCats) {
        if (cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q)) {
          results.push({ kind: "category", label: cat.name, typeSlug: type.slug, catSlug: cat.slug, typeName: type.name });
        }
      }
    }
    for (const p of products) {
      const nameMatch = p.name.toLowerCase().includes(q);
      const catMatch = p.category && p.category.toLowerCase().includes(q);
      if (nameMatch || catMatch) {
        results.push({ kind: "product", label: p.name, subtitle: p.category, typeSlug: "", typeName: "", productId: p.id });
      }
    }
    return results.slice(0, 10);
  })();

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || !isHome
            ? "bg-background/95 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        }`}
      >
        {/* Announcement bar */}
        {announcementEnabled && announcementText && (
          <div className="w-full bg-[#1a1612] text-[#d4a853] text-[10px] tracking-[0.25em] uppercase py-2 text-center font-medium px-4">
            {announcementText}
          </div>
        )}

        <div className={`max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between ${
          isScrolled || !isHome ? "py-4" : "py-6"
        }`}>
          {/* Desktop left nav */}
          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest flex-1">
            {!isHome && (
              <Link href="/" className={linkClass} data-testid="nav-home">Home</Link>
            )}
            {navLinks.map(link => (
              <Link key={link.href + link.label} href={link.href} className={linkClass}>{link.label}</Link>
            ))}
            {reelsEnabled && (
              <Link href="/social" className={`${linkClass} flex items-center gap-1.5`} data-testid="nav-social">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
                Reels
              </Link>
            )}
          </div>

          {/* Logo */}
          <Link
            href="/"
            className={`text-3xl font-serif tracking-widest text-center flex-none transition-colors duration-300 ${
              isTransparent ? "text-[hsl(43,20%,88%)]" : "text-[#6b3f2a]"
            }`}
            data-testid="nav-logo"
          >
            {brandName}
          </Link>

          {/* Desktop right icons */}
          <div className="hidden md:flex items-center gap-5 justify-end flex-1">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <button
                onClick={() => { setSearchOpen(prev => !prev); setSearchQuery(""); }}
                className={`${iconClass} p-1`}
                title="Search"
                data-testid="nav-search"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-80 bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                      <Search size={14} className="text-muted-foreground flex-shrink-0" />
                      <input
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search jewelry..."
                        className="flex-1 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {searchMatches.length > 0 && (
                      <div className="max-h-80 overflow-y-auto">
                        {searchMatches.map((match, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (match.kind === "product" && match.productId) {
                                navigate(`/product/${match.productId}`);
                              } else {
                                const url = match.catSlug
                                  ? `/shop?type=${match.typeSlug}&category=${match.catSlug}`
                                  : `/shop?type=${match.typeSlug}`;
                                navigate(url);
                              }
                              setSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                          >
                            <Search size={14} className="text-[#d4a853] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">{match.label}</p>
                              {match.kind === "product" && match.subtitle && (
                                <p className="text-xs text-muted-foreground capitalize">{match.subtitle}</p>
                              )}
                              {match.kind === "category" && match.catSlug && (
                                <p className="text-xs text-muted-foreground">in {match.typeName}</p>
                              )}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-shrink-0">
                              {match.kind === "product" ? "Product" : match.catSlug ? "Category" : "Type"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery.trim().length >= 2 && searchMatches.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                    {searchQuery.trim().length === 0 && (
                      <div className="px-4 py-4 text-xs text-muted-foreground text-center">
                        Search products, categories...
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/wishlist" className={`${iconClass} relative`} data-testid="nav-wishlist" title="Wishlist">
              <Heart size={20} strokeWidth={1.5} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link href="/cart" className={`${iconClass} relative`} data-testid="nav-cart" title="Cart">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 ${iconClass} text-sm font-medium`}
                  data-testid="nav-account"
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isTransparent ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden lg:inline tracking-normal normal-case">{firstName}</span>
                  <ChevronDown size={14} className={`transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground text-sm">{user.name}</p>
                          {user.isAdmin && (
                            <span className="inline-flex items-center bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">Admin</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.address && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.address}</p>
                        )}
                        {user.isAdmin && (
                          <p className="text-[10px] text-amber-600 mt-1">You have full admin access</p>
                        )}
                      </div>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors border-b border-border"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <User size={15} strokeWidth={1.5} />
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors border-t border-border/50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut size={15} strokeWidth={1.5} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className={iconClass} data-testid="nav-account" title="Login">
                <User size={20} strokeWidth={1.5} />
              </Link>
            )}
          </div>

          {/* Mobile right: icons + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => { setSearchOpen(prev => !prev); setSearchQuery(""); }}
              className={`${iconClass} p-1`}
            >
              <Search size={19} strokeWidth={1.5} />
            </button>
            <Link href="/wishlist" className={`${iconClass} relative p-1`} data-testid="mobile-nav-wishlist-icon">
              <Heart size={20} strokeWidth={1.5} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-1 bg-primary text-primary-foreground text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-medium">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link href="/cart" className={`${iconClass} relative p-1`} data-testid="mobile-nav-cart-icon">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-1 bg-primary text-primary-foreground text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className={`p-1 transition-colors duration-300 ${
                mobileOpen
                  ? "text-[hsl(43,20%,88%)]"
                  : isTransparent
                    ? "text-white/90"
                    : "text-foreground"
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="nav-mobile-toggle"
            >
              {mobileOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed left-0 right-0 z-40 bg-background border-b border-border shadow-xl md:hidden"
            style={{ top: navHeight }}
          >
            <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search jewelry..."
                className="flex-1 text-sm outline-none bg-transparent"
                autoFocus
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>
            {searchMatches.map((match, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (match.kind === "product" && match.productId) {
                    navigate(`/product/${match.productId}`);
                  } else {
                    const url = match.catSlug
                      ? `/shop?type=${match.typeSlug}&category=${match.catSlug}`
                      : `/shop?type=${match.typeSlug}`;
                    navigate(url);
                  }
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b border-border/50"
              >
                <Search size={14} className="text-[#d4a853] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{match.label}</p>
                  {match.kind === "product" && match.subtitle && (
                    <p className="text-xs text-muted-foreground capitalize">{match.subtitle}</p>
                  )}
                  {match.kind === "category" && match.catSlug && (
                    <p className="text-xs text-muted-foreground">in {match.typeName}</p>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-shrink-0">
                  {match.kind === "product" ? "Product" : match.catSlug ? "Category" : "Type"}
                </span>
              </button>
            ))}
            {searchQuery.trim().length >= 2 && searchMatches.length === 0 && (
              <div className="px-4 py-5 text-sm text-muted-foreground text-center">No results found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed left-0 right-0 z-40 bg-background border-b border-border overflow-hidden"
            style={{ top: navHeight }}
          >
            <div className="flex flex-col py-8 px-6 gap-6 text-sm uppercase tracking-widest">
              {!isHome && (
                <Link href="/" className="text-foreground hover:text-primary transition-colors" data-testid="mobile-nav-home">Home</Link>
              )}
              {navLinks.map(link => (
                <Link key={link.href + link.label} href={link.href} className="text-foreground hover:text-primary transition-colors">{link.label}</Link>
              ))}
              {reelsEnabled && (
                <Link href="/social" className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5" data-testid="mobile-nav-social">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                  </svg>
                  Reels
                </Link>
              )}
              {user ? (
                <>
                  <div className="border-t border-border pt-4 -mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs text-muted-foreground normal-case tracking-normal">Signed in as <span className="font-semibold text-foreground">{user.name}</span></p>
                      {user.isAdmin ? (
                        <span className="inline-flex items-center bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">Admin</span>
                      ) : (
                        <span className="inline-flex items-center bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">Customer</span>
                      )}
                    </div>
                    {user.isAdmin && (
                      <Link href="/admin" className="text-amber-700 hover:text-amber-600 transition-colors block mb-4 font-medium">Admin Panel</Link>
                    )}
                    <Link href="/profile" className="text-foreground hover:text-primary transition-colors block mb-4">My Profile</Link>
                    <Link href="/orders" className="text-foreground hover:text-primary transition-colors block mb-4">My Orders</Link>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-2">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <Link href="/login" className="text-foreground hover:text-primary transition-colors" data-testid="mobile-nav-account">
                  Login / Register
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
