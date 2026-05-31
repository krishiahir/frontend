import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Settings, LogOut, Plus, Edit2, Trash2, ChevronDown, X, Check, Search,
  ArrowUpRight, Sparkles, AlertCircle, RefreshCw, Upload, ImageIcon,
  ExternalLink, Home, Star, StarOff, Eye, EyeOff, TrendingUp, Menu, FileText,
  Layers, ChevronRight, ToggleLeft, ToggleRight, Video, Link, Play,
  ArrowUp, ArrowDown, FileDown, ChevronsLeft, ChevronsRight, Calendar, Save, MessageCircle, Mail, Reply, Megaphone,
  Tag, Activity, User, Truck
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { resolveImage } from "@/data/imageMap";
import { inr } from "@/data/products";
import type { ApiProduct, ApiOrder, ApiFeatureCard, AdminKpi, ApiCustomer, ApiProductType, ApiProductCategory, ApiReel, ApiSiteFeature } from "@/lib/api";
import { printOrderBill } from "@/lib/printBill";
import PageEditor from "@/components/admin/PageEditor";

type Section = "dashboard" | "products" | "orders" | "customers" | "homepage-products" | "feature-cards" | "reports" | "settings" | "pages" | "master-table" | "reels" | "reviews" | "contact-messages" | "marquee" | "promo-codes" | "cart-activity" | "shipping";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped:    "bg-purple-100 text-purple-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};
const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400", processing: "bg-blue-400",
  shipped: "bg-purple-400", delivered: "bg-green-500", cancelled: "bg-red-400",
};
const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6"];
const BAR_COLOR = "#d4a853";

interface ProductForm {
  name: string; price: string; compareAtPrice: string; category: string; description: string;
  badge: string; stock: string; featureImageUrl: string;
  galleryImages: string[]; isFeatured: boolean; eligibleForOffer: boolean;
}
const emptyProductForm: ProductForm = {
  name: "", price: "", compareAtPrice: "", category: "necklaces", description: "",
  badge: "", stock: "", featureImageUrl: "", galleryImages: [], isFeatured: false, eligibleForOffer: false,
};

interface CardForm { title: string; subtitle: string; description: string; badge: string; isActive: boolean; }
const emptyCardForm: CardForm = { title: "", subtitle: "", description: "", badge: "", isActive: true };

function parseImages(raw: string | null): string[] {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

async function compressImage(file: File, maxWidth = 1200, quality = 0.78): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

export default function AdminPanel() {
  const { user, userLoading, logout, reloadProducts } = useApp();
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [kpi, setKpi] = useState<AdminKpi | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  const [adminProducts, setAdminProducts] = useState<ApiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ApiProduct | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [featureDragging, setFeatureDragging] = useState(false);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const featureUploadRef = useRef<HTMLInputElement>(null);
  const galleryUploadRef = useRef<HTMLInputElement>(null);

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [featureCards, setFeatureCards] = useState<ApiFeatureCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardForm, setCardForm] = useState<CardForm>(emptyCardForm);
  const [editingCard, setEditingCard] = useState<ApiFeatureCard | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardSaving, setCardSaving] = useState(false);

  const [pageContent, setPageContent] = useState<Record<string, string>>({});

  // ─── Master Table state ───
  const [productTypes, setProductTypes] = useState<ApiProductType[]>([]);
  const [productCategories, setProductCategories] = useState<ApiProductCategory[]>([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Add Type form
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  // Edit Type
  const [editTypeId, setEditTypeId] = useState<number | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeImageUrl, setEditTypeImageUrl] = useState("");

  // Add Category form (per type)
  const [addCatTypeId, setAddCatTypeId] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState("");

  // Edit Category
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");

  const [masterSaving, setMasterSaving] = useState(false);

  // ─── Reels state ───
  interface ReelForm { title: string; videoUrl: string; thumbnailUrl: string; isActive: boolean; sortOrder: string; uploadMode: "url" | "file"; }
  const emptyReelForm: ReelForm = { title: "", videoUrl: "", thumbnailUrl: "", isActive: true, sortOrder: "0", uploadMode: "url" };
  const [reels, setReels] = useState<ApiReel[]>([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [reelForm, setReelForm] = useState<ReelForm>(emptyReelForm);
  const [editingReel, setEditingReel] = useState<ApiReel | null>(null);
  const [showReelModal, setShowReelModal] = useState(false);
  const [reelSaving, setReelSaving] = useState(false);
  const reelVideoRef = useRef<HTMLInputElement>(null);

  // ─── Reviews state ───
  const [reviews, setReviews] = useState<import("@/lib/api").ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsFilter, setReviewsFilter] = useState<"all" | "visible" | "hidden">("all");
  const [revPage, setRevPage]           = useState(1);
  const [revPageSize, setRevPageSize]   = useState<10|20|50>(10);
  const [revToggling, setRevToggling]   = useState<number | null>(null);
  const [revSearch, setRevSearch]       = useState("");
  const [revSelectedProductId, setRevSelectedProductId] = useState<number | null>(null);
  const [revDropdownOpen, setRevDropdownOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<import("@/lib/api").ApiReview | null>(null);
  const [reviewForm, setReviewForm] = useState({ productId: "", reviewerName: "", rating: 0, title: "", body: "", imageUrl: "", isVisible: true });
  const [reviewModalSaving, setReviewModalSaving] = useState(false);
  const [reviewModalError, setReviewModalError] = useState("");

  // ─── Marquee / Site Features state ───
  const [marqueeFeatures, setMarqueeFeatures] = useState<ApiSiteFeature[]>([]);
  const [marqueeLoading, setMarqueeLoading] = useState(false);
  const [newMarqueeLabel, setNewMarqueeLabel] = useState("");
  const [editMarqueeId, setEditMarqueeId] = useState<number | null>(null);
  const [editMarqueeLabel, setEditMarqueeLabel] = useState("");
  const [marqueeError, setMarqueeError] = useState("");

  // ─── Contact Messages state ───
  interface ContactMessage { id: number; name: string; email: string; subject: string | null; message: string; status: string; createdAt: string; replyContent: string | null; }
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contactMessagesLoading, setContactMessagesLoading] = useState(false);
  const [contactReplyId, setContactReplyId] = useState<number | null>(null);
  const [contactReplyText, setContactReplyText] = useState("");
  const [contactReplying, setContactReplying] = useState(false);
  const [contactFilter, setContactFilter] = useState<"all" | "unread" | "read" | "replied">("all");

  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoModal, setPromoModal] = useState<{ open: boolean; editing?: any }>({ open: false });
  const [promoForm, setPromoForm] = useState({ code: "", discountPercent: "", maxUses: "", isActive: true });

  const [cartActivities, setCartActivities] = useState<any[]>([]);
  const [cartActLoading, setCartActLoading] = useState(false);
  const [cartActPage, setCartActPage] = useState(1);
  const [cartActTotal, setCartActTotal] = useState(0);
  const [cartActTotalPages, setCartActTotalPages] = useState(1);
  const [cartActSearch, setCartActSearch] = useState("");
  const [cartActFilter, setCartActFilter] = useState<"all" | "registered" | "guest">("all");

  const loadPromoCodes = useCallback(async () => {
    setPromoLoading(true);
    try { setPromoCodes(await api.promo.list()); } catch {} finally { setPromoLoading(false); }
  }, []);

  const loadCartActivities = useCallback(async (p?: number) => {
    setCartActLoading(true);
    try {
      const data = await api.cartActivity.list({ page: p || cartActPage, limit: 20, search: cartActSearch, filter: cartActFilter === "all" ? "" : cartActFilter });
      setCartActivities(data.activities);
      setCartActTotal(data.total);
      setCartActTotalPages(data.totalPages);
    } catch {} finally { setCartActLoading(false); }
  }, [cartActPage, cartActSearch, cartActFilter]);

  const loadContactMessages = useCallback(async () => {
    setContactMessagesLoading(true);
    try {
      const d = await api.contact.adminList();
      setContactMessages(d as ContactMessage[]);
    } catch { } finally { setContactMessagesLoading(false); }
  }, []);

  const markContactRead = async (id: number) => {
    try {
      await api.contact.markRead(id);
      setContactMessages(prev => prev.map(m => m.id === id ? { ...m, status: "read" } : m));
    } catch { }
  };

  const sendContactReply = async (id: number) => {
    if (!contactReplyText.trim()) return;
    setContactReplying(true);
    try {
      await api.contact.reply(id, contactReplyText);
      setContactMessages(prev => prev.map(m => m.id === id ? { ...m, status: "replied", replyContent: contactReplyText } : m));
      setContactReplyId(null);
      setContactReplyText("");
      showSuccess("Reply sent!");
    } catch { } finally { setContactReplying(false); }
  };

  // ─── Shipping Zones ───
  const [shippingZones, setShippingZones] = useState<{ id: number; minKm: number; maxKm: number; charge: number }[]>([]);
  const [shippingOrigin, setShippingOrigin] = useState("");
  const [shippingForm, setShippingForm] = useState({ minKm: "", maxKm: "", charge: "" });
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [shippingSaving, setShippingSaving] = useState(false);

  const loadShippingZones = async () => {
    try {
      const zones = await api.shipping.zones();
      setShippingZones(zones);
    } catch {}
  };

  // ─── Pricing & Social Settings ───
  const [pricingForm, setPricingForm] = useState({ gift_price: "99", shipping_fee: "99", free_shipping_min: "2000", free_shipping_enabled: "true" });
  const [socialForm, setSocialForm] = useState({ instagram_handle: "@ethura.jewelry", followers: "47K+", reel_views: "2.1M", positive_reviews: "98%" });
  const [offersForm, setOffersForm] = useState({ enabled: "false", type: "b1g1", percent: "20", label: "Buy 1 Get 1 Free" });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ─── Discount % helper (product modal only) ───
  const [discountPct, setDiscountPct] = useState("");

  // ─── Products table controls ───
  const [prodPageSize, setProdPageSize] = useState<10|20|50>(10);
  const [prodPage, setProdPage]         = useState(1);
  const [prodSortCol, setProdSortCol]   = useState<"name"|"category"|"price"|"stock"|"createdAt">("createdAt");
  const [prodSortDir, setProdSortDir]   = useState<"asc"|"desc">("desc");
  const [prodDateStart, setProdDateStart] = useState("");
  const [prodDateEnd,   setProdDateEnd]   = useState("");

  // ─── Orders table controls ───
  const [orderPageSize, setOrderPageSize] = useState<10|20|50>(10);
  const [orderPage, setOrderPage]         = useState(1);
  const [orderSortCol, setOrderSortCol]   = useState<"createdAt"|"total"|"status">("createdAt");
  const [orderSortDir, setOrderSortDir]   = useState<"asc"|"desc">("desc");
  const [orderDateStart, setOrderDateStart] = useState("");
  const [orderDateEnd,   setOrderDateEnd]   = useState("");

  // ─── Customers table controls ───
  const [custPageSize, setCustPageSize] = useState<10|20|50>(10);
  const [custPage, setCustPage]         = useState(1);
  const [custSortCol, setCustSortCol]   = useState<"name"|"orderCount"|"totalSpent"|"createdAt">("createdAt");
  const [custSortDir, setCustSortDir]   = useState<"asc"|"desc">("desc");
  const [custDateStart, setCustDateStart] = useState("");
  const [custDateEnd,   setCustDateEnd]   = useState("");
  const [custSearch,    setCustSearch]    = useState("");

  const loadMaster = useCallback(async () => {
    setMasterLoading(true);
    try {
      const [types, cats] = await Promise.all([api.master.listTypes(), api.master.listCategories()]);
      setProductTypes(types);
      setProductCategories(cats);
      if (!selectedTypeId && types.length > 0) setSelectedTypeId(types[0].id);
    } catch { /* ignore */ }
    finally { setMasterLoading(false); }
  }, [selectedTypeId]);

  const [togglingFeatured, setTogglingFeatured] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const loadKpi = useCallback(async () => {
    try { setKpiLoading(true); const d = await api.admin.kpi(); setKpi(d); }
    catch (e: any) { setError(e.message); } finally { setKpiLoading(false); }
  }, []);
  const loadProducts = useCallback(async () => {
    try { setProductsLoading(true); const d = await api.products.listAll(); setAdminProducts(d); }
    catch (e: any) { setError(e.message); } finally { setProductsLoading(false); }
  }, []);
  const loadOrders = useCallback(async () => {
    try { setOrdersLoading(true); const d = await api.orders.list(); setOrders(d); }
    catch (e: any) { setError(e.message); } finally { setOrdersLoading(false); }
  }, []);
  const loadCustomers = useCallback(async () => {
    try { setCustomersLoading(true); const d = await api.admin.customers(); setCustomers(d); }
    catch (e: any) { setError(e.message); } finally { setCustomersLoading(false); }
  }, []);
  const loadFeatureCards = useCallback(async () => {
    try { setCardsLoading(true); const d = await api.featureCards.list(); setFeatureCards(d); }
    catch (e: any) { setError(e.message); } finally { setCardsLoading(false); }
  }, []);
  const loadPageContent = useCallback(async () => {
    try { const d = await api.siteContent.get(); setPageContent(d); }
    catch { }
  }, []);

  const loadReels = useCallback(async () => {
    setReelsLoading(true);
    try { setReels(await api.reels.listAll()); }
    catch { } finally { setReelsLoading(false); }
  }, []);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try { setReviews(await api.reviews.adminList()); }
    catch { } finally { setReviewsLoading(false); }
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadKpi(); loadProducts(); loadOrders(); loadCustomers(); loadFeatureCards(); loadPageContent();
    loadMaster(); loadReels();
  }, [user?.isAdmin]);

  useEffect(() => {
    if (section === "master-table" && user?.isAdmin) loadMaster();
    if (section === "reels" && user?.isAdmin) loadReels();
    if (section === "reviews" && user?.isAdmin) loadReviews();
    if (section === "contact-messages" && user?.isAdmin) loadContactMessages();
    if (section === "promo-codes" && user?.isAdmin) loadPromoCodes();
    if (section === "cart-activity" && user?.isAdmin) loadCartActivities(cartActPage);
    if (section === "shipping" && user?.isAdmin) {
      loadShippingZones();
      api.siteContent.get().then(c => setShippingOrigin(c["settings.origin_pincode"] || "")).catch(() => {});
    }
    if (section === "marquee" && user?.isAdmin) {
      setMarqueeLoading(true);
      api.siteFeatures.listAll().then(f => { setMarqueeFeatures(f); setMarqueeLoading(false); }).catch(() => setMarqueeLoading(false));
    }
    if (section === "settings" && user?.isAdmin) {
      api.siteContent.get().then(content => {
        setPricingForm({
          gift_price: content["settings.gift_price"] || "99",
          shipping_fee: content["settings.shipping_fee"] || "99",
          free_shipping_min: content["settings.free_shipping_min"] || "2000",
          free_shipping_enabled: content["settings.free_shipping_enabled"] ?? "true",
        });
        setSocialForm({
          instagram_handle: content["social.instagram_handle"] || "@ethura.jewelry",
          followers: content["social.followers"] || "47K+",
          reel_views: content["social.reel_views"] || "2.1M",
          positive_reviews: content["social.positive_reviews"] || "98%",
        });
        setOffersForm({
          enabled: content["offers.enabled"] ?? "false",
          type: content["offers.type"] ?? "b1g1",
          percent: content["offers.percent"] ?? "20",
          label: content["offers.label"] ?? "Buy 1 Get 1 Free",
        });
      }).catch(() => {});
    }
  }, [section, user?.isAdmin]);

  useEffect(() => {
    if (section === "cart-activity" && user?.isAdmin) loadCartActivities(cartActPage);
  }, [cartActPage, cartActSearch, cartActFilter]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center flex-col gap-5 px-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertCircle size={30} className="text-amber-600" />
        </div>
        <div className="text-center">
          <h2 className="font-serif text-2xl mb-1">Login Required</h2>
          <p className="text-muted-foreground text-sm">You need to sign in to access this page.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setLocation("/login")} className="text-xs uppercase tracking-widest bg-[#1a1612] text-white px-6 py-3 hover:bg-[#d4a853] hover:text-[#1a1612] transition-all">
            Sign In
          </button>
          <button onClick={() => setLocation("/")} className="text-xs uppercase tracking-widest border border-border px-6 py-3 hover:border-foreground transition-all">
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center flex-col gap-5 px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle size={30} className="text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="font-serif text-2xl mb-1">Access Denied</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your account <span className="font-medium text-foreground">{user.email}</span> has{" "}
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">Customer</span>{" "}
            access only. The admin panel is restricted to authorized admins.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setLocation("/shop")} className="text-xs uppercase tracking-widest bg-[#1a1612] text-white px-6 py-3 hover:bg-[#d4a853] hover:text-[#1a1612] transition-all">
            Browse the Shop
          </button>
          <button onClick={() => { logout(); setLocation("/login"); }} className="text-xs uppercase tracking-widest border border-border px-6 py-3 hover:border-foreground transition-all">
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => { logout(); setLocation("/login"); };

  const handleFeatureImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const compressed = await compressImage(file);
    setProductForm(f => ({ ...f, featureImageUrl: compressed }));
  };

  const handleGalleryFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 8);
    const compressed = await Promise.all(arr.map(f => compressImage(f, 1000, 0.72)));
    setProductForm(f => ({ ...f, galleryImages: [...f.galleryImages, ...compressed].slice(0, 8) }));
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setDiscountPct("");
    setShowProductModal(true);
  };
  const openEditProduct = (p: ApiProduct) => {
    setEditingProduct(p);
    const featureImg = p.featureImageUrl || resolveImage(p.imageKey, p.imageUrl) || "";
    setProductForm({
      name: p.name, price: String(p.price), compareAtPrice: String(p.compareAtPrice || ""),
      category: p.category, description: p.description,
      badge: p.badge || "", stock: String(p.stock || ""),
      featureImageUrl: featureImg,
      galleryImages: parseImages(p.images),
      isFeatured: p.isFeatured || false,
      eligibleForOffer: (p as any).eligibleForOffer || false,
    });
    if (p.price && p.compareAtPrice && p.compareAtPrice > p.price) {
      setDiscountPct(String(Math.round((1 - p.price / p.compareAtPrice) * 100)));
    } else {
      setDiscountPct("");
    }
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) { setError("Name and price are required."); return; }
    setProductSaving(true);
    try {
      const payload = {
        name: productForm.name, price: Number(productForm.price),
        compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : null,
        category: productForm.category,
        description: productForm.description, badge: productForm.badge || null,
        stock: productForm.stock ? Number(productForm.stock) : null,
        featureImageUrl: productForm.featureImageUrl || null,
        imageUrl: productForm.featureImageUrl || null,
        images: productForm.galleryImages,
        isFeatured: productForm.isFeatured,
        eligibleForOffer: productForm.eligibleForOffer,
        isActive: true,
      };
      if (editingProduct) {
        const updated = await api.products.update(editingProduct.id, payload as any);
        setAdminProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        const created = await api.products.create(payload as any);
        setAdminProducts(prev => [...prev, created]);
      }
      await reloadProducts();
      setShowProductModal(false);
      showSuccess(editingProduct ? "Product updated!" : "Product created!");
    } catch (e: any) { setError(e.message); } finally { setProductSaving(false); }
  };

  const deleteProduct = async (id: number) => {
    try {
      await api.products.delete(id);
      setAdminProducts(prev => prev.filter(p => p.id !== id));
      await reloadProducts();
      setDeleteConfirm(null);
      showSuccess("Product deleted.");
    } catch (e: any) { setError(e.message); }
  };

  const toggleFeatured = async (p: ApiProduct) => {
    setTogglingFeatured(p.id);
    try {
      const updated = await api.products.update(p.id, { isFeatured: !p.isFeatured });
      setAdminProducts(prev => prev.map(x => x.id === p.id ? updated : x));
      await reloadProducts();
      showSuccess(updated.isFeatured ? `"${p.name}" added to homepage.` : `"${p.name}" removed from homepage.`);
    } catch (e: any) { setError(e.message); } finally { setTogglingFeatured(null); }
  };

  const toggleProductActive = async (p: ApiProduct) => {
    try {
      const updated = await api.products.update(p.id, { isActive: !p.isActive });
      setAdminProducts(prev => prev.map(x => x.id === p.id ? updated : x));
      await reloadProducts();
      showSuccess(updated.isActive ? `"${p.name}" is now Active.` : `"${p.name}" set to Inactive.`);
    } catch (e: any) { setError(e.message); }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    setUpdatingOrder(id);
    try {
      const updated = await api.orders.updateStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      setSelectedOrder(prev => prev?.id === id ? updated : prev);
    } catch (e: any) { setError(e.message); } finally { setUpdatingOrder(null); }
  };

  const openAddCard = () => { setEditingCard(null); setCardForm(emptyCardForm); setShowCardModal(true); };
  const openEditCard = (c: ApiFeatureCard) => {
    setEditingCard(c);
    setCardForm({ title: c.title, subtitle: c.subtitle, description: c.description, badge: c.badge || "", isActive: c.isActive });
    setShowCardModal(true);
  };
  const saveCard = async () => {
    if (!cardForm.title) return;
    setCardSaving(true);
    try {
      if (editingCard) {
        const u = await api.featureCards.update(editingCard.id, cardForm);
        setFeatureCards(prev => prev.map(c => c.id === editingCard.id ? u : c));
      } else {
        const c = await api.featureCards.create({ ...cardForm, sortOrder: featureCards.length });
        setFeatureCards(prev => [...prev, c]);
      }
      setShowCardModal(false);
      showSuccess("Feature card saved!");
    } catch (e: any) { setError(e.message); } finally { setCardSaving(false); }
  };
  const deleteCard = async (id: number) => {
    try { await api.featureCards.delete(id); setFeatureCards(prev => prev.filter(c => c.id !== id)); }
    catch (e: any) { setError(e.message); }
  };

  const openAddReel = () => { setEditingReel(null); setReelForm(emptyReelForm); setShowReelModal(true); };
  const openEditReel = (r: ApiReel) => {
    setEditingReel(r);
    const isFile = r.videoUrl.startsWith("data:");
    setReelForm({
      title: r.title, videoUrl: r.videoUrl, thumbnailUrl: r.thumbnailUrl || "",
      isActive: r.isActive, sortOrder: String(r.sortOrder ?? 0),
      uploadMode: isFile ? "file" : "url",
    });
    setShowReelModal(true);
  };
  const saveReel = async () => {
    if (!reelForm.title || !reelForm.videoUrl) { setError("Title and video are required."); return; }
    setReelSaving(true);
    try {
      const payload = {
        title: reelForm.title, videoUrl: reelForm.videoUrl,
        thumbnailUrl: reelForm.thumbnailUrl || null,
        isActive: reelForm.isActive, sortOrder: Number(reelForm.sortOrder) || 0,
      };
      if (editingReel) {
        const u = await api.reels.update(editingReel.id, payload);
        setReels(prev => prev.map(r => r.id === editingReel.id ? u : r));
      } else {
        const c = await api.reels.create(payload);
        setReels(prev => [...prev, c]);
      }
      setShowReelModal(false);
      showSuccess(editingReel ? "Reel updated!" : "Reel added!");
    } catch (e: any) { setError(e.message); } finally { setReelSaving(false); }
  };
  const deleteReel = async (id: number) => {
    try { await api.reels.delete(id); setReels(prev => prev.filter(r => r.id !== id)); showSuccess("Reel deleted."); }
    catch (e: any) { setError(e.message); }
  };
  const handleReelVideoFile = (file: File) => {
    if (!file.type.startsWith("video/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setReelForm(f => ({ ...f, videoUrl: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  // ─── PDF export helper ───
  function exportTablePdf(title: string, headers: string[], rows: string[][]) {
    const w = window.open("", "_blank")!;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#222}
      h2{font-size:16px;margin-bottom:12px;color:#1a1612}
      p{font-size:11px;color:#888;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}
      th{background:#1a1612;color:#d4a853;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:1px}
      td{padding:7px 10px;border-bottom:1px solid #e8e0d4;font-size:11px}
      tr:nth-child(even) td{background:#faf8f5}
      @media print{@page{margin:15mm}}
    </style></head><body>
    <h2>${title}</h2>
    <p>Exported on ${new Date().toLocaleString("en-IN")} &mdash; ${rows.length} records</p>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  }

  // ─── Sort helper ───
  function mkSort<T>(items: T[], col: keyof T, dir: "asc"|"desc") {
    return [...items].sort((a, b) => {
      const av = a[col]; const bv = b[col];
      if (av == null) return 1; if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
  }
  function SortBtn({ col, cur, dir, onClick }: { col: string; cur: string; dir: "asc"|"desc"; onClick: () => void }) {
    const active = col === cur;
    return (
      <button onClick={onClick} className="inline-flex items-center gap-0.5 ml-1 opacity-60 hover:opacity-100 transition-opacity">
        {active && dir === "asc" ? <ArrowUp size={11} className="text-[#d4a853]" /> : active && dir === "desc" ? <ArrowDown size={11} className="text-[#d4a853]" /> : <><ArrowUp size={9} /><ArrowDown size={9} /></>}
      </button>
    );
  }
  function PaginationBar({ page, total, pageSize, onPage, onPageSize }: { page: number; total: number; pageSize: 10|20|50; onPage: (n: number) => void; onPageSize: (n: 10|20|50) => void }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return (
      <div className="flex items-center justify-between flex-wrap gap-2 py-3 px-4 border-t border-border bg-muted/10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Show</span>
          {([10,20,50] as const).map(n => (
            <button key={n} onClick={() => { onPageSize(n); onPage(1); }}
              className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${pageSize === n ? "bg-[#1a1612] text-white border-[#1a1612]" : "border-border hover:border-[#d4a853] bg-white"}`}>{n}</button>
          ))}
          <span>rows</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button onClick={() => onPage(1)} disabled={page === 1} className="p-1 rounded disabled:opacity-30 hover:bg-muted/40"><ChevronsLeft size={14} /></button>
          <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1 rounded disabled:opacity-30 hover:bg-muted/40"><ArrowUp size={13} className="rotate-[-90deg]" /></button>
          <span className="px-2 font-medium">{page} / {pages}</span>
          <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="p-1 rounded disabled:opacity-30 hover:bg-muted/40"><ArrowDown size={13} className="rotate-[-90deg]" /></button>
          <button onClick={() => onPage(pages)} disabled={page >= pages} className="p-1 rounded disabled:opacity-30 hover:bg-muted/40"><ChevronsRight size={14} /></button>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} of {total}
        </span>
      </div>
    );
  }

  // ─── Products filtered / sorted / paginated ───
  const dateInRange = (dateStr: string, start: string, end: string) => {
    const d = new Date(dateStr).getTime();
    if (start && d < new Date(start).getTime()) return false;
    if (end   && d > new Date(end + "T23:59:59").getTime()) return false;
    return true;
  };
  const searchedProducts = adminProducts.filter(p =>
    (p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
    && dateInRange(p.createdAt, prodDateStart, prodDateEnd)
  );
  const sortedProducts = (() => {
    // featured first group, then rest — each group sorted by selected col/dir
    const featured = searchedProducts.filter(p => p.isFeatured);
    const rest     = searchedProducts.filter(p => !p.isFeatured);
    const sort = <T extends object>(arr: T[]) => mkSort(arr, prodSortCol as keyof T, prodSortDir);
    return [...sort(featured as any), ...sort(rest as any)] as typeof searchedProducts;
  })();
  const totalProdItems = sortedProducts.length;
  const filteredProducts = sortedProducts.slice((prodPage - 1) * prodPageSize, prodPage * prodPageSize);

  // ─── Orders filtered / sorted / paginated ───
  const searchedOrders = orders.filter(o => {
    const s = orderSearch.toLowerCase();
    return ((o.guestName || "").toLowerCase().includes(s) || (o.guestEmail || "").toLowerCase().includes(s) || o.id.toLowerCase().includes(s))
      && (orderFilter === "all" || o.status === orderFilter)
      && dateInRange(o.createdAt, orderDateStart, orderDateEnd);
  });
  const sortedOrders = mkSort(searchedOrders, orderSortCol as keyof typeof searchedOrders[0], orderSortDir);
  const totalOrderItems = sortedOrders.length;
  const filteredOrders = sortedOrders.slice((orderPage - 1) * orderPageSize, orderPage * orderPageSize);

  // ─── Customers filtered / sorted / paginated ───
  const searchedCustomers = customers.filter(c => {
    const s = custSearch.toLowerCase();
    return (c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s))
      && dateInRange(c.createdAt, custDateStart, custDateEnd);
  });
  const sortedCustomers = mkSort(searchedCustomers, custSortCol as keyof typeof searchedCustomers[0], custSortDir);
  const totalCustItems = sortedCustomers.length;
  const pagedCustomers = sortedCustomers.slice((custPage - 1) * custPageSize, custPage * custPageSize);

  const categoryData = ["necklaces", "earrings", "rings", "bracelets"].map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    Products: adminProducts.filter(p => p.category === cat && p.isActive).length,
    "Avg ₹": adminProducts.filter(p => p.category === cat).length
      ? Math.round(adminProducts.filter(p => p.category === cat).reduce((s, p) => s + p.price, 0) / adminProducts.filter(p => p.category === cat).length)
      : 0,
  }));

  const orderStatusData = kpi ? [
    { name: "Delivered", value: kpi.deliveredOrders },
    { name: "Pending", value: kpi.pendingOrders },
    { name: "Cancelled", value: kpi.cancelledOrders },
  ].filter(d => d.value > 0) : [];

  type NavGroup = "Core" | "Content" | "Data" | "System";
  const navItems: { id: Section; label: string; icon: React.ReactNode; group: NavGroup }[] = [
    { id: "dashboard",         label: "Dashboard",          icon: <LayoutDashboard size={16} />, group: "Core" },
    { id: "products",          label: "Products",           icon: <Package size={16} />,         group: "Core" },
    { id: "orders",            label: "Orders",             icon: <ShoppingCart size={16} />,    group: "Core" },
    { id: "customers",         label: "Customers",          icon: <Users size={16} />,           group: "Core" },
    { id: "homepage-products", label: "Homepage Products",  icon: <Home size={16} />,            group: "Content" },
    { id: "feature-cards",     label: "Highlights",         icon: <Sparkles size={16} />,        group: "Content" },
    { id: "pages",             label: "Pages & Popup",      icon: <FileText size={16} />,        group: "Content" },
    { id: "reels",             label: "Reels",              icon: <Video size={16} />,           group: "Content" },
    { id: "reviews",           label: "Reviews",            icon: <Star size={16} />,            group: "Content" },
    { id: "contact-messages",  label: "Contact Messages",   icon: <MessageCircle size={16} />,   group: "Content" },
    { id: "marquee",            label: "Marquee / Headlines", icon: <Megaphone size={16} />,      group: "Content" },
    { id: "promo-codes",       label: "Promo Codes",        icon: <Tag size={16} />,             group: "Core" },
    { id: "cart-activity",     label: "Cart Activity",      icon: <Activity size={16} />,        group: "Core" },
    { id: "shipping",          label: "Shipping",           icon: <Truck size={16} />,           group: "Core" },
    { id: "master-table",      label: "Master Table",       icon: <Layers size={16} />,          group: "Data" },
    { id: "reports",           label: "Reports",            icon: <BarChart3 size={16} />,       group: "Data" },
    { id: "settings",          label: "Settings",           icon: <Settings size={16} />,        group: "System" },
  ];

  const SidebarContent = () => {
    const groups: { key: NavGroup; label: string }[] = [
      { key: "Core",    label: "Main" },
      { key: "Content", label: "Content" },
      { key: "Data",    label: "Analytics" },
      { key: "System",  label: "System" },
    ];
    return (
      <>
        {/* Logo */}
        <div className={`flex items-center justify-between border-b border-white/8 ${sidebarOpen ? "px-5 py-4" : "px-3 py-4 justify-center"}`}>
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#d4a853] flex items-center justify-center shrink-0">
                <span className="text-[#1a1612] font-bold text-sm font-serif">E</span>
              </div>
              <div>
                <div className="font-serif text-[15px] tracking-wide leading-tight text-white">Ethura</div>
                <div className="text-[10px] text-[#d4a853]/80 uppercase tracking-[0.15em]">Admin Console</div>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 rounded-lg bg-[#d4a853] flex items-center justify-center">
              <span className="text-[#1a1612] font-bold text-sm font-serif">E</span>
            </div>
          )}
          <button onClick={() => { setSidebarOpen(!sidebarOpen); setMobileSidebarOpen(false); }}
            className="text-white/40 hover:text-white/80 p-1 rounded-lg hover:bg-white/5 hidden md:flex items-center justify-center transition-colors">
            <Menu size={15} />
          </button>
          <button onClick={() => setMobileSidebarOpen(false)}
            className="text-white/40 hover:text-white/80 p-1 rounded-lg hover:bg-white/5 md:hidden flex items-center justify-center transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {groups.map(group => {
            const items = navItems.filter(n => n.group === group.key);
            return (
              <div key={group.key} className="mb-1">
                {sidebarOpen && (
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30 px-5 pt-3 pb-1.5">{group.label}</p>
                )}
                {!sidebarOpen && <div className="h-2" />}
                <div className="px-2 space-y-0.5">
                  {items.map(item => {
                    const active = section === item.id;
                    const badge = item.id === "reviews" ? reviews.filter(r => r.isVisible).length || null : null;
                    return (
                      <button key={item.id}
                        onClick={() => { setSection(item.id); setError(""); setMobileSidebarOpen(false); }}
                        title={!sidebarOpen ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                          active
                            ? "bg-[#d4a853] text-[#1a1612] font-semibold shadow-sm"
                            : "text-white/60 hover:text-white hover:bg-white/6"
                        } ${!sidebarOpen ? "justify-center" : ""}`}>
                        <span className={active ? "text-[#1a1612]" : ""}>{item.icon}</span>
                        {sidebarOpen && (
                          <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>
                        )}
                        {sidebarOpen && badge !== null && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-[#1a1612]/15 text-[#1a1612]" : "bg-[#d4a853]/20 text-[#d4a853]"}`}>{badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom: user + actions */}
        <div className="border-t border-white/8 p-2 space-y-0.5">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a853] to-[#b8903f] flex items-center justify-center text-[#1a1612] font-bold text-sm shrink-0 shadow-sm">
                {user.name[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-white/40 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button onClick={() => setLocation("/")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-white/50 hover:text-white hover:bg-white/6 transition-all ${!sidebarOpen ? "justify-center" : ""}`}
            title={!sidebarOpen ? "View Website" : undefined}>
            <ExternalLink size={15} />
            {sidebarOpen && <span>View Website</span>}
          </button>
          <button onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-red-400/70 hover:text-red-300 hover:bg-red-500/8 transition-all ${!sidebarOpen ? "justify-center" : ""}`}
            title={!sidebarOpen ? "Sign Out" : undefined}>
            <LogOut size={15} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex font-sans">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-[#1a1612] text-white flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`${sidebarOpen ? "w-60" : "w-14"} hidden md:flex transition-all duration-300 bg-[#1a1612] text-white flex-col min-h-screen shrink-0`}>
        <SidebarContent />
      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur border-b border-border px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-muted/30">
              <Menu size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-[17px] font-semibold text-foreground leading-tight">
                  {navItems.find(n => n.id === section)?.label}
                </h1>
                {section === "products" && kpi && (
                  <span className="text-[11px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{kpi.totalProducts} total</span>
                )}
                {section === "orders" && kpi && (
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{kpi.totalOrders} total</span>
                )}
                {section === "customers" && kpi && (
                  <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{kpi.totalCustomers} total</span>
                )}
                {section === "reviews" && (
                  <span className="text-[11px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{reviews.length} total</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">Ethura Jewelry · Admin Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocation("/")}
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium border border-border px-3.5 py-1.5 rounded-lg hover:bg-[#1a1612] hover:text-white hover:border-[#1a1612] transition-all">
              <ExternalLink size={13} /> View Store
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-[12px] font-medium bg-red-50 text-red-600 border border-red-200 px-3.5 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all">
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-4 md:mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError("")}><X size={15} /></button>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-4 md:mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg flex items-center gap-2">
              <Check size={15} /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">

            {/* ─── DASHBOARD ─── */}
            {section === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpiLoading ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-border animate-pulse h-32" />
                  )) : kpi ? [
                    { label: "Total Revenue",  value: inr(kpi.totalRevenue), sub: "all time",          icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                    { label: "Total Orders",   value: kpi.totalOrders,       sub: `${kpi.pendingOrders} pending`,  icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
                    { label: "Products",       value: kpi.totalProducts,     sub: `${kpi.lowStockProducts} low stock`, icon: Package, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
                    { label: "Customers",      value: kpi.totalCustomers,    sub: "registered",        icon: Users,        color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100" },
                  ].map(k => (
                    <div key={k.label} className={`bg-white rounded-2xl p-5 border ${k.border} shadow-sm hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`${k.bg} ${k.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                          <k.icon size={18} />
                        </div>
                        <ArrowUpRight size={14} className="text-muted-foreground/40 mt-0.5" />
                      </div>
                      <p className="text-2xl font-bold text-foreground leading-none">{k.value}</p>
                      <p className="text-[12px] font-medium text-muted-foreground mt-1.5">{k.label}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{k.sub}</p>
                    </div>
                  )) : null}
                </div>

                {/* Alert row */}
                {kpi && kpi.lowStockProducts > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-sm text-amber-800">
                    <AlertCircle size={16} className="text-amber-500 shrink-0" />
                    <span><strong>{kpi.lowStockProducts}</strong> product{kpi.lowStockProducts > 1 ? "s are" : " is"} running low on stock.</span>
                    <button onClick={() => setSection("products")} className="ml-auto text-xs underline underline-offset-2">View Products</button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Inventory Bar Chart */}
                  <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Inventory by Category</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={categoryData} barCategoryGap="30%">
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }} />
                        <Bar dataKey="Products" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Order Status Pie */}
                  <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Order Status</h3>
                    {orderStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3}>
                            {orderStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No orders yet</div>
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[14px] text-foreground">Recent Orders</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Latest {Math.min(orders.length, 5)} of {orders.length} orders</p>
                    </div>
                    <button onClick={() => setSection("orders")} className="text-[12px] text-[#d4a853] font-medium hover:underline underline-offset-2">View all →</button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground text-[13px]">No orders placed yet.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {orders.slice(0, 5).map(o => (
                        <div key={o.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[o.status] || "bg-gray-400"}`} />
                            <div>
                              <p className="font-semibold text-[13px]">{o.guestName || "Guest"}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{o.id.slice(0, 14)}…</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div className="flex flex-col items-end gap-0.5">
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[o.status] || ""}`}>
                                {o.status}{o.status === "cancelled" && o.cancelledBy ? ` by ${o.cancelledBy}` : ""}
                              </span>
                              {o.statusUpdatedAt && (
                                <span className="text-[9px] text-muted-foreground">
                                  {new Date(o.statusUpdatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} {new Date(o.statusUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-[13px] text-[#1a1612]">{inr(o.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── PRODUCTS ─── */}
            {section === "products" && (
              <motion.div key="products" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={productSearch} onChange={e => { setProductSearch(e.target.value); setProdPage(1); }} placeholder="Search products…"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#d4a853]" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 bg-white">
                      <Calendar size={13} />
                      <input type="date" value={prodDateStart} onChange={e => { setProdDateStart(e.target.value); setProdPage(1); }} className="border-0 outline-none bg-transparent text-xs w-[115px]" title="Start date" />
                      <span>–</span>
                      <input type="date" value={prodDateEnd} onChange={e => { setProdDateEnd(e.target.value); setProdPage(1); }} className="border-0 outline-none bg-transparent text-xs w-[115px]" title="End date" />
                    </div>
                    <button onClick={() => exportTablePdf("Products — Ethura Jewelry",
                      ["Name","Category","Sale Price","Orig. Price","Stock","Status","Featured","Date Added"],
                      sortedProducts.map(p => [p.name, p.category, `Rs.${p.price}`, p.compareAtPrice ? `Rs.${p.compareAtPrice}` : "—", String(p.stock ?? "—"), p.isActive ? "Active" : "Inactive", p.isFeatured ? "Yes" : "No", new Date(p.createdAt).toLocaleDateString("en-IN")])
                    )} className="flex items-center gap-1.5 text-xs border border-border bg-white px-3 py-1.5 rounded-lg hover:bg-[#1a1612] hover:text-white hover:border-[#1a1612] transition-all">
                      <FileDown size={13} /> PDF
                    </button>
                    <button onClick={loadProducts} className="p-2 rounded-lg border border-border bg-white hover:bg-muted/30" title="Refresh">
                      <RefreshCw size={14} className={productsLoading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={openAddProduct} className="flex items-center gap-1.5 bg-[#1a1612] text-white px-4 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-[#d4a853] hover:text-[#1a1612] transition-all">
                      <Plus size={14} /> Add Product
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Product <SortBtn col="name" cur={prodSortCol} dir={prodSortDir} onClick={() => { setProdSortCol("name"); setProdSortDir(prodSortCol==="name" && prodSortDir==="desc" ? "asc" : "desc"); setProdPage(1); }} />
                        </th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Category <SortBtn col="category" cur={prodSortCol} dir={prodSortDir} onClick={() => { setProdSortCol("category"); setProdSortDir(prodSortCol==="category" && prodSortDir==="desc" ? "asc" : "desc"); setProdPage(1); }} />
                        </th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">
                          Price <SortBtn col="price" cur={prodSortCol} dir={prodSortDir} onClick={() => { setProdSortCol("price"); setProdSortDir(prodSortCol==="price" && prodSortDir==="desc" ? "asc" : "desc"); setProdPage(1); }} />
                        </th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">
                          Stock <SortBtn col="stock" cur={prodSortCol} dir={prodSortDir} onClick={() => { setProdSortCol("stock"); setProdSortDir(prodSortCol==="stock" && prodSortDir==="desc" ? "asc" : "desc"); setProdPage(1); }} />
                        </th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Featured</th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">Active</th>
                        <th className="text-right px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-muted border border-border">
                                {(p.featureImageUrl || p.imageKey || p.imageUrl) && (
                                  <img src={p.featureImageUrl || resolveImage(p.imageKey, p.imageUrl)} alt={p.name} className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-[13px] text-foreground">{p.name}</p>
                                {p.badge && <span className="text-[10px] bg-[#d4a853]/20 text-[#b8903f] px-1.5 py-0.5 rounded-md font-semibold">{p.badge}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-muted-foreground capitalize">{p.category}</td>
                          <td className="px-4 py-3.5 text-[13px] font-semibold hidden md:table-cell">{inr(p.price)}</td>
                          <td className="px-4 py-3.5 text-[13px] hidden md:table-cell">
                            {p.stock !== null && p.stock !== undefined ? (
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.stock <= 4 ? "bg-red-100 text-red-700" : p.stock <= 10 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                                {p.stock} left
                              </span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const featuredCount = adminProducts.filter(x => x.isFeatured).length;
                              const atLimit = !p.isFeatured && featuredCount >= 6;
                              return (
                                <button onClick={() => !atLimit && toggleFeatured(p)} disabled={togglingFeatured === p.id || atLimit}
                                  className={`p-1.5 rounded-lg transition-all ${p.isFeatured ? "bg-[#d4a853]/20 text-[#d4a853]" : atLimit ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-[#d4a853] hover:bg-[#d4a853]/10"}`}
                                  title={p.isFeatured ? "Remove from homepage" : atLimit ? "Max 6 featured products reached" : "Add to homepage"}>
                                  {p.isFeatured ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                                </button>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <button
                              onClick={() => toggleProductActive(p)}
                              className="relative inline-flex items-center h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none"
                              style={{ background: p.isActive ? "#22c55e" : "#d1d5db" }}
                              title={p.isActive ? "Set Inactive" : "Set Active"}
                            >
                              <span className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow transform transition-transform duration-200 ${p.isActive ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewingProduct(p)}
                                className="p-1.5 rounded hover:bg-[#d4a853]/10 text-muted-foreground hover:text-[#d4a853] transition-colors"
                                title="View product details"
                              >
                                <Eye size={13} />
                              </button>
                              <button onClick={() => openEditProduct(p)} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                                <Edit2 size={13} />
                              </button>
                              {deleteConfirm === p.id ? (
                                <div className="flex gap-1">
                                  <button onClick={() => deleteProduct(p.id)} className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[11px]">Delete</button>
                                  <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded hover:bg-muted/50 text-muted-foreground"><X size={13} /></button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">No products found.</div>
                  )}
                  <PaginationBar page={prodPage} total={totalProdItems} pageSize={prodPageSize} onPage={setProdPage} onPageSize={setProdPageSize} />
                </div>
                <p className="text-[11px] text-muted-foreground">{totalProdItems} product{totalProdItems !== 1 ? "s" : ""} · <span className={adminProducts.filter(p => p.isFeatured).length >= 6 ? "text-red-500 font-medium" : "text-[#d4a853]"}>{adminProducts.filter(p => p.isFeatured).length}/6 featured on homepage</span>{adminProducts.filter(p => p.isFeatured).length >= 6 && <span className="text-red-500 ml-1 text-[10px]">— limit reached</span>}</p>
              </motion.div>
            )}

            {/* ─── ORDERS ─── */}
            {section === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={orderSearch} onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }} placeholder="Search orders…"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#d4a853]" />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {["all", ...STATUS_OPTIONS].map(s => (
                      <button key={s} onClick={() => { setOrderFilter(s); setOrderPage(1); }}
                        className={`px-3 py-1.5 text-[11px] rounded-full transition-all capitalize ${orderFilter === s ? "bg-[#1a1612] text-white" : "bg-white border border-border text-muted-foreground hover:border-foreground"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 bg-white">
                    <Calendar size={13} />
                    <input type="date" value={orderDateStart} onChange={e => { setOrderDateStart(e.target.value); setOrderPage(1); }} className="border-0 outline-none bg-transparent text-xs w-[115px]" title="Start date" />
                    <span>–</span>
                    <input type="date" value={orderDateEnd} onChange={e => { setOrderDateEnd(e.target.value); setOrderPage(1); }} className="border-0 outline-none bg-transparent text-xs w-[115px]" title="End date" />
                  </div>
                  <button onClick={() => exportTablePdf("Orders — Ethura Jewelry",
                    ["Order ID","Customer","Email","Date","Status","Amount","Payment"],
                    sortedOrders.map(o => [o.id, o.guestName||"Guest", o.guestEmail||"—", new Date(o.createdAt).toLocaleDateString("en-IN"), o.status, `Rs.${o.total}`, o.paymentStatus])
                  )} className="flex items-center gap-1.5 text-xs border border-border bg-white px-3 py-1.5 rounded-lg hover:bg-[#1a1612] hover:text-white hover:border-[#1a1612] transition-all">
                    <FileDown size={13} /> PDF
                  </button>
                  <button onClick={loadOrders} className="p-2 rounded-lg border border-border bg-white hover:bg-muted/30">
                    <RefreshCw size={14} className={ordersLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                  {filteredOrders.length === 0 && totalOrderItems === 0 ? (
                    <div className="text-center py-16 text-muted-foreground text-[14px]">No orders found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Order</th>
                          <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">Customer</th>
                          <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">
                            Date <SortBtn col="createdAt" cur={orderSortCol} dir={orderSortDir} onClick={() => { setOrderSortCol("createdAt"); setOrderSortDir(orderSortCol==="createdAt"&&orderSortDir==="desc"?"asc":"desc"); setOrderPage(1); }} />
                          </th>
                          <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Status <SortBtn col="status" cur={orderSortCol} dir={orderSortDir} onClick={() => { setOrderSortCol("status"); setOrderSortDir(orderSortCol==="status"&&orderSortDir==="desc"?"asc":"desc"); setOrderPage(1); }} />
                          </th>
                          <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">
                            Amount <SortBtn col="total" cur={orderSortCol} dir={orderSortDir} onClick={() => { setOrderSortCol("total"); setOrderSortDir(orderSortCol==="total"&&orderSortDir==="desc"?"asc":"desc"); setOrderPage(1); }} />
                          </th>
                          <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredOrders.map(o => (
                          <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-mono text-[12px] font-semibold text-foreground">{o.id.slice(0, 16)}…</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{(o.items?.length || 0)} item{(o.items?.length || 0) !== 1 ? "s" : ""}</p>
                            </td>
                            <td className="px-4 py-3.5 hidden sm:table-cell">
                              <p className="text-[13px] font-semibold">{o.guestName || "Guest"}</p>
                              <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">{o.guestEmail}</p>
                            </td>
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              <p className="text-[13px] text-foreground">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                              <p className="text-[11px] text-muted-foreground">{new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              {/* Inline quick-status select */}
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={o.status}
                                  disabled={updatingOrder === o.id || o.status === "cancelled"}
                                  onChange={e => updateOrderStatus(o.id, e.target.value)}
                                  className={`text-[11px] px-2.5 py-1 rounded-full font-semibold cursor-pointer border-0 outline-none appearance-none pr-5 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}
                                  style={{ backgroundImage: o.status !== "cancelled" ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")` : "none", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
                                  title="Quick-update status"
                                >
                                  {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                  ))}
                                </select>
                                {updatingOrder === o.id && (
                                  <RefreshCw size={11} className="animate-spin text-muted-foreground flex-shrink-0" />
                                )}
                              </div>
                              {o.status === "cancelled" && o.cancelledBy && (
                                <p className="text-[9px] text-red-500 mt-0.5 font-medium">Cancelled by {o.cancelledBy}</p>
                              )}
                              {o.statusUpdatedAt && (
                                <p className="text-[9px] text-muted-foreground mt-0.5">
                                  {new Date(o.statusUpdatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} {new Date(o.statusUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5 hidden sm:table-cell">
                              <p className="text-[13px] font-bold text-[#d4a853]">{inr(o.total)}</p>
                              <p className={`text-[11px] mt-0.5 font-semibold ${o.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"}`}>
                                {o.paymentStatus === "paid" ? "✓ Paid" : "Pending"}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1a1612] border border-[#1a1612] px-3 py-1.5 rounded-lg hover:bg-[#1a1612] hover:text-white transition-all whitespace-nowrap"
                              >
                                <Eye size={12} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  )}
                  <PaginationBar page={orderPage} total={totalOrderItems} pageSize={orderPageSize} onPage={setOrderPage} onPageSize={setOrderPageSize} />
                </div>
              </motion.div>
            )}

            {/* ─── ORDER DETAIL MODAL ─── */}
            <AnimatePresence>
              {selectedOrder && (
                <>
                  <motion.div
                    key="order-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 z-50"
                    onClick={() => setSelectedOrder(null)}
                  />
                  <motion.div
                    key="order-drawer"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 320, damping: 35 }}
                    className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#f8f6f3] z-50 shadow-2xl overflow-y-auto"
                  >
                    {/* Drawer Header */}
                    <div className="sticky top-0 bg-[#1a1612] text-white px-6 py-4 flex items-center justify-between z-10">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/60 mb-0.5">Order Details</p>
                        <p className="font-mono font-bold text-lg">{selectedOrder.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[11px] px-3 py-1.5 rounded-full font-semibold inline-flex ${STATUS_COLORS[selectedOrder.status] || "bg-gray-100 text-gray-600"}`}>
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                            {selectedOrder.status === "cancelled" && selectedOrder.cancelledBy && (
                              <span className="ml-1 font-normal opacity-80">by {selectedOrder.cancelledBy}</span>
                            )}
                          </span>
                          {selectedOrder.statusUpdatedAt && (
                            <span className="text-[9px] text-white/50">
                              {new Date(selectedOrder.statusUpdatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {new Date(selectedOrder.statusUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => printOrderBill(selectedOrder)}
                          title="Print / Download Invoice"
                          className="flex items-center gap-1.5 bg-[#d4a853] text-[#1a1612] text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#e8c87a] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                          Print Bill
                        </button>
                        <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ml-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">

                      {/* ── Placed On / Quick Summary ── */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Placed On", value: new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) + " · " + new Date(selectedOrder.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
                          { label: "Items", value: `${selectedOrder.items?.length || 0} product${(selectedOrder.items?.length || 0) !== 1 ? "s" : ""}` },
                          { label: "Order Total", value: inr(selectedOrder.total) },
                        ].map(s => (
                          <div key={s.label} className="bg-white rounded-xl border border-border p-3">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
                            <p className="text-xs font-semibold text-foreground">{s.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* ── Customer Information ── */}
                      <div className="bg-white rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span className="text-[11px] font-semibold uppercase tracking-widest">Customer Information</span>
                          {selectedOrder.userId ? (
                            <span className="ml-auto inline-flex items-center bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Registered Account</span>
                          ) : (
                            <span className="ml-auto inline-flex items-center bg-gray-100 text-gray-600 text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Guest Order</span>
                          )}
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Full Name</p>
                            <p className="text-sm font-semibold">{selectedOrder.guestName || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Email Address</p>
                            <p className="text-sm font-medium break-all">{selectedOrder.guestEmail || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Phone Number</p>
                            <p className="text-sm font-medium">{selectedOrder.guestPhone || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Customer Type</p>
                            <p className="text-sm font-medium">{selectedOrder.userId ? "Registered User" : "Guest Checkout"}</p>
                          </div>
                        </div>
                      </div>

                      {/* ── Shipping Address ── */}
                      <div className="bg-white rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span className="text-[11px] font-semibold uppercase tracking-widest">Shipping Address</span>
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-semibold text-foreground mb-1">{selectedOrder.guestName}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{selectedOrder.address}</p>
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            {[
                              { label: "City", value: selectedOrder.shippingCity },
                              { label: "State", value: selectedOrder.shippingState },
                              { label: "PIN Code", value: selectedOrder.shippingZip },
                              { label: "Country", value: selectedOrder.shippingCountry },
                            ].map(f => (
                              <div key={f.label}>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{f.label}</p>
                                <p className="text-xs font-medium">{f.value || "—"}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ── Payment Details ── */}
                      <div className="bg-white rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          <span className="text-[11px] font-semibold uppercase tracking-widest">Payment Information</span>
                          <span className={`ml-auto inline-flex items-center text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${selectedOrder.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {selectedOrder.paymentStatus === "paid" ? "✓ Paid" : "⏳ Pending"}
                          </span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Payment Method</p>
                            <p className="text-sm font-medium capitalize">{selectedOrder.paymentMethod === "razorpay" ? "Razorpay (Online)" : selectedOrder.paymentMethod === "cod" ? "Cash on Delivery" : selectedOrder.paymentMethod || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Payment Status</p>
                            <p className={`text-sm font-semibold ${selectedOrder.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"}`}>
                              {selectedOrder.paymentStatus ? selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1) : "—"}
                            </p>
                          </div>
                          {selectedOrder.paymentId && (
                            <div className="col-span-2">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Payment ID</p>
                              <p className="text-xs font-mono bg-muted/30 px-2 py-1 rounded break-all">{selectedOrder.paymentId}</p>
                            </div>
                          )}
                          {selectedOrder.razorpayOrderId && (
                            <div className="col-span-2">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Razorpay Order ID</p>
                              <p className="text-xs font-mono bg-muted/30 px-2 py-1 rounded break-all">{selectedOrder.razorpayOrderId}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Order Items ── */}
                      <div className="bg-white rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          <span className="text-[11px] font-semibold uppercase tracking-widest">Order Items</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">{selectedOrder.items?.length || 0} item{(selectedOrder.items?.length || 0) !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="divide-y divide-border">
                          {(selectedOrder.items || []).map((item, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3">
                              <div className="w-10 h-10 rounded-lg bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0 text-[#d4a853] text-lg">
                                ✦
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                                <p className="text-[11px] text-muted-foreground">Qty: {item.quantity} × {inr(item.productPrice)}</p>
                                {item.isGift && item.giftMessage && (
                                  <p className="text-[10px] text-amber-600 mt-0.5">🎁 Gift: {item.giftMessage}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-[#d4a853]">{inr(item.productPrice * item.quantity)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Totals */}
                        <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{inr(selectedOrder.total)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Shipping</span>
                            <span className="text-green-600 font-medium">Free</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                            <span>Total Paid</span>
                            <span className="text-[#d4a853]">{inr(selectedOrder.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Gift Order ── */}
                      {selectedOrder.isGift && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">🎁</span>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-800">Gift Order</p>
                          </div>
                          {selectedOrder.giftMessage && (
                            <p className="text-sm text-amber-900 italic">"{selectedOrder.giftMessage}"</p>
                          )}
                        </div>
                      )}

                      {/* ── Update Order Status ── */}
                      <div className="bg-white rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          <span className="text-[11px] font-semibold uppercase tracking-widest">Update Order Status</span>
                        </div>
                        <div className="p-4">
                          {/* Order Status Timeline */}
                          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                            {["pending", "processing", "shipped", "delivered", "cancelled"].map((s, i, arr) => {
                              const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
                              const curIdx = statuses.indexOf(selectedOrder.status);
                              const thisIdx = statuses.indexOf(s);
                              const isCancelled = selectedOrder.status === "cancelled";
                              const isDone = !isCancelled && thisIdx <= curIdx;
                              const isCurrent = s === selectedOrder.status;
                              return (
                                <div key={s} className="flex items-center gap-1 flex-shrink-0">
                                  <div className={`flex flex-col items-center`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                      isCancelled && isCurrent ? "border-red-400 bg-red-100 text-red-600" :
                                      isDone ? "border-[#d4a853] bg-[#d4a853] text-white" :
                                      "border-border bg-white text-muted-foreground"
                                    }`}>
                                      {isDone && !isCurrent ? "✓" : isCurrent ? "●" : (i + 1)}
                                    </div>
                                    <p className={`text-[9px] mt-1 capitalize whitespace-nowrap ${isCurrent ? "font-bold text-foreground" : "text-muted-foreground"}`}>{s}</p>
                                  </div>
                                  {i < arr.length - 1 && (
                                    <div className={`w-5 h-px mb-4 mx-0.5 ${!isCancelled && thisIdx < curIdx ? "bg-[#d4a853]" : "bg-border"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex gap-3">
                            <select
                              defaultValue={selectedOrder.status}
                              onChange={async e => {
                                const newStatus = e.target.value;
                                await updateOrderStatus(selectedOrder.id, newStatus);
                                setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
                                setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
                              }}
                              disabled={updatingOrder === selectedOrder.id}
                              className="flex-1 text-sm border border-border rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40"
                            >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                            {updatingOrder === selectedOrder.id && (
                              <div className="w-10 h-10 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* ─── CUSTOMERS ─── */}
            {section === "customers" && (
              <motion.div key="customers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap justify-between">
                  <div className="relative flex-1 min-w-[180px] max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={custSearch} onChange={e => { setCustSearch(e.target.value); setCustPage(1); }} placeholder="Search customers…"
                      className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#d4a853]" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 bg-white">
                      <Calendar size={13} />
                      <input type="date" value={custDateStart} onChange={e => { setCustDateStart(e.target.value); setCustPage(1); }} className="border-0 outline-none bg-transparent text-xs w-[115px]" title="Joined from" />
                      <span>–</span>
                      <input type="date" value={custDateEnd} onChange={e => { setCustDateEnd(e.target.value); setCustPage(1); }} className="border-0 outline-none bg-transparent text-xs w-[115px]" title="Joined until" />
                    </div>
                    <button onClick={() => exportTablePdf("Customers — Ethura Jewelry",
                      ["Name","Email","Role","Orders","Total Spent","Member Since"],
                      sortedCustomers.map(c => [c.name, c.email, c.isAdmin?"Admin":"Customer", String(c.orderCount), `Rs.${c.totalSpent}`, new Date(c.createdAt).toLocaleDateString("en-IN")])
                    )} className="flex items-center gap-1.5 text-xs border border-border bg-white px-3 py-1.5 rounded-lg hover:bg-[#1a1612] hover:text-white hover:border-[#1a1612] transition-all">
                      <FileDown size={13} /> PDF
                    </button>
                    <button onClick={loadCustomers} className="p-2 rounded-lg border border-border bg-white hover:bg-muted/30">
                      <RefreshCw size={14} className={customersLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Customer <SortBtn col="name" cur={custSortCol} dir={custSortDir} onClick={() => { setCustSortCol("name"); setCustSortDir(custSortCol==="name"&&custSortDir==="desc"?"asc":"desc"); setCustPage(1); }} />
                        </th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">Role</th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Orders <SortBtn col="orderCount" cur={custSortCol} dir={custSortDir} onClick={() => { setCustSortCol("orderCount"); setCustSortDir(custSortCol==="orderCount"&&custSortDir==="desc"?"asc":"desc"); setCustPage(1); }} />
                        </th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">
                          Total Spent <SortBtn col="totalSpent" cur={custSortCol} dir={custSortDir} onClick={() => { setCustSortCol("totalSpent"); setCustSortDir(custSortCol==="totalSpent"&&custSortDir==="desc"?"asc":"desc"); setCustPage(1); }} />
                        </th>
                        <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">
                          Member Since <SortBtn col="createdAt" cur={custSortCol} dir={custSortDir} onClick={() => { setCustSortCol("createdAt"); setCustSortDir(custSortCol==="createdAt"&&custSortDir==="desc"?"asc":"desc"); setCustPage(1); }} />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pagedCustomers.map(c => (
                        <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4a853]/30 to-[#b8903f]/20 border border-[#d4a853]/20 flex items-center justify-center text-[#b8903f] font-bold text-sm shrink-0">
                                {c.name[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-[13px]">{c.name}</p>
                                <p className="text-[11px] text-muted-foreground">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            {c.isAdmin ? (
                              <span className="inline-flex items-center bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Admin</span>
                            ) : (
                              <span className="inline-flex items-center bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Customer</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] font-semibold">{c.orderCount}</td>
                          <td className="px-4 py-3.5 text-[13px] font-bold text-[#d4a853] hidden md:table-cell">{inr(c.totalSpent)}</td>
                          <td className="px-4 py-3.5 text-[12px] text-muted-foreground hidden md:table-cell">{new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  {pagedCustomers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">No registered customers yet.</div>
                  )}
                  <PaginationBar page={custPage} total={totalCustItems} pageSize={custPageSize} onPage={setCustPage} onPageSize={setCustPageSize} />
                </div>
              </motion.div>
            )}

            {/* ─── HOMEPAGE PRODUCTS ─── */}
            {section === "homepage-products" && (
              <motion.div key="homepage-products" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {(() => {
                  const featuredCount = adminProducts.filter(p => p.isFeatured).length;
                  const atLimit = featuredCount >= 6;
                  return (
                    <>
                      <div className={`border rounded-xl p-4 text-sm ${atLimit ? "bg-red-50 border-red-200" : "bg-[#1a1612]/5 border-[#d4a853]/30"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-[#1a1612] mb-0.5">⭐ Featured Products — "The Ethura Edit"</p>
                            <p className="text-muted-foreground text-xs">
                              {atLimit
                                ? "Maximum 6 products selected. Remove one to add another."
                                : `Select up to 6 products to feature on the homepage. ${6 - featuredCount} slot${6 - featuredCount !== 1 ? "s" : ""} remaining.`
                              }
                            </p>
                          </div>
                          <div className={`shrink-0 text-xl font-bold rounded-xl w-14 h-14 flex flex-col items-center justify-center ${atLimit ? "bg-red-100 text-red-600" : "bg-[#d4a853]/15 text-[#d4a853]"}`}>
                            <span className="leading-none">{featuredCount}</span>
                            <span className="text-[10px] font-normal mt-0.5">/ 6</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {adminProducts.filter(p => p.isActive).map(p => {
                          const img = p.featureImageUrl || resolveImage(p.imageKey, p.imageUrl);
                          const canFeature = p.isFeatured || !atLimit;
                          return (
                            <div key={p.id} className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden transition-all ${p.isFeatured ? "border-[#d4a853]" : "border-border"}`}>
                              <div className="relative aspect-square overflow-hidden bg-muted">
                                {img ? (
                                  <img src={img} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-muted-foreground/40" /></div>
                                )}
                                {p.isFeatured && (
                                  <div className="absolute top-2 right-2 bg-[#d4a853] rounded-full p-1">
                                    <Star size={10} fill="white" className="text-white" />
                                  </div>
                                )}
                                {!canFeature && (
                                  <div className="absolute inset-0 bg-white/40" />
                                )}
                              </div>
                              <div className="p-2.5">
                                <p className="text-xs font-medium line-clamp-1 mb-0.5">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground mb-2">{inr(p.price)}</p>
                                <button
                                  onClick={() => canFeature && toggleFeatured(p)}
                                  disabled={togglingFeatured === p.id || !canFeature}
                                  className={`w-full py-1.5 rounded-lg text-[10px] font-medium uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${
                                    p.isFeatured
                                      ? "bg-[#d4a853] text-[#1a1612] hover:bg-[#c49843]"
                                      : !canFeature
                                        ? "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                                        : "bg-muted/50 text-muted-foreground hover:bg-[#d4a853]/20 hover:text-[#b8903f]"
                                  }`}>
                                  {togglingFeatured === p.id ? <RefreshCw size={10} className="animate-spin" /> : p.isFeatured ? <><StarOff size={10} /> Remove</> : <><Star size={10} /> Feature</>}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* ─── FEATURE CARDS (Ethura Edit) ─── */}
            {section === "feature-cards" && (
              <motion.div key="feature-cards" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Manage the feature highlight cards shown on your homepage.</p>
                  <button onClick={openAddCard} className="flex items-center gap-1.5 bg-[#1a1612] text-white px-4 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-[#d4a853] hover:text-[#1a1612] transition-all">
                    <Plus size={14} /> Add Card
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cardsLoading ? Array.from({length: 3}).map((_,i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-border animate-pulse h-36" />
                  )) : featureCards.map(c => (
                    <div key={c.id} className="bg-white rounded-xl border border-border p-5 shadow-sm relative">
                      {c.badge && <span className="text-[9px] bg-[#d4a853]/20 text-[#b8903f] px-2 py-0.5 rounded font-medium uppercase tracking-wide">{c.badge}</span>}
                      <h4 className="font-serif text-base mt-2 mb-1">{c.title}</h4>
                      <p className="text-xs text-muted-foreground mb-1">{c.subtitle}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {c.isActive ? "Visible" : "Hidden"}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => openEditCard(c)} className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                          <button onClick={() => deleteCard(c.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── REPORTS ─── */}
            {section === "reports" && (
              <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {kpi && [
                    { label: "Revenue", value: inr(kpi.totalRevenue), sub: "all time" },
                    { label: "Orders", value: kpi.totalOrders, sub: "total placed" },
                    { label: "Delivered", value: kpi.deliveredOrders, sub: `${kpi.totalOrders ? Math.round(kpi.deliveredOrders / kpi.totalOrders * 100) : 0}% completion` },
                    { label: "Low Stock", value: kpi.lowStockProducts, sub: "products ≤ 4 left" },
                  ].map(k => (
                    <div key={k.label} className="bg-white rounded-xl p-4 border border-border shadow-sm">
                      <p className="text-xl font-bold">{k.value}</p>
                      <p className="text-xs font-medium mt-0.5">{k.label}</p>
                      <p className="text-[10px] text-muted-foreground">{k.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Products per Category</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={categoryData} barCategoryGap="25%">
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }} />
                        <Bar dataKey="Products" fill="#d4a853" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Avg Price by Category (₹)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={categoryData} barCategoryGap="25%">
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                          formatter={(v: number) => [inr(v), "Avg Price"]} />
                        <Bar dataKey="Avg ₹" fill="#1a1612" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Order Status Distribution</h3>
                    {orderStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {orderStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No orders yet</div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Stock Health</h3>
                    <div className="space-y-3">
                      {adminProducts.filter(p => p.isActive && p.stock !== null).sort((a, b) => (a.stock || 0) - (b.stock || 0)).slice(0, 8).map(p => (
                        <div key={p.id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground truncate max-w-[60%]">{p.name}</span>
                            <span className={`font-semibold ${(p.stock || 0) <= 4 ? "text-red-600" : (p.stock || 0) <= 10 ? "text-amber-600" : "text-green-600"}`}>{p.stock} left</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full">
                            <div className={`h-1.5 rounded-full ${(p.stock || 0) <= 4 ? "bg-red-400" : (p.stock || 0) <= 10 ? "bg-amber-400" : "bg-green-400"}`}
                              style={{ width: `${Math.min(((p.stock || 0) / 30) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                      {adminProducts.filter(p => p.isActive && p.stock !== null).length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">No stock data available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── SETTINGS ─── */}
            {section === "pages" && (
              <motion.div key="pages" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <PageEditor
                  initialContent={pageContent}
                  onContentSaved={updates => setPageContent(prev => ({ ...prev, ...updates }))}
                />
              </motion.div>
            )}

            {/* ─── CONTACT MESSAGES ─── */}
            {section === "contact-messages" && (
              <motion.div key="contact-messages" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-serif text-xl">Contact Messages</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Messages submitted via the contact form</p>
                  </div>
                  <div className="flex gap-2">
                    {(["all", "unread", "read", "replied"] as const).map(f => (
                      <button key={f} onClick={() => setContactFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${contactFilter === f ? "bg-[#1a1612] text-white border-[#1a1612]" : "border-border text-muted-foreground hover:border-[#1a1612]"}`}>
                        {f}
                      </button>
                    ))}
                    <button onClick={loadContactMessages} className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted/30 transition-all flex items-center gap-1.5 text-muted-foreground">
                      <RefreshCw size={12} className={contactMessagesLoading ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  </div>
                </div>

                {contactMessagesLoading ? (
                  <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <div className="space-y-3">
                    {contactMessages
                      .filter(m => contactFilter === "all" || m.status === contactFilter)
                      .map(msg => (
                        <div key={msg.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${msg.status === "unread" ? "border-[#d4a853]/50" : "border-border"}`}>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-medium text-sm">{msg.name}</span>
                                  <a href={`mailto:${msg.email}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                    <Mail size={11} />{msg.email}
                                  </a>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${msg.status === "unread" ? "bg-amber-100 text-amber-700" : msg.status === "replied" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                                    {msg.status}
                                  </span>
                                </div>
                                {msg.subject && <p className="text-xs text-muted-foreground mb-2 font-medium">Subject: {msg.subject}</p>}
                                <p className="text-sm text-foreground leading-relaxed">{msg.message}</p>
                                {msg.replyContent && (
                                  <div className="mt-3 pl-3 border-l-2 border-[#d4a853]/40">
                                    <p className="text-[10px] uppercase tracking-widest text-[#d4a853] mb-1">Your Reply</p>
                                    <p className="text-sm text-muted-foreground">{msg.replyContent}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <p className="text-[11px] text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                <div className="flex gap-1.5">
                                  {msg.status === "unread" && (
                                    <button onClick={() => markContactRead(msg.id)}
                                      className="text-[11px] px-2 py-1 rounded-lg border border-border hover:bg-muted/30 transition-all flex items-center gap-1 text-muted-foreground">
                                      <Eye size={11} /> Mark Read
                                    </button>
                                  )}
                                  <button onClick={() => { setContactReplyId(contactReplyId === msg.id ? null : msg.id); setContactReplyText(""); }}
                                    className="text-[11px] px-2 py-1 rounded-lg border border-border hover:border-[#d4a853] hover:text-[#d4a853] transition-all flex items-center gap-1 text-muted-foreground">
                                    <Reply size={11} /> Reply
                                  </button>
                                  <button onClick={async () => { await api.contact.delete(msg.id); setContactMessages(prev => prev.filter(m => m.id !== msg.id)); }}
                                    className="text-[11px] px-2 py-1 rounded-lg border border-border hover:border-red-400 hover:text-red-500 transition-all flex items-center gap-1 text-muted-foreground">
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {contactReplyId === msg.id && (
                              <div className="mt-4 pt-4 border-t border-border space-y-3">
                                <textarea
                                  value={contactReplyText}
                                  onChange={e => setContactReplyText(e.target.value)}
                                  rows={4}
                                  placeholder="Type your reply..."
                                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853] resize-none"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => { setContactReplyId(null); setContactReplyText(""); }}
                                    className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/30 transition-colors">Cancel</button>
                                  <button onClick={() => sendContactReply(msg.id)} disabled={contactReplying || !contactReplyText.trim()}
                                    className="flex-1 px-4 py-2 rounded-lg bg-[#1a1612] text-white text-sm hover:bg-[#d4a853] hover:text-[#1a1612] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {contactReplying ? <RefreshCw size={13} className="animate-spin" /> : <Reply size={13} />}
                                    Send Reply
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    {contactMessages.filter(m => contactFilter === "all" || m.status === contactFilter).length === 0 && (
                      <div className="text-center py-16">
                        <MessageCircle size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No {contactFilter === "all" ? "" : contactFilter + " "}messages yet</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── MARQUEE / HEADLINES ─── */}
            {section === "marquee" && (
              <motion.div key="marquee" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-serif text-xl">Marquee / Headlines</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage the scrolling text items on the homepage marquee</p>
                  </div>
                  <button
                    onClick={() => {
                      setMarqueeLoading(true);
                      api.siteFeatures.listAll().then(f => { setMarqueeFeatures(f); setMarqueeLoading(false); }).catch(() => setMarqueeLoading(false));
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted/30 transition-all flex items-center gap-1.5 text-muted-foreground"
                  >
                    <RefreshCw size={12} className={marqueeLoading ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>

                {marqueeError && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                    <AlertCircle size={14} /> {marqueeError}
                    <button onClick={() => setMarqueeError("")} className="ml-auto"><X size={12} /></button>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <input
                      type="text"
                      value={newMarqueeLabel}
                      onChange={e => setNewMarqueeLabel(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === "Enter" && newMarqueeLabel.trim()) {
                          try { setMarqueeError(""); const created = await api.siteFeatures.create({ label: newMarqueeLabel.trim(), isActive: true }); setMarqueeFeatures(prev => [...prev, created]); setNewMarqueeLabel(""); } catch { setMarqueeError("Failed to add item"); }
                        }
                      }}
                      placeholder="Add new marquee item (e.g. '18K Gold Plated')…"
                      className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground/60"
                    />
                    <button
                      onClick={async () => {
                        if (!newMarqueeLabel.trim()) return;
                        try { setMarqueeError(""); const created = await api.siteFeatures.create({ label: newMarqueeLabel.trim(), isActive: true }); setMarqueeFeatures(prev => [...prev, created]); setNewMarqueeLabel(""); } catch { setMarqueeError("Failed to add item"); }
                      }}
                      disabled={!newMarqueeLabel.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#d4a853] text-[#1a1612] hover:bg-[#c49840] disabled:opacity-40 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {marqueeLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : marqueeFeatures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Megaphone size={28} className="opacity-30 mb-3" />
                      <p className="text-sm">No marquee items yet</p>
                      <p className="text-xs opacity-60 mt-1">Add items above to show in the homepage marquee</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {[...marqueeFeatures].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)).map(feat => (
                        <div key={feat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                          {editMarqueeId === feat.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={editMarqueeLabel}
                                onChange={e => setEditMarqueeLabel(e.target.value)}
                                onKeyDown={async e => {
                                  if (e.key === "Enter" && editMarqueeLabel.trim()) {
                                    try { setMarqueeError(""); const updated = await api.siteFeatures.update(feat.id, { label: editMarqueeLabel.trim() }); setMarqueeFeatures(prev => prev.map(f => f.id === feat.id ? updated : f)); setEditMarqueeId(null); } catch { setMarqueeError("Failed to update item"); }
                                  }
                                  if (e.key === "Escape") setEditMarqueeId(null);
                                }}
                                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-[#d4a853] outline-none focus:ring-2 focus:ring-[#d4a853]/30"
                                autoFocus
                              />
                              <button
                                onClick={async () => {
                                  if (!editMarqueeLabel.trim()) return;
                                  try { setMarqueeError(""); const updated = await api.siteFeatures.update(feat.id, { label: editMarqueeLabel.trim() }); setMarqueeFeatures(prev => prev.map(f => f.id === feat.id ? updated : f)); setEditMarqueeId(null); } catch { setMarqueeError("Failed to update item"); }
                                }}
                                className="p-1.5 rounded border border-[#d4a853] text-[#d4a853]"
                              >
                                <Check size={12} />
                              </button>
                              <button onClick={() => setEditMarqueeId(null)} className="p-1.5 rounded border border-border text-muted-foreground">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Megaphone size={14} className="text-[#d4a853] flex-shrink-0" />
                              <span className="flex-1 text-sm font-medium truncate">{feat.label}</span>
                              <button
                                onClick={async () => {
                                  try { setMarqueeError(""); const updated = await api.siteFeatures.update(feat.id, { isActive: !feat.isActive }); setMarqueeFeatures(prev => prev.map(f => f.id === feat.id ? updated : f)); } catch { setMarqueeError("Failed to toggle status"); }
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                                  feat.isActive
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    : "bg-red-50 text-red-500 border-red-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                }`}
                              >
                                {feat.isActive ? "Active" : "Disabled"}
                              </button>
                              <button
                                onClick={() => { setEditMarqueeId(feat.id); setEditMarqueeLabel(feat.label); }}
                                className="p-1.5 rounded hover:bg-muted/30 text-muted-foreground hover:text-[#1a1612] transition-all"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete "${feat.label}"?`)) return;
                                  try { setMarqueeError(""); await api.siteFeatures.delete(feat.id); setMarqueeFeatures(prev => prev.filter(f => f.id !== feat.id)); } catch { setMarqueeError("Failed to delete item"); }
                                }}
                                className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#faf8f5] rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Preview:</strong> These items scroll across the homepage as a marquee strip. Add 4-5 items for the best visual effect. Items marked as "Active" will be shown on the homepage.
                  </p>
                  <div className="mt-3 py-2 border-t border-border/50 flex items-center gap-4 overflow-hidden text-[10px] uppercase tracking-[0.25em] text-[#5a4a3a]">
                    {marqueeFeatures.filter(f => f.isActive).map((f, i) => (
                      <span key={f.id} className="whitespace-nowrap flex items-center gap-4">
                        {i > 0 && <span className="text-[#d4a853]">·</span>}
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── MASTER TABLE ─── */}
            {section === "master-table" && (
              <motion.div key="master-table" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl">Master Table</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage product types and their categories</p>
                  </div>
                  <button onClick={loadMaster} className="p-2 rounded-lg border border-border bg-white hover:bg-muted/30">
                    <RefreshCw size={15} className={masterLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {masterLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                    {/* ── Left: Product Types panel ── */}
                    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-[#1a1612] text-white">
                        <span className="text-sm font-semibold tracking-wide">Product Types</span>
                        <button
                          onClick={() => setShowAddType(!showAddType)}
                          className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {showAddType && (
                        <div className="px-4 py-3 border-b border-border bg-[#faf8f5] flex gap-2">
                          <input
                            autoFocus
                            value={newTypeName}
                            onChange={e => setNewTypeName(e.target.value)}
                            placeholder="e.g. Bags, Watches…"
                            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                          />
                          <button
                            disabled={masterSaving || !newTypeName.trim()}
                            onClick={async () => {
                              if (!newTypeName.trim()) return;
                              setMasterSaving(true);
                              try {
                                const slug = newTypeName.trim().toLowerCase().replace(/\s+/g, "-");
                                const t = await api.master.createType({ name: newTypeName.trim(), slug });
                                setProductTypes(prev => [...prev, t]);
                                setNewTypeName(""); setShowAddType(false);
                                showSuccess("Product type added!");
                              } catch { setError("Failed to add type."); }
                              finally { setMasterSaving(false); }
                            }}
                            className="px-3 py-2 bg-[#d4a853] text-[#1a1612] text-sm font-semibold rounded-lg disabled:opacity-50"
                          >
                            <Check size={13} />
                          </button>
                          <button onClick={() => { setShowAddType(false); setNewTypeName(""); }} className="px-2 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/30">
                            <X size={13} />
                          </button>
                        </div>
                      )}

                      <div className="divide-y divide-border">
                        {productTypes.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-8">No product types yet</p>
                        )}
                        {productTypes.map(type => (
                          <div
                            key={type.id}
                            onClick={() => { setSelectedTypeId(type.id); setEditTypeId(null); setAddCatTypeId(null); setEditCatId(null); }}
                            className={`px-4 py-3.5 cursor-pointer transition-all group ${selectedTypeId === type.id ? "bg-[#d4a853]/10 border-l-2 border-[#d4a853]" : "hover:bg-muted/20 border-l-2 border-transparent"}`}
                          >
                            {editTypeId === type.id ? (
                              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                <div className="flex gap-2">
                                  <input
                                    autoFocus
                                    value={editTypeName}
                                    onChange={e => setEditTypeName(e.target.value)}
                                    placeholder="Type name"
                                    className="flex-1 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40"
                                  />
                                  <button
                                    disabled={masterSaving}
                                    onClick={async () => {
                                      setMasterSaving(true);
                                      try {
                                        const updated = await api.master.updateType(type.id, { name: editTypeName.trim(), imageUrl: editTypeImageUrl.trim() || null });
                                        setProductTypes(prev => prev.map(t => t.id === type.id ? updated : t));
                                        setEditTypeId(null); showSuccess("Updated!");
                                      } catch { setError("Failed to update."); }
                                      finally { setMasterSaving(false); }
                                    }}
                                    className="p-1.5 bg-[#d4a853] text-[#1a1612] rounded font-bold"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button onClick={() => setEditTypeId(null)} className="p-1.5 rounded border border-border text-muted-foreground">
                                    <X size={12} />
                                  </button>
                                </div>
                                <input
                                  value={editTypeImageUrl}
                                  onChange={e => setEditTypeImageUrl(e.target.value)}
                                  placeholder="Image URL (optional)"
                                  className="w-full border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{type.name}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {productCategories.filter(c => c.typeId === type.id && c.isActive).length} active categories
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => { setEditTypeId(type.id); setEditTypeName(type.name); setEditTypeImageUrl(type.imageUrl || ""); }}
                                    className="p-2 rounded hover:bg-muted/30 text-muted-foreground hover:text-[#1a1612]"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const newActive = !type.isActive;
                                      const updated = await api.master.updateType(type.id, { isActive: newActive });
                                      setProductTypes(prev => prev.map(t => t.id === type.id ? updated : t));
                                      if (!newActive) {
                                        setProductCategories(prev => prev.map(c => c.typeId === type.id ? { ...c, isActive: false } : c));
                                      }
                                    }}
                                    className={`p-2 rounded text-xs ${type.isActive ? "text-green-600 hover:bg-green-50" : "text-red-400 hover:bg-red-50"}`}
                                    title={type.isActive ? "Disable" : "Enable"}
                                  >
                                    {type.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                  </button>
                                </div>
                                {selectedTypeId === type.id && (
                                  <ChevronRight size={14} className="text-[#d4a853] flex-shrink-0" />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Right: Categories panel ── */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                      {!selectedTypeId ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                          <Layers size={28} className="mb-3 opacity-30" />
                          <p className="text-sm">Select a product type to manage its categories</p>
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const type = productTypes.find(t => t.id === selectedTypeId);
                            const cats = productCategories.filter(c => c.typeId === selectedTypeId);
                            return (
                              <>
                                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-semibold">{type?.name} — Categories</span>
                                    <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                                      {cats.length} total
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => { setAddCatTypeId(selectedTypeId); setNewCatName(""); }}
                                    className="flex items-center gap-1.5 text-xs font-medium border border-[#d4a853] text-[#d4a853] px-3 py-1.5 rounded-lg hover:bg-[#d4a853]/10 transition-colors"
                                  >
                                    <Plus size={12} /> Add Category
                                  </button>
                                </div>

                                {addCatTypeId === selectedTypeId && (
                                  <div className="px-5 py-3 border-b border-border bg-[#faf8f5] flex gap-2 items-center">
                                    <input
                                      autoFocus
                                      value={newCatName}
                                      onChange={e => setNewCatName(e.target.value)}
                                      placeholder="Category name e.g. Necklaces"
                                      className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                                    />
                                    <button
                                      disabled={masterSaving || !newCatName.trim()}
                                      onClick={async () => {
                                        if (!newCatName.trim()) return;
                                        setMasterSaving(true);
                                        try {
                                          const slug = newCatName.trim().toLowerCase().replace(/\s+/g, "-");
                                          const cat = await api.master.createCategory({
                                            typeId: selectedTypeId, name: newCatName.trim(), slug,
                                          });
                                          setProductCategories(prev => [...prev, cat]);
                                          setNewCatName(""); setAddCatTypeId(null);
                                          showSuccess("Category added!");
                                        } catch { setError("Failed to add category."); }
                                        finally { setMasterSaving(false); }
                                      }}
                                      className="px-3 py-2 bg-[#d4a853] text-[#1a1612] rounded-lg font-bold disabled:opacity-50"
                                    >
                                      <Check size={13} />
                                    </button>
                                    <button onClick={() => { setAddCatTypeId(null); setNewCatName(""); }} className="px-2 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/30">
                                      <X size={13} />
                                    </button>
                                  </div>
                                )}

                                {cats.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <p className="text-sm">No categories for this type yet.</p>
                                    <p className="text-xs mt-1">Click "Add Category" to create the first one.</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-muted/20 border-b border-border">
                                        <th className="text-left px-3 sm:px-5 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Name</th>
                                        <th className="text-left px-3 sm:px-5 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground font-medium hidden sm:table-cell">Slug</th>
                                        <th className="text-center px-3 sm:px-5 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                                        <th className="px-3 sm:px-5 py-2.5" />
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                      {cats.map(cat => (
                                        <tr key={cat.id} className="group hover:bg-muted/10 transition-colors">
                                          <td className="px-5 py-3">
                                            {editCatId === cat.id ? (
                                              <div className="flex gap-2">
                                                <input
                                                  autoFocus
                                                  value={editCatName}
                                                  onChange={e => setEditCatName(e.target.value)}
                                                  className="border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 w-36"
                                                />
                                                <button
                                                  disabled={masterSaving}
                                                  onClick={async () => {
                                                    setMasterSaving(true);
                                                    try {
                                                      const slug = editCatName.trim().toLowerCase().replace(/\s+/g, "-");
                                                      const updated = await api.master.updateCategory(cat.id, { name: editCatName.trim(), slug });
                                                      setProductCategories(prev => prev.map(c => c.id === cat.id ? updated : c));
                                                      setEditCatId(null); showSuccess("Updated!");
                                                    } catch { setError("Failed to update."); }
                                                    finally { setMasterSaving(false); }
                                                  }}
                                                  className="p-1.5 bg-[#d4a853] text-[#1a1612] rounded font-bold"
                                                >
                                                  <Check size={12} />
                                                </button>
                                                <button onClick={() => setEditCatId(null)} className="p-1.5 rounded border border-border text-muted-foreground">
                                                  <X size={12} />
                                                </button>
                                              </div>
                                            ) : (
                                              <span className="text-sm font-medium">{cat.name}</span>
                                            )}
                                          </td>
                                          <td className="px-3 sm:px-5 py-3 hidden sm:table-cell">
                                            <span className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded">{cat.slug}</span>
                                          </td>
                                          <td className="px-3 sm:px-5 py-3 text-center">
                                            <button
                                              onClick={async () => {
                                                const updated = await api.master.updateCategory(cat.id, { isActive: !cat.isActive });
                                                setProductCategories(prev => prev.map(c => c.id === cat.id ? updated : c));
                                              }}
                                              className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                                                cat.isActive
                                                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                  : "bg-red-50 text-red-500 border-red-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                              }`}
                                            >
                                              {cat.isActive ? "Active" : "Disabled"}
                                            </button>
                                          </td>
                                          <td className="px-5 py-3 text-right">
                                            <button
                                              onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }}
                                              className="p-2 rounded hover:bg-muted/30 text-muted-foreground hover:text-[#1a1612] transition-all"
                                            >
                                              <Edit2 size={16} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── REELS ─── */}
            {section === "reels" && (
              <motion.div key="reels" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl">Reels</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage short video reels shown in your store</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={loadReels} className="p-2 rounded-lg border border-border bg-white hover:bg-muted/30">
                      <RefreshCw size={15} className={reelsLoading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={openAddReel}
                      className="flex items-center gap-2 bg-[#1a1612] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#d4a853] hover:text-[#1a1612] transition-all">
                      <Plus size={15} /> Add Reel
                    </button>
                  </div>
                </div>

                {reelsLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-6 h-6 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : reels.length === 0 ? (
                  <div className="bg-white rounded-xl border border-border shadow-sm flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#f5ede0] flex items-center justify-center">
                      <Video size={28} className="text-[#d4a853]" />
                    </div>
                    <div className="text-center">
                      <p className="font-serif text-lg">No reels yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Upload a video or paste a URL to add your first reel</p>
                    </div>
                    <button onClick={openAddReel}
                      className="flex items-center gap-2 bg-[#1a1612] text-white px-5 py-2.5 rounded-lg text-sm hover:bg-[#d4a853] hover:text-[#1a1612] transition-all">
                      <Plus size={14} /> Add First Reel
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {reels.map(reel => (
                      <div key={reel.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden group">
                        {/* Video preview */}
                        <div className="relative aspect-[9/16] bg-[#1a1612] overflow-hidden">
                          {reel.videoUrl.startsWith("data:") || reel.videoUrl.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? (
                            <video
                              src={reel.videoUrl} muted playsInline
                              className="w-full h-full object-cover"
                              poster={reel.thumbnailUrl || undefined}
                              onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                              onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                            />
                          ) : reel.thumbnailUrl ? (
                            <img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/40">
                              <Play size={32} />
                              <span className="text-xs uppercase tracking-widest">External Link</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className={`text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${reel.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                              {reel.isActive ? "Active" : "Hidden"}
                            </span>
                          </div>
                        </div>
                        {/* Info + actions */}
                        <div className="p-3">
                          <p className="text-sm font-medium truncate mb-1">{reel.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate mb-3 flex items-center gap-1">
                            <Link size={9} className="flex-shrink-0" />
                            {reel.videoUrl.startsWith("data:") ? "Uploaded file" : reel.videoUrl}
                          </p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEditReel(reel)}
                              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] border border-border rounded-lg py-1.5 hover:bg-muted/30 transition-colors">
                              <Edit2 size={12} /> Edit
                            </button>
                            <button onClick={() => deleteReel(reel.id)}
                              className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {section === "reviews" && (() => {
              // ─── helpers ───
              const openAddReview = () => {
                setEditingReview(null);
                setReviewForm({ productId: revSelectedProductId ? String(revSelectedProductId) : "", reviewerName: "", rating: 5, title: "", body: "", imageUrl: "", isVisible: true });
                setReviewModalError("");
                setShowReviewModal(true);
              };
              const openEditReview = (r: import("@/lib/api").ApiReview) => {
                setEditingReview(r);
                setReviewForm({ productId: String(r.productId), reviewerName: r.reviewerName, rating: r.rating, title: r.title || "", body: r.body, imageUrl: r.imageUrl || "", isVisible: r.isVisible });
                setReviewModalError("");
                setShowReviewModal(true);
              };
              const saveReview = async () => {
                if (!reviewForm.reviewerName.trim()) { setReviewModalError("Reviewer name is required"); return; }
                if (!reviewForm.rating) { setReviewModalError("Please select a rating"); return; }
                if (!reviewForm.body.trim()) { setReviewModalError("Review body is required"); return; }
                if (!editingReview && !reviewForm.productId) { setReviewModalError("Please select a product"); return; }
                setReviewModalSaving(true); setReviewModalError("");
                try {
                  if (editingReview) {
                    const updated = await api.reviews.adminUpdate(editingReview.id, { reviewerName: reviewForm.reviewerName, rating: reviewForm.rating, title: reviewForm.title || undefined, body: reviewForm.body, imageUrl: reviewForm.imageUrl || undefined, isVisible: reviewForm.isVisible });
                    setReviews(prev => prev.map(r => r.id === editingReview.id ? { ...r, ...updated } : r));
                    showSuccess("Review updated!");
                  } else {
                    const created = await api.reviews.adminCreate({ productId: Number(reviewForm.productId), reviewerName: reviewForm.reviewerName, rating: reviewForm.rating, title: reviewForm.title || undefined, body: reviewForm.body, imageUrl: reviewForm.imageUrl || undefined, isVisible: reviewForm.isVisible });
                    setReviews(prev => [created, ...prev]);
                    showSuccess("Review added!");
                  }
                  setShowReviewModal(false);
                } catch (e: any) { setReviewModalError(e.message || "Save failed"); }
                finally { setReviewModalSaving(false); }
              };

              // ─── product summaries ───
              const productSummaryMap: Record<number, { productId: number; productName: string; count: number; totalRating: number; visible: number }> = {};
              reviews.forEach(r => {
                if (!productSummaryMap[r.productId]) productSummaryMap[r.productId] = { productId: r.productId, productName: r.productName || `Product #${r.productId}`, count: 0, totalRating: 0, visible: 0 };
                productSummaryMap[r.productId].count++;
                productSummaryMap[r.productId].totalRating += r.rating;
                if (r.isVisible) productSummaryMap[r.productId].visible++;
              });
              const productSummaries = Object.values(productSummaryMap).sort((a, b) => b.count - a.count);

              // ─── filter ───
              const q = revSearch.toLowerCase();
              const filtered = reviews.filter(r => {
                const matchProduct = revSelectedProductId === null || r.productId === revSelectedProductId;
                const matchFilter = reviewsFilter === "all" ? true : reviewsFilter === "visible" ? r.isVisible : !r.isVisible;
                const matchSearch = !q || (r.reviewerName || "").toLowerCase().includes(q) || (r.productName || "").toLowerCase().includes(q) || (r.body || "").toLowerCase().includes(q);
                return matchProduct && matchFilter && matchSearch;
              });
              const totalRevItems = filtered.length;
              const pagedReviews = filtered.slice((revPage - 1) * revPageSize, revPage * revPageSize);

              return (
                <motion.div key="reviews" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="font-serif text-xl font-semibold">Customer Reviews</h2>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {reviews.length} total &nbsp;·&nbsp;
                        <span className="text-green-600 font-medium">{reviews.filter(r => r.isVisible).length} visible</span>
                        &nbsp;·&nbsp;
                        <span className="text-red-500 font-medium">{reviews.filter(r => !r.isVisible).length} hidden</span>
                        &nbsp;·&nbsp;
                        <span className="text-[#d4a853] font-medium">{productSummaries.length} products reviewed</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={openAddReview}
                        className="flex items-center gap-2 text-sm bg-[#1a1612] text-white px-4 py-2 rounded-lg hover:bg-[#d4a853] hover:text-[#1a1612] transition-all font-medium"
                      >
                        <Plus size={14} /> Add Review
                      </button>
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={revSearch} onChange={e => { setRevSearch(e.target.value); setRevPage(1); }} placeholder="Search reviewer or product…"
                          className="pl-8 pr-3 py-1.5 text-[13px] border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#d4a853] w-52" />
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
                        {(["all", "visible", "hidden"] as const).map(f => (
                          <button key={f} onClick={() => { setReviewsFilter(f); setRevPage(1); }}
                            className={`px-3 py-1 rounded-md text-[12px] font-medium capitalize transition-colors ${reviewsFilter === f ? "bg-[#1a1612] text-white" : "text-muted-foreground hover:bg-muted/30"}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                      <button onClick={loadReviews} className="p-2 rounded-lg border border-border bg-white hover:bg-muted/30" title="Refresh">
                        <RefreshCw size={14} className={reviewsLoading ? "animate-spin" : ""} />
                      </button>
                    </div>
                  </div>

                  {/* ─── Product Filter Dropdown ─── */}
                  {productSummaries.length > 0 && (
                    <div className="relative">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold shrink-0">Filter by Product:</span>
                        <button
                          onClick={() => setRevDropdownOpen(o => !o)}
                          className="flex items-center gap-2 bg-white border border-border rounded-xl px-4 py-2.5 text-[13px] font-medium text-foreground hover:border-[#d4a853]/60 transition-all shadow-sm min-w-[240px] max-w-xs"
                        >
                          <span className="flex-1 text-left truncate">
                            {revSelectedProductId === null
                              ? <span className="text-muted-foreground">All Products <span className="ml-1 text-[11px] font-bold text-[#1a1612]">({reviews.length})</span></span>
                              : <span>{productSummaries.find(p => p.productId === revSelectedProductId)?.productName ?? "Unknown"}</span>
                            }
                          </span>
                          <ChevronDown size={15} className={`text-muted-foreground transition-transform ${revDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        {revSelectedProductId !== null && (
                          <button onClick={() => { setRevSelectedProductId(null); setRevPage(1); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                            <X size={13} /> Clear filter
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {revDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setRevDropdownOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className="absolute top-full left-0 mt-2 z-20 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden"
                              style={{ minWidth: 420 }}
                            >
                              <div className="px-4 py-2.5 bg-[#1a1612] flex items-center justify-between">
                                <p className="text-[10px] uppercase tracking-widest text-[#d4a853] font-semibold">Select Product to Filter</p>
                                <button onClick={() => setRevDropdownOpen(false)} className="text-white/50 hover:text-white"><X size={14} /></button>
                              </div>
                              <div className="max-h-72 overflow-y-auto">
                                <table className="w-full text-[12px]">
                                  <thead className="sticky top-0 bg-muted/50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Product</th>
                                      <th className="px-4 py-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Reviews</th>
                                      <th className="px-4 py-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Avg ★</th>
                                      <th className="px-4 py-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Visible</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* All Products row */}
                                    <tr
                                      onClick={() => { setRevSelectedProductId(null); setRevPage(1); setRevDropdownOpen(false); }}
                                      className={`cursor-pointer border-b border-border hover:bg-[#d4a853]/10 transition-colors ${revSelectedProductId === null ? "bg-[#d4a853]/15 font-semibold" : ""}`}
                                    >
                                      <td className="px-4 py-3 text-foreground font-semibold flex items-center gap-2">
                                        {revSelectedProductId === null && <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] inline-block" />}
                                        All Products
                                      </td>
                                      <td className="px-4 py-3 text-center text-muted-foreground">{reviews.length}</td>
                                      <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                                      <td className="px-4 py-3 text-center text-muted-foreground">{reviews.filter(r => r.isVisible).length}</td>
                                    </tr>
                                    {productSummaries.map(ps => {
                                      const avg = ps.totalRating / ps.count;
                                      const isSelected = revSelectedProductId === ps.productId;
                                      return (
                                        <tr
                                          key={ps.productId}
                                          onClick={() => { setRevSelectedProductId(ps.productId); setRevPage(1); setRevDropdownOpen(false); }}
                                          className={`cursor-pointer border-b border-border/50 hover:bg-[#d4a853]/10 transition-colors ${isSelected ? "bg-[#d4a853]/15" : ""}`}
                                        >
                                          <td className="px-4 py-2.5 text-foreground">
                                            <div className="flex items-center gap-2">
                                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] inline-block shrink-0" />}
                                              <span className="truncate max-w-[180px]">{ps.productName}</span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-2.5 text-center font-semibold text-foreground">{ps.count}</td>
                                          <td className="px-4 py-2.5 text-center">
                                            <span className="flex items-center justify-center gap-1 text-[#b8903f] font-semibold">
                                              <Star size={9} className="fill-[#d4a853] text-[#d4a853]" />
                                              {avg.toFixed(1)}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 text-center text-green-600 font-semibold">{ps.visible}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ─── Reviews List ─── */}
                  {reviewsLoading ? (
                    <div className="flex justify-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw size={22} className="animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Loading reviews…</p>
                      </div>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground text-[14px] bg-white rounded-2xl border border-border">
                      <Star size={36} className="mx-auto mb-3 text-muted-foreground/20" strokeWidth={1} />
                      {revSearch ? `No reviews match "${revSearch}".` : revSelectedProductId ? "No reviews for this product yet." : `No ${reviewsFilter !== "all" ? reviewsFilter + " " : ""}reviews yet.`}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                      {revSelectedProductId && (
                        <div className="px-5 py-3 bg-[#d4a853]/10 border-b border-[#d4a853]/20 flex items-center justify-between">
                          <p className="text-[12px] font-semibold text-[#b8903f]">
                            Showing reviews for: <span className="text-foreground">{productSummaries.find(p => p.productId === revSelectedProductId)?.productName}</span>
                          </p>
                          <button onClick={() => { setRevSelectedProductId(null); setRevPage(1); }} className="text-[11px] text-muted-foreground hover:text-foreground">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <div className="divide-y divide-border">
                        {pagedReviews.map(review => (
                          <div key={review.id} className={`p-5 transition-colors hover:bg-muted/5 ${!review.isVisible ? "opacity-55" : ""}`}>
                            <div className="flex items-start gap-4">
                              {/* Avatar + stars */}
                              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a853]/30 to-[#b8903f]/20 flex items-center justify-center text-[#b8903f] font-bold text-sm border border-[#d4a853]/20">
                                  {(review.reviewerName || "?")[0].toUpperCase()}
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={10} className={review.rating >= s ? "fill-[#d4a853] text-[#d4a853]" : "text-muted-foreground/15"} strokeWidth={1} />
                                  ))}
                                </div>
                                {review.imageUrl && (
                                  <img src={review.imageUrl} alt="Review" className="w-12 h-12 rounded-lg object-cover border border-border" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <div>
                                    <p className="text-[14px] font-semibold text-foreground leading-snug">{review.reviewerName}</p>
                                    <p className="text-[12px] text-muted-foreground mt-0.5">
                                      <span className="font-medium text-foreground/70">{review.productName || `Product #${review.productId}`}</span>
                                      {review.orderId && <span className="ml-2 opacity-50">· Order #{review.orderId.slice(-6).toUpperCase()}</span>}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${review.isVisible ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                                      {review.isVisible ? "Visible" : "Hidden"}
                                    </span>
                                    <p className="text-[11px] text-muted-foreground/50">
                                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                </div>
                                {review.title && <p className="text-[13px] font-semibold text-foreground mt-2.5 italic">"{review.title}"</p>}
                                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">{review.body}</p>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                  <button
                                    onClick={() => openEditReview(review)}
                                    className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border border-[#d4a853]/30 bg-[#d4a853]/10 text-[#b8903f] hover:bg-[#d4a853]/20 font-medium transition-colors"
                                  >
                                    <Edit2 size={11} /> Edit
                                  </button>
                                  <button
                                    disabled={revToggling === review.id}
                                    onClick={async () => {
                                      setRevToggling(review.id);
                                      try {
                                        const updated = await api.reviews.setVisibility(review.id, !review.isVisible);
                                        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isVisible: updated.isVisible } : r));
                                      } catch (e: any) { setError(e.message || "Could not update visibility"); }
                                      finally { setRevToggling(null); }
                                    }}
                                    className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border font-medium transition-all disabled:opacity-50 ${review.isVisible ? "text-muted-foreground border-border hover:bg-muted/30 hover:text-red-600 hover:border-red-200" : "text-green-700 border-green-200 bg-green-50 hover:bg-green-100"}`}
                                  >
                                    {revToggling === review.id ? <RefreshCw size={11} className="animate-spin" /> : review.isVisible ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm("Delete this review permanently?")) return;
                                      try {
                                        await api.reviews.adminDelete(review.id);
                                        setReviews(prev => prev.filter(r => r.id !== review.id));
                                        showSuccess("Review deleted.");
                                      } catch (e: any) { setError(e.message || "Could not delete review"); }
                                    }}
                                    className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                                  >
                                    <Trash2 size={11} /> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <PaginationBar page={revPage} total={totalRevItems} pageSize={revPageSize} onPage={setRevPage} onPageSize={setRevPageSize} />
                    </div>
                  )}

                  {/* ─── Add / Edit Review Modal ─── */}
                  <AnimatePresence>
                    {showReviewModal && (
                      <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowReviewModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                          className="fixed inset-0 z-50 flex items-center justify-center p-4">
                          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#1a1612]">
                              <div>
                                <p className="text-white font-semibold text-sm">{editingReview ? "Edit Review" : "Add Review"}</p>
                                {editingReview && <p className="text-white/50 text-[11px] mt-0.5">{editingReview.productName || `Product #${editingReview.productId}`}</p>}
                              </div>
                              <button onClick={() => setShowReviewModal(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
                            </div>

                            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                              {/* Product selector (add only) */}
                              {!editingReview && (
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Product *</label>
                                  <select
                                    value={reviewForm.productId}
                                    onChange={e => setReviewForm(f => ({ ...f, productId: e.target.value }))}
                                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30 bg-white"
                                  >
                                    <option value="">— Select a product —</option>
                                    {adminProducts.filter(p => p.isActive).map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Reviewer name */}
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Reviewer Name *</label>
                                <input
                                  value={reviewForm.reviewerName}
                                  onChange={e => setReviewForm(f => ({ ...f, reviewerName: e.target.value }))}
                                  placeholder="e.g. Priya S."
                                  maxLength={80}
                                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30"
                                />
                              </div>

                              {/* Rating */}
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Rating *</label>
                                <div className="flex items-center gap-2">
                                  {[1,2,3,4,5].map(s => (
                                    <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                                      <Star size={28} className={reviewForm.rating >= s ? "fill-[#d4a853] text-[#d4a853]" : "text-muted-foreground/30"} strokeWidth={1.5} />
                                    </button>
                                  ))}
                                  <span className="text-sm text-muted-foreground ml-1">{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewForm.rating] || ""}</span>
                                </div>
                              </div>

                              {/* Title */}
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Headline <span className="normal-case opacity-60">(optional)</span></label>
                                <input
                                  value={reviewForm.title}
                                  onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                                  placeholder="e.g. Absolutely beautiful!"
                                  maxLength={80}
                                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30"
                                />
                              </div>

                              {/* Body */}
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Review Body *</label>
                                <textarea
                                  value={reviewForm.body}
                                  onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                                  placeholder="Write the review content here…"
                                  maxLength={500}
                                  rows={3}
                                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30 resize-none"
                                />
                                <p className="text-[10px] text-muted-foreground/50 text-right mt-0.5">{reviewForm.body.length}/500</p>
                              </div>

                              {/* Review Image */}
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Review Image <span className="normal-case opacity-60">(optional)</span></label>
                                {reviewForm.imageUrl ? (
                                  <div className="mb-3">
                                    <div className="flex items-start gap-3">
                                      <div className="relative inline-block">
                                        <img
                                          src={reviewForm.imageUrl}
                                          alt="Review"
                                          className="w-24 h-24 object-cover rounded-xl border border-border shadow-sm"
                                          onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23f0ebe2'/%3E%3Ctext y='50%25' x='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a89880' font-size='12'%3EBroken%3C/text%3E%3C/svg%3E"; }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setReviewForm(f => ({ ...f, imageUrl: "" }))}
                                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                                          title="Remove image"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-[11px] text-muted-foreground mb-1">Current image</p>
                                        <p className="text-[10px] text-muted-foreground/60 break-all line-clamp-2">{reviewForm.imageUrl}</p>
                                        <p className="text-[10px] text-muted-foreground mt-2">Click the × to remove, or paste a new URL below to replace it.</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-muted-foreground mb-2">No image attached.</p>
                                )}
                                <input
                                  value={reviewForm.imageUrl}
                                  onChange={e => setReviewForm(f => ({ ...f, imageUrl: e.target.value }))}
                                  placeholder={reviewForm.imageUrl ? "Paste new URL to replace image…" : "Paste image URL to add…"}
                                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30"
                                />
                              </div>

                              {/* Visibility */}
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setReviewForm(f => ({ ...f, isVisible: !f.isVisible }))}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${reviewForm.isVisible ? "bg-green-50 text-green-700 border-green-200" : "border-border text-muted-foreground"}`}
                                >
                                  {reviewForm.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                  {reviewForm.isVisible ? "Visible to customers" : "Hidden from customers"}
                                </button>
                              </div>

                              {reviewModalError && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{reviewModalError}</p>
                              )}
                            </div>

                            <div className="px-6 py-4 border-t border-border bg-muted/30 flex gap-3">
                              <button
                                onClick={saveReview}
                                disabled={reviewModalSaving}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a1612] text-white text-[12px] uppercase tracking-widest font-medium rounded-xl hover:bg-[#d4a853] hover:text-[#1a1612] transition-all disabled:opacity-60"
                              >
                                {reviewModalSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                                {reviewModalSaving ? "Saving…" : editingReview ? "Save Changes" : "Add Review"}
                              </button>
                              <button onClick={() => setShowReviewModal(false)} className="px-5 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted/30 transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()}

            {section === "promo-codes" && (
              <motion.div key="promo-codes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl">Promo Codes</h2>
                  <button
                    onClick={() => { setPromoForm({ code: "", discountPercent: "", maxUses: "", isActive: true }); setPromoModal({ open: true }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1612] text-white text-xs rounded-lg hover:bg-[#2a231c] transition"
                  >
                    <Plus size={14} /> Add Promo Code
                  </button>
                </div>

                {promoLoading ? (
                  <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-muted-foreground" /></div>
                ) : promoCodes.length === 0 ? (
                  <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">No promo codes yet</div>
                ) : (
                  <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-[#faf9f7] border-b">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Code</th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Discount</th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Used</th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Max Uses</th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                          <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {promoCodes.map(p => (
                          <tr key={p.id} className="hover:bg-[#faf9f7]/50">
                            <td className="px-4 py-3 font-mono font-semibold text-[#1a1612]">{p.code}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-[#d4a853]/10 text-[#d4a853] rounded text-xs font-medium">{p.discountPercent}%</span></td>
                            <td className="px-4 py-3 text-muted-foreground">{p.usageCount}</td>
                            <td className="px-4 py-3 text-muted-foreground">{p.maxUses || "Unlimited"}</td>
                            <td className="px-4 py-3">
                              <button onClick={async () => { await api.promo.update(p.id, { isActive: !p.isActive }); loadPromoCodes(); }}>
                                {p.isActive ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => { setPromoForm({ code: p.code, discountPercent: String(p.discountPercent), maxUses: p.maxUses ? String(p.maxUses) : "", isActive: p.isActive }); setPromoModal({ open: true, editing: p }); }}
                                  className="p-1.5 rounded hover:bg-[#f5ede0] transition"
                                ><Edit2 size={13} /></button>
                                <button
                                  onClick={async () => { if (confirm("Delete this promo code?")) { await api.promo.delete(p.id); loadPromoCodes(); } }}
                                  className="p-1.5 rounded hover:bg-red-50 text-red-500 transition"
                                ><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {promoModal.open && (
                  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPromoModal({ open: false })}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                      <h3 className="font-serif text-lg mb-4">{promoModal.editing ? "Edit Promo Code" : "New Promo Code"}</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block mb-1">Code</label>
                          <input
                            value={promoForm.code}
                            onChange={e => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                            placeholder="e.g. SAVE50"
                            className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:border-[#d4a853]"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block mb-1">Discount Percentage</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={promoForm.discountPercent}
                            onChange={e => setPromoForm(f => ({ ...f, discountPercent: e.target.value }))}
                            placeholder="e.g. 50"
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#d4a853]"
                          />
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block mb-1">Max Uses (optional)</label>
                          <input
                            type="number"
                            min="1"
                            value={promoForm.maxUses}
                            onChange={e => setPromoForm(f => ({ ...f, maxUses: e.target.value }))}
                            placeholder="Leave empty for unlimited"
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#d4a853]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPromoForm(f => ({ ...f, isActive: !f.isActive }))}>
                            {promoForm.isActive ? <ToggleRight size={22} className="text-green-600" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                          </button>
                          <span className="text-sm">{promoForm.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-6">
                        <button onClick={() => setPromoModal({ open: false })} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                        <button
                          onClick={async () => {
                            const data = { code: promoForm.code, discountPercent: Number(promoForm.discountPercent), isActive: promoForm.isActive, maxUses: promoForm.maxUses ? Number(promoForm.maxUses) : null };
                            if (promoModal.editing) { await api.promo.update(promoModal.editing.id, data); }
                            else { await api.promo.create(data); }
                            setPromoModal({ open: false });
                            loadPromoCodes();
                          }}
                          disabled={!promoForm.code || !promoForm.discountPercent}
                          className="flex-1 px-4 py-2 bg-[#1a1612] text-white rounded-lg text-sm hover:bg-[#2a231c] disabled:opacity-40"
                        >
                          {promoModal.editing ? "Update" : "Create"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {section === "cart-activity" && (
              <motion.div key="cart-activity" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl">Cart Activity</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{cartActTotal} total activities</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[160px] sm:flex-initial sm:w-48">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={cartActSearch}
                        onChange={e => { setCartActSearch(e.target.value); setCartActPage(1); }}
                        placeholder="Search user, product..."
                        className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-[#d4a853]"
                      />
                    </div>
                    <select
                      value={cartActFilter}
                      onChange={e => { setCartActFilter(e.target.value as any); setCartActPage(1); }}
                      className="border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#d4a853]"
                    >
                      <option value="all">All Users</option>
                      <option value="registered">Registered</option>
                      <option value="guest">Guests</option>
                    </select>
                    <button onClick={() => loadCartActivities(cartActPage)} className="p-1.5 rounded-lg border hover:bg-[#faf9f7] transition-colors"><RefreshCw size={14} /></button>
                  </div>
                </div>

                {cartActLoading ? (
                  <div className="flex justify-center py-12"><RefreshCw size={20} className="animate-spin text-muted-foreground" /></div>
                ) : cartActivities.length === 0 ? (
                  <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">No cart activity yet</div>
                ) : (
                  <>
                    <div className="hidden lg:block bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-[#faf9f7] border-b">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">User</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Product</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Price</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Qty</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">IP</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {cartActivities.map(a => (
                            <tr key={a.id} className="hover:bg-[#faf9f7]/50 transition-colors">
                              <td className="px-4 py-3">
                                {a.userName ? (
                                  <div>
                                    <div className="font-medium text-[#1a1612] text-xs">{a.userName}</div>
                                    <div className="text-[10px] text-muted-foreground">{a.userEmail}</div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Unknown visitor</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setLocation(`/product/${a.productId}`)}
                                  className="text-xs text-[#d4a853] hover:text-[#b8912e] hover:underline transition-colors text-left font-medium"
                                >
                                  {a.productName}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium">{inr(a.productPrice)}</td>
                              <td className="px-4 py-3 text-xs">{a.quantity}</td>
                              <td className="px-4 py-3 text-[10px] text-muted-foreground font-mono">{a.ipAddress || "-"}</td>
                              <td className="px-4 py-3 text-[10px] text-muted-foreground whitespace-nowrap">{new Date(a.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="lg:hidden space-y-3">
                      {cartActivities.map(a => (
                        <div key={a.id} className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => setLocation(`/product/${a.productId}`)}
                                className="text-sm font-medium text-[#d4a853] hover:text-[#b8912e] hover:underline transition-colors text-left truncate block max-w-full"
                              >
                                {a.productName}
                              </button>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-[#1a1612]">{inr(a.productPrice)}</span>
                                <span className="text-[10px] text-muted-foreground">× {a.quantity}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {new Date(a.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-[#f5ede0] flex items-center justify-center shrink-0">
                                {a.userName ? (
                                  <span className="text-[10px] font-semibold text-[#1a1612]">{a.userName.charAt(0).toUpperCase()}</span>
                                ) : (
                                  <User size={10} className="text-muted-foreground" />
                                )}
                              </div>
                              {a.userName ? (
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-[#1a1612] truncate">{a.userName}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">{a.userEmail}</div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Unknown visitor</span>
                              )}
                            </div>
                            {a.ipAddress && (
                              <span className="text-[9px] text-muted-foreground font-mono bg-[#faf9f7] px-1.5 py-0.5 rounded shrink-0">{a.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {cartActTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button disabled={cartActPage <= 1} onClick={() => { setCartActPage(p => p - 1); }} className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-30 hover:bg-[#faf9f7] transition-colors">Previous</button>
                    <span className="text-xs text-muted-foreground">Page {cartActPage} of {cartActTotalPages}</span>
                    <button disabled={cartActPage >= cartActTotalPages} onClick={() => { setCartActPage(p => p + 1); }} className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-30 hover:bg-[#faf9f7] transition-colors">Next</button>
                  </div>
                )}
              </motion.div>
            )}

            {section === "shipping" && (
              <motion.div key="shipping" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 max-w-3xl">
                <div>
                  <h2 className="font-serif text-xl">Shipping Charges</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Set your origin pincode and distance-based shipping rates</p>
                </div>

                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="text-sm font-semibold mb-3">Origin Pincode</h3>
                  <p className="text-xs text-muted-foreground mb-3">Your store/warehouse pincode. Distance will be calculated from this pincode to the customer's pincode.</p>
                  <div className="flex gap-2">
                    <input
                      value={shippingOrigin}
                      onChange={e => setShippingOrigin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="e.g. 380001"
                      className="px-3 py-2 border rounded-lg text-sm w-48 focus:outline-none focus:border-[#d4a853]"
                    />
                    <button
                      onClick={async () => {
                        if (!/^\d{6}$/.test(shippingOrigin)) { showError("Enter a valid 6-digit pincode"); return; }
                        setShippingSaving(true);
                        try {
                          await api.siteContent.save({ "settings.origin_pincode": shippingOrigin });
                          showSuccess("Origin pincode saved!");
                        } catch { showError("Failed to save"); }
                        finally { setShippingSaving(false); }
                      }}
                      disabled={shippingSaving}
                      className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
                      style={{ background: "#1a1612" }}
                    >
                      {shippingSaving ? "Saving..." : "Save Pincode"}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="text-sm font-semibold mb-1">Distance-Based Pricing</h3>
                  <p className="text-xs text-muted-foreground mb-4">Add shipping charge tiers based on distance (in km) from your origin pincode</p>

                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input
                      value={shippingForm.minKm}
                      onChange={e => setShippingForm(f => ({ ...f, minKm: e.target.value.replace(/\D/g, "") }))}
                      placeholder="Min km (e.g. 0)"
                      className="px-3 py-2 border rounded-lg text-sm flex-1 focus:outline-none focus:border-[#d4a853]"
                    />
                    <input
                      value={shippingForm.maxKm}
                      onChange={e => setShippingForm(f => ({ ...f, maxKm: e.target.value.replace(/\D/g, "") }))}
                      placeholder="Max km (e.g. 50)"
                      className="px-3 py-2 border rounded-lg text-sm flex-1 focus:outline-none focus:border-[#d4a853]"
                    />
                    <input
                      value={shippingForm.charge}
                      onChange={e => setShippingForm(f => ({ ...f, charge: e.target.value.replace(/\D/g, "") }))}
                      placeholder="Charge ₹ (e.g. 49)"
                      className="px-3 py-2 border rounded-lg text-sm flex-1 focus:outline-none focus:border-[#d4a853]"
                    />
                    <button
                      onClick={async () => {
                        const min = Number(shippingForm.minKm);
                        const max = Number(shippingForm.maxKm);
                        const charge = Number(shippingForm.charge);
                        if (!shippingForm.minKm || !shippingForm.maxKm || !shippingForm.charge) { showError("Fill all fields"); return; }
                        if (max <= min) { showError("Max km must be greater than min km"); return; }
                        try {
                          if (editingZoneId) {
                            await api.shipping.updateZone(editingZoneId, { minKm: min, maxKm: max, charge });
                            showSuccess("Zone updated!");
                          } else {
                            await api.shipping.createZone({ minKm: min, maxKm: max, charge });
                            showSuccess("Zone added!");
                          }
                          setShippingForm({ minKm: "", maxKm: "", charge: "" });
                          setEditingZoneId(null);
                          loadShippingZones();
                        } catch { showError("Failed to save zone"); }
                      }}
                      className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors shrink-0"
                      style={{ background: editingZoneId ? "#d4a853" : "#1a1612" }}
                    >
                      {editingZoneId ? "Update" : "Add Zone"}
                    </button>
                    {editingZoneId && (
                      <button
                        onClick={() => { setEditingZoneId(null); setShippingForm({ minKm: "", maxKm: "", charge: "" }); }}
                        className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {shippingZones.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-[#faf9f7]">
                      No shipping zones added yet. Add your first distance-based zone above.
                    </div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[#faf9f7] border-b">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Distance Range</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Charge</th>
                            <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {shippingZones.map(zone => (
                            <tr key={zone.id} className="hover:bg-[#faf9f7]/50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium">{zone.minKm} km — {zone.maxKm} km</td>
                              <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#d4a853" }}>₹{zone.charge}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingZoneId(zone.id);
                                      setShippingForm({ minKm: String(zone.minKm), maxKm: String(zone.maxKm), charge: String(zone.charge) });
                                    }}
                                    className="p-1.5 rounded-md hover:bg-[#faf9f7] transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Delete this shipping zone?")) return;
                                      try {
                                        await api.shipping.deleteZone(zone.id);
                                        showSuccess("Zone deleted");
                                        loadShippingZones();
                                      } catch { showError("Failed to delete"); }
                                    }}
                                    className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {section === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 max-w-2xl">
                {/* Pricing */}
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="font-serif text-lg mb-4">Pricing Settings</h3>

                  {/* Free Shipping toggle */}
                  <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3 mb-4 bg-[#faf9f7]">
                    <div>
                      <p className="text-sm font-medium">Free Shipping</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {pricingForm.free_shipping_enabled === "true"
                          ? `Enabled — orders above ₹${pricingForm.free_shipping_min} ship free`
                          : "Disabled — shipping fee always applied"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${pricingForm.free_shipping_enabled === "true" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}>
                        {pricingForm.free_shipping_enabled === "true" ? "On" : "Off"}
                      </span>
                      <button
                        onClick={() => setPricingForm(f => ({ ...f, free_shipping_enabled: f.free_shipping_enabled === "true" ? "false" : "true" }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${pricingForm.free_shipping_enabled === "true" ? "bg-[#d4a853]" : "bg-muted/40 border border-border"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${pricingForm.free_shipping_enabled === "true" ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {[
                      { key: "gift_price" as const, label: "Gift Wrap Fee (₹)" },
                      { key: "shipping_fee" as const, label: "Shipping Fee (₹)" },
                      { key: "free_shipping_min" as const, label: "Free Shipping Above (₹)" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
                        <input
                          type="number"
                          value={pricingForm[key]}
                          onChange={e => setPricingForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={settingsSaving}
                    onClick={async () => {
                      setSettingsSaving(true);
                      try {
                        await api.siteContent.save({
                          "settings.gift_price": pricingForm.gift_price,
                          "settings.shipping_fee": pricingForm.shipping_fee,
                          "settings.free_shipping_min": pricingForm.free_shipping_min,
                          "settings.free_shipping_enabled": pricingForm.free_shipping_enabled,
                        });
                        showSuccess("Pricing settings saved!");
                      } catch (e: any) { setError(e.message); }
                      finally { setSettingsSaving(false); }
                    }}
                    className="flex items-center gap-2 text-sm bg-[#1a1612] text-white px-4 py-2 rounded-lg hover:bg-[#d4a853] hover:text-[#1a1612] transition-all disabled:opacity-60"
                  >
                    {settingsSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Pricing
                  </button>
                </div>

                {/* Active Offers */}
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg">Active Offers & Promotions</h3>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${offersForm.enabled === "true" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {offersForm.enabled === "true" ? "Live" : "Off"}
                    </span>
                  </div>

                  {/* Enable toggle */}
                  <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3 mb-4 bg-[#faf9f7]">
                    <div>
                      <p className="text-sm font-medium">Enable Offer</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {offersForm.enabled === "true" ? `Active: ${offersForm.label}` : "No active offer — customers pay full price"}
                      </p>
                    </div>
                    <button
                      onClick={() => setOffersForm(f => ({ ...f, enabled: f.enabled === "true" ? "false" : "true" }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${offersForm.enabled === "true" ? "bg-[#d4a853]" : "bg-muted/40 border border-border"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${offersForm.enabled === "true" ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {/* Offer type */}
                  <div className="mb-4">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Offer Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: "b1g1", label: "Buy 1 Get 1", sub: "Every 2nd item free" },
                        { value: "b2g1", label: "Buy 2 Get 1", sub: "Every 3rd item free" },
                        { value: "b4g1", label: "Buy 4 Get 1", sub: "Every 5th item free" },
                        { value: "percent", label: "% Discount", sub: "Fixed % off total" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const defaultLabel = opt.value === "b1g1" ? "Buy 1 Get 1 Free" : opt.value === "b2g1" ? "Buy 2 Get 1 Free" : opt.value === "b4g1" ? "Buy 4 Get 1 Free" : `${offersForm.percent}% Off`;
                            setOffersForm(f => ({ ...f, type: opt.value, label: defaultLabel }));
                          }}
                          className={`p-3 rounded-lg border text-left transition-all ${offersForm.type === opt.value ? "border-[#d4a853] bg-[#d4a853]/10" : "border-border hover:border-[#d4a853]/50"}`}
                        >
                          <p className={`text-xs font-semibold mb-0.5 ${offersForm.type === opt.value ? "text-[#d4a853]" : "text-foreground"}`}>{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Percent input (only for percent type) */}
                  {offersForm.type === "percent" && (
                    <div className="mb-4">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Discount Percentage (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={offersForm.percent}
                        onChange={e => setOffersForm(f => ({ ...f, percent: e.target.value, label: `${e.target.value}% Off` }))}
                        className="w-32 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                      />
                    </div>
                  )}

                  {/* Custom label */}
                  <div className="mb-4">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Offer Label (shown to customers)</label>
                    <input
                      type="text"
                      value={offersForm.label}
                      onChange={e => setOffersForm(f => ({ ...f, label: e.target.value }))}
                      placeholder="e.g. Buy 1 Get 1 Free"
                      maxLength={60}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                    />
                  </div>

                  <button
                    disabled={settingsSaving}
                    onClick={async () => {
                      setSettingsSaving(true);
                      try {
                        await api.siteContent.save({
                          "offers.enabled": offersForm.enabled,
                          "offers.type": offersForm.type,
                          "offers.percent": offersForm.percent,
                          "offers.label": offersForm.label,
                        });
                        showSuccess("Offer settings saved!");
                      } catch (e: any) { setError(e.message); }
                      finally { setSettingsSaving(false); }
                    }}
                    className="flex items-center gap-2 text-sm bg-[#1a1612] text-white px-4 py-2 rounded-lg hover:bg-[#d4a853] hover:text-[#1a1612] transition-all disabled:opacity-60"
                  >
                    {settingsSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Offer
                  </button>
                </div>

                {/* Social Stats */}
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="font-serif text-lg mb-4">Social / Instagram Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {[
                      { key: "instagram_handle" as const, label: "Instagram Handle" },
                      { key: "followers" as const, label: "Followers Display" },
                      { key: "reel_views" as const, label: "Reel Views Display" },
                      { key: "positive_reviews" as const, label: "Positive Reviews %" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
                        <input
                          type="text"
                          value={socialForm[key]}
                          onChange={e => setSocialForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={settingsSaving}
                    onClick={async () => {
                      setSettingsSaving(true);
                      try {
                        await api.siteContent.save({
                          "social.instagram_handle": socialForm.instagram_handle,
                          "social.followers": socialForm.followers,
                          "social.reel_views": socialForm.reel_views,
                          "social.positive_reviews": socialForm.positive_reviews,
                        });
                        showSuccess("Social settings saved!");
                      } catch (e: any) { setError(e.message); }
                      finally { setSettingsSaving(false); }
                    }}
                    className="flex items-center gap-2 text-sm bg-[#1a1612] text-white px-4 py-2 rounded-lg hover:bg-[#d4a853] hover:text-[#1a1612] transition-all disabled:opacity-60"
                  >
                    {settingsSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                    Save Social Settings
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-4">
                  <h3 className="font-serif text-lg">Store Information</h3>
                  {[
                    { label: "Store Name", value: "Ethura Jewelry" },
                    { label: "Admin Email", value: user.email },
                    { label: "Database", value: "MySQL (Connected)" },
                    { label: "Payment Gateway", value: "Razorpay" },
                    { label: "Platform", value: "Replit · Full-Stack" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between py-2.5 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="font-serif text-lg mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setLocation("/")}
                      className="flex items-center gap-2 text-sm border border-border px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <ExternalLink size={14} /> View Store
                    </button>
                    <button onClick={() => { loadKpi(); loadProducts(); loadOrders(); showSuccess("All data refreshed!"); }}
                      className="flex items-center gap-2 text-sm border border-border px-4 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <RefreshCw size={14} /> Refresh All Data
                    </button>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 text-sm bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ─── PRODUCT VIEW MODAL ─── */}
      <AnimatePresence>
        {viewingProduct && (() => {
          const vp = viewingProduct;
          const allImages: string[] = [];
          if (vp.featureImageUrl) allImages.push(vp.featureImageUrl);
          else if (vp.imageKey || vp.imageUrl) allImages.push(resolveImage(vp.imageKey, vp.imageUrl));
          const gallery = parseImages(vp.images);
          gallery.forEach(img => { if (!allImages.includes(img)) allImages.push(img); });
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
              onClick={() => setViewingProduct(null)}>
              <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
                className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl overflow-hidden my-0 sm:my-8"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-[#faf9f7]">
                  <div>
                    <h3 className="font-serif text-lg text-[#1a1612]">{vp.name}</h3>
                    <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{vp.category} · ID #{vp.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${vp.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {vp.isActive ? "Active" : "Inactive"}
                    </span>
                    <button onClick={() => setViewingProduct(null)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                  {allImages.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Images ({allImages.length})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {allImages.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted group">
                            <img src={img} alt={`${vp.name} ${i + 1}`} className="w-full h-full object-cover" />
                            {i === 0 && (
                              <span className="absolute top-1.5 left-1.5 text-[9px] uppercase tracking-wider bg-[#1a1612]/80 text-white px-1.5 py-0.5 rounded font-medium">Feature</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#faf9f7] rounded-xl p-3.5 border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Sale Price</p>
                      <p className="text-lg font-bold text-[#1a1612]">{inr(vp.price)}</p>
                    </div>
                    <div className="bg-[#faf9f7] rounded-xl p-3.5 border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Original Price</p>
                      <p className="text-lg font-bold text-[#1a1612]">{vp.compareAtPrice ? inr(vp.compareAtPrice) : "—"}</p>
                    </div>
                    <div className="bg-[#faf9f7] rounded-xl p-3.5 border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Stock</p>
                      <p className="text-lg font-bold text-[#1a1612]">{vp.stock !== null && vp.stock !== undefined ? vp.stock : "—"}</p>
                    </div>
                    <div className="bg-[#faf9f7] rounded-xl p-3.5 border border-border">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Featured</p>
                      <p className="text-lg font-bold text-[#1a1612]">{vp.isFeatured ? "Yes" : "No"}</p>
                    </div>
                  </div>

                  {vp.badge && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Badge</p>
                      <span className="inline-block text-xs bg-[#d4a853]/20 text-[#b8903f] px-2.5 py-1 rounded-lg font-semibold">{vp.badge}</span>
                    </div>
                  )}

                  {vp.description && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Description</p>
                      <p className="text-sm text-[#1a1612] leading-relaxed whitespace-pre-wrap">{vp.description}</p>
                    </div>
                  )}

                  {(vp.avgRating !== undefined || vp.reviewCount !== undefined) && (
                    <div className="flex items-center gap-4">
                      {vp.avgRating !== undefined && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star size={14} fill="#d4a853" className="text-[#d4a853]" />
                            <span className="text-sm font-bold text-[#1a1612]">{vp.avgRating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                      {vp.reviewCount !== undefined && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Reviews</p>
                          <span className="text-sm font-bold text-[#1a1612]">{vp.reviewCount}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Date Added</p>
                    <p className="text-sm text-[#1a1612]">{new Date(vp.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-border bg-[#faf9f7] flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setViewingProduct(null); openEditProduct(vp); }}
                    className="flex items-center gap-1.5 bg-[#1a1612] text-white px-4 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-[#d4a853] hover:text-[#1a1612] transition-all"
                  >
                    <Edit2 size={13} /> Edit Product
                  </button>
                  <button onClick={() => setViewingProduct(null)} className="px-4 py-2 rounded-lg text-xs uppercase tracking-widest border border-border hover:bg-muted/30 transition-colors">
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ─── PRODUCT MODAL ─── */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
              className="bg-white w-full sm:max-w-2xl sm:rounded-xl shadow-2xl my-0 sm:my-4">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10 sm:rounded-t-xl">
                <h3 className="font-serif text-lg">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <button onClick={() => setShowProductModal(false)} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
                {/* Basic fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Product Name — full row */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Product Name *</label>
                    <input type="text" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pearl Drop Earrings"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  </div>
                  {/* Original Price */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Original Price (₹)</label>
                    <input type="number" value={productForm.compareAtPrice}
                      onChange={e => {
                        const orig = e.target.value;
                        setProductForm(f => {
                          const sale = discountPct ? String(Math.round(Number(orig) * (1 - Number(discountPct) / 100))) : f.price;
                          return { ...f, compareAtPrice: orig, price: discountPct ? sale : f.price };
                        });
                      }}
                      placeholder="e.g. 1499 — shows strikethrough"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  </div>
                  {/* Discount % — auto-calculates sale price */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                      Discount % <span className="text-[#d4a853] normal-case font-normal">(auto-fills Sale Price)</span>
                    </label>
                    <input type="number" min="0" max="100" value={discountPct}
                      onChange={e => {
                        const pct = e.target.value;
                        setDiscountPct(pct);
                        if (pct && productForm.compareAtPrice) {
                          const sale = Math.round(Number(productForm.compareAtPrice) * (1 - Number(pct) / 100));
                          setProductForm(f => ({ ...f, price: String(sale) }));
                        }
                      }}
                      placeholder="e.g. 10 → sale price auto-filled"
                      className="w-full border border-[#d4a853]/50 bg-[#d4a853]/5 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  </div>
                  {/* Sale Price */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Sale Price (₹) *</label>
                    <input type="number" value={productForm.price}
                      onChange={e => {
                        const sale = e.target.value;
                        if (discountPct && sale) {
                          const orig = Math.round(Number(sale) / (1 - Number(discountPct) / 100));
                          setProductForm(f => ({ ...f, price: sale, compareAtPrice: String(orig) }));
                        } else {
                          setProductForm(f => ({ ...f, price: sale }));
                        }
                      }}
                      placeholder="e.g. 1199"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  </div>
                  {/* Stock */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Stock Quantity</label>
                    <input type="number" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} placeholder="e.g. 25"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  </div>
                  {/* Badge */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Badge</label>
                    <input type="text" value={productForm.badge} onChange={e => setProductForm(f => ({ ...f, badge: e.target.value }))} placeholder="e.g. New, Bestseller"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  </div>
                </div>

                {/* Category + Featured toggle */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Category</label>
                    <select value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]">
                      {productCategories.filter(c => c.isActive).length > 0
                        ? productCategories.filter(c => c.isActive).map(c => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                          ))
                        : ["necklaces", "earrings", "rings", "bracelets"].map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                          ))
                      }
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Show on Homepage</label>
                    <button onClick={() => setProductForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${productForm.isFeatured ? "bg-[#d4a853] text-[#1a1612] border-[#d4a853]" : "border-border text-muted-foreground hover:border-[#d4a853]"}`}>
                      {productForm.isFeatured ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                      {productForm.isFeatured ? "Featured" : "Not Featured"}
                    </button>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Eligible For Offer</label>
                    <button onClick={() => setProductForm(f => ({ ...f, eligibleForOffer: !f.eligibleForOffer }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${productForm.eligibleForOffer ? "bg-green-600 text-white border-green-600" : "border-border text-muted-foreground hover:border-green-500"}`}>
                      {productForm.eligibleForOffer ? <Check size={14} /> : <Sparkles size={14} />}
                      {productForm.eligibleForOffer ? "Offer Eligible" : "No Offer"}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Description</label>
                  <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Product description shown on detail page…"
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853] resize-none" />
                </div>

                {/* Feature Image */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Feature Image <span className="text-[#d4a853]">(main image shown on shop & homepage)</span></label>
                  <input ref={featureUploadRef} type="file" accept="image/*" className="hidden"
                    onChange={async e => { const f = e.target.files?.[0]; if (f) await handleFeatureImageFile(f); e.target.value = ""; }} />
                  {productForm.featureImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border-2 border-[#d4a853]/50 aspect-video bg-muted">
                      <img src={productForm.featureImageUrl} alt="Feature preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button type="button" onClick={() => featureUploadRef.current?.click()}
                          className="flex items-center gap-1.5 text-white text-xs bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors">
                          <Upload size={12} /> Change
                        </button>
                        <button type="button" onClick={() => setProductForm(f => ({ ...f, featureImageUrl: "" }))}
                          className="flex items-center gap-1.5 text-white text-xs bg-red-500/70 hover:bg-red-500/90 px-3 py-2 rounded-lg transition-colors">
                          <X size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => featureUploadRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setFeatureDragging(true); }}
                      onDragLeave={() => setFeatureDragging(false)}
                      onDrop={async e => { e.preventDefault(); setFeatureDragging(false); const f = e.dataTransfer.files?.[0]; if (f) await handleFeatureImageFile(f); }}
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${featureDragging ? "border-[#d4a853] bg-[#d4a853]/5" : "border-border hover:border-[#d4a853] hover:bg-muted/20"}`}>
                      <ImageIcon size={32} className="text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground text-center"><span className="font-medium text-foreground">Click to upload</span> or drag & drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP · auto-compressed</p>
                    </div>
                  )}
                </div>

                {/* Gallery Images */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Gallery Images <span className="text-muted-foreground font-normal normal-case">(shown in product detail page · up to 8)</span>
                  </label>
                  <input ref={galleryUploadRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={async e => { if (e.target.files) { await handleGalleryFiles(e.target.files); e.target.value = ""; } }} />

                  {productForm.galleryImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {productForm.galleryImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                          <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          <button type="button"
                            onClick={() => setProductForm(f => ({ ...f, galleryImages: f.galleryImages.filter((_, i) => i !== idx) }))}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <X size={10} />
                          </button>
                          {idx === 0 && <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded">1st</div>}
                        </div>
                      ))}
                      {productForm.galleryImages.length < 8 && (
                        <button type="button" onClick={() => galleryUploadRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-[#d4a853] flex items-center justify-center text-muted-foreground hover:text-[#d4a853] transition-colors bg-muted/20">
                          <Plus size={20} />
                        </button>
                      )}
                    </div>
                  )}

                  {productForm.galleryImages.length === 0 && (
                    <div onClick={() => galleryUploadRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setGalleryDragging(true); }}
                      onDragLeave={() => setGalleryDragging(false)}
                      onDrop={async e => { e.preventDefault(); setGalleryDragging(false); if (e.dataTransfer.files) await handleGalleryFiles(e.dataTransfer.files); }}
                      className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${galleryDragging ? "border-[#d4a853] bg-[#d4a853]/5" : "border-border hover:border-[#d4a853] hover:bg-muted/20"}`}>
                      <Upload size={24} className="text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground text-center">Upload multiple gallery images · drag & drop or click</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-border flex gap-3 sticky bottom-0 bg-white sm:rounded-b-xl">
                <button onClick={() => setShowProductModal(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-muted/30 transition-colors">Cancel</button>
                <button onClick={saveProduct} disabled={productSaving}
                  className="flex-1 bg-[#1a1612] text-white rounded-lg py-2.5 text-sm hover:bg-[#d4a853] hover:text-[#1a1612] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {productSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FEATURE CARD MODAL ─── */}
      <AnimatePresence>
        {showCardModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg">{editingCard ? "Edit Feature Card" : "Add Feature Card"}</h3>
                <button onClick={() => setShowCardModal(false)} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Title *", key: "title", placeholder: "e.g. Anti-Tarnish Promise" },
                  { label: "Subtitle", key: "subtitle", placeholder: "e.g. 18K gold plated · Waterproof" },
                  { label: "Badge", key: "badge", placeholder: "e.g. Signature, New" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">{f.label}</label>
                    <input value={(cardForm as any)[f.key]} onChange={e => setCardForm(cf => ({ ...cf, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Description</label>
                  <textarea value={cardForm.description} onChange={e => setCardForm(cf => ({ ...cf, description: e.target.value }))}
                    rows={3} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853] resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCardForm(cf => ({ ...cf, isActive: !cf.isActive }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${cardForm.isActive ? "bg-green-50 text-green-700 border-green-200" : "border-border text-muted-foreground"}`}>
                    {cardForm.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {cardForm.isActive ? "Visible" : "Hidden"}
                  </button>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowCardModal(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-muted/30 transition-colors">Cancel</button>
                  <button onClick={saveCard} disabled={cardSaving}
                    className="flex-1 bg-[#1a1612] text-white rounded-lg py-2.5 text-sm hover:bg-[#d4a853] hover:text-[#1a1612] transition-all flex items-center justify-center gap-2">
                    {cardSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    {editingCard ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── REEL MODAL ─── */}
      <AnimatePresence>
        {showReelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowReelModal(false)}>
            <motion.div initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
              <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
                <h3 className="font-serif text-lg">{editingReel ? "Edit Reel" : "Add Reel"}</h3>
                <button onClick={() => setShowReelModal(false)} className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Title *</label>
                  <input value={reelForm.title} onChange={e => setReelForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Summer Collection Reel"
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                </div>

                {/* Upload Mode Toggle */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Video Source *</label>
                  <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-medium mb-3">
                    {(["url", "file"] as const).map(mode => (
                      <button key={mode} onClick={() => setReelForm(f => ({ ...f, uploadMode: mode, videoUrl: "" }))}
                        className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition-all ${reelForm.uploadMode === mode ? "bg-[#1a1612] text-white" : "text-muted-foreground hover:bg-muted/30"}`}>
                        {mode === "url" ? <><Link size={12} /> Paste URL</> : <><Upload size={12} /> Upload File</>}
                      </button>
                    ))}
                  </div>

                  {reelForm.uploadMode === "url" ? (
                    <input value={reelForm.videoUrl} onChange={e => setReelForm(f => ({ ...f, videoUrl: e.target.value }))}
                      placeholder="https://... (MP4, YouTube, Vimeo, Instagram, etc.)"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  ) : (
                    <>
                      <input type="file" accept="video/*" ref={reelVideoRef} className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleReelVideoFile(e.target.files[0]); }} />
                      <div onClick={() => reelVideoRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#d4a853] hover:bg-[#d4a853]/5 transition-all">
                        {reelForm.videoUrl ? (
                          <>
                            <video src={reelForm.videoUrl} className="w-full max-h-40 rounded-lg object-cover" controls />
                            <p className="text-xs text-muted-foreground mt-1">Click to change video</p>
                          </>
                        ) : (
                          <>
                            <Video size={28} className="text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">Click to upload video</p>
                            <p className="text-[11px] text-muted-foreground/60">MP4, WebM, MOV · Max ~30MB</p>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Thumbnail URL <span className="text-muted-foreground/50">(optional)</span></label>
                  <input value={reelForm.thumbnailUrl} onChange={e => setReelForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                    placeholder="https://... (shown as poster image)"
                    className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                </div>

                {/* Sort + Active */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Sort Order</label>
                    <input type="number" value={reelForm.sortOrder} onChange={e => setReelForm(f => ({ ...f, sortOrder: e.target.value }))}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853]" />
                  </div>
                  <div className="pt-5">
                    <button onClick={() => setReelForm(f => ({ ...f, isActive: !f.isActive }))}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all ${reelForm.isActive ? "bg-green-50 text-green-700 border-green-200" : "border-border text-muted-foreground"}`}>
                      {reelForm.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      {reelForm.isActive ? "Active" : "Hidden"}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowReelModal(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-muted/30 transition-colors">Cancel</button>
                  <button onClick={saveReel} disabled={reelSaving}
                    className="flex-1 bg-[#1a1612] text-white rounded-lg py-2.5 text-sm hover:bg-[#d4a853] hover:text-[#1a1612] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {reelSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    {editingReel ? "Update Reel" : "Add Reel"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
