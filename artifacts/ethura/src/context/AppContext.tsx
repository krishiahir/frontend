import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { api, setToken, clearToken } from "@/lib/api";
import type { ApiProduct, ApiOrder, ApiUser } from "@/lib/api";
import { apiProductToCart } from "@/lib/cartUtils";
import type { CartItem } from "@/lib/cartUtils";

export type { CartItem };

interface GiftOptions {
  isGift: boolean;
  giftMessage: string;
}

interface AppContextType {
  products: ApiProduct[];
  productsLoading: boolean;
  reloadProducts: () => Promise<void>;

  cart: CartItem[];
  wishlist: number[];

  user: ApiUser | null;
  userLoading: boolean;

  orders: ApiOrder[];

  addToCart: (product: ApiProduct | CartItem, giftOptions?: GiftOptions) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  toggleWishlist: (id: number) => void;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearCart: () => void;
  updateProfile: (data: { name: string; email: string; phone?: string; address?: string }) => Promise<void>;

  loadMyOrders: () => Promise<void>;

  cartCount: number;
  cartTotal: number;
  giftTotal: number;
  offerDiscount: number;
  offerEnabled: boolean;
  offerLabel: string;

  giftPrice: number;
  shippingFee: number;
  freeShippingMin: number;
  freeShippingEnabled: boolean;

  siteContent: Record<string, string>;
  reelsEnabled: boolean;
  reviewsEnabled: boolean;

  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const CART_KEY = "ethura_cart";
const WISHLIST_KEY = "ethura_wishlist";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => loadFromStorage<CartItem[]>(CART_KEY, []));
  const [wishlist, setWishlist] = useState<number[]>(() => loadFromStorage<number[]>(WISHLIST_KEY, []));
  const [user, setUser] = useState<ApiUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [orders, setOrders] = useState<ApiOrder[]>([]);

  const [giftPrice, setGiftPrice] = useState(99);
  const [shippingFee, setShippingFee] = useState(99);
  const [freeShippingMin, setFreeShippingMin] = useState(2000);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [reelsEnabled, setReelsEnabled] = useState(true);
  const [reviewsEnabled, setReviewsEnabled] = useState(true);

  // Persist cart & wishlist to localStorage so they survive page reloads
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }, [wishlist]);

  const reloadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const data = await api.products.list();
      setProducts(data);
    } catch (e) {
      console.error("Failed to load products", e);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadProducts();
    const token = localStorage.getItem("ethura_token");
    if (token) {
      api.auth.me().then(u => { setUser(u); setUserLoading(false); }).catch(() => { clearToken(); setUserLoading(false); });
    } else {
      setUserLoading(false);
    }
    api.siteContent.get().then(content => {
      setSiteContent(content);
      if (content["settings.gift_price"]) setGiftPrice(Number(content["settings.gift_price"]) || 99);
      if (content["settings.shipping_fee"]) setShippingFee(Number(content["settings.shipping_fee"]) || 99);
      if (content["settings.free_shipping_min"]) setFreeShippingMin(Number(content["settings.free_shipping_min"]) || 2000);
      if ("settings.free_shipping_enabled" in content) setFreeShippingEnabled(content["settings.free_shipping_enabled"] !== "false");
      if ("features.reels_enabled" in content) setReelsEnabled(content["features.reels_enabled"] !== "false");
      if ("features.reviews_enabled" in content) setReviewsEnabled(content["features.reviews_enabled"] !== "false");
    }).catch(() => {});
  }, []);

  const addToCart = (product: ApiProduct | CartItem, giftOptions?: GiftOptions) => {
    const cartItem: CartItem = "image" in product
      ? { ...(product as CartItem) }
      : { ...apiProductToCart(product as ApiProduct), quantity: 0 };

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, ...(giftOptions && { isGift: giftOptions.isGift, giftMessage: giftOptions.giftMessage }) }
            : item
        );
      }
      return [...prev, { ...cartItem, quantity: 1, ...(giftOptions || {}) }];
    });
    setCartDrawerOpen(true);

    try {
      let sid = localStorage.getItem("ethura_session_id");
      if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("ethura_session_id", sid); }
      api.cartActivity.track({
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        sessionId: sid,
        productId: product.id,
        productName: "name" in product ? product.name : (product as CartItem).name,
        productPrice: product.price,
        quantity: 1,
      }).catch(() => {});
    } catch {}
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const toggleWishlist = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const login = async (email: string, password: string) => {
    const { token, user: u } = await api.auth.login(email, password);
    setToken(token);
    setUser(u);
  };

  const register = async (name: string, email: string, password: string) => {
    const { token, user: u } = await api.auth.register(name, email, password);
    setToken(token);
    setUser(u);
  };

  const logout = () => { clearToken(); setUser(null); setOrders([]); };
  const clearCart = () => { setCart([]); localStorage.removeItem(CART_KEY); };

  const updateProfile = async (data: { name: string; email: string; phone?: string; address?: string }) => {
    const { user: u } = await api.auth.updateProfile(data);
    setUser(u);
  };

  const loadMyOrders = async () => {
    try {
      const o = await api.orders.my();
      setOrders(o);
    } catch {}
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const giftTotal = cart.filter(item => item.isGift).length * giftPrice;

  const offerEnabled = (siteContent["offers.enabled"] ?? "false") === "true";
  const offerType = siteContent["offers.type"] ?? "b1g1";
  const offerPercent = Number(siteContent["offers.percent"] ?? "20");
  const offerLabel = siteContent["offers.label"] || (
    offerType === "b1g1" ? "Buy 1 Get 1 Free" :
    offerType === "b2g1" ? "Buy 2 Get 1 Free" :
    offerType === "b4g1" ? "Buy 4 Get 1 Free" :
    `${offerPercent}% Off`
  );

  const offerDiscount = (() => {
    if (!offerEnabled || cart.length === 0) return 0;
    if (offerType === "percent") {
      return Math.round(cartTotal * offerPercent / 100);
    }
    const step = offerType === "b1g1" ? 2 : offerType === "b2g1" ? 3 : 5;
    const expanded = cart.flatMap(item => Array(item.quantity).fill(item.price)).sort((a: number, b: number) => a - b);
    let discount = 0;
    for (let i = 0; i < expanded.length; i += step) {
      discount += expanded[i];
    }
    return discount;
  })();

  return (
    <AppContext.Provider value={{
      products, productsLoading, reloadProducts,
      cart, wishlist,
      user, userLoading,
      orders,
      addToCart, removeFromCart, updateQuantity, toggleWishlist,
      login, register, logout, clearCart, updateProfile,
      loadMyOrders,
      cartCount, cartTotal, giftTotal, offerDiscount, offerEnabled, offerLabel,
      giftPrice, shippingFee, freeShippingMin, freeShippingEnabled,
      siteContent, reelsEnabled, reviewsEnabled,
      cartDrawerOpen, setCartDrawerOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
