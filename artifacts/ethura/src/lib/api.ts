const BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+api/, "/api");

function getToken() {
  return localStorage.getItem("ethura_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: ApiUser }>("/auth/login", {
        method: "POST", body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<{ token: string; user: ApiUser }>("/auth/register", {
        method: "POST", body: JSON.stringify({ name, email, password }),
      }),
    me: () => request<ApiUser>("/auth/me"),
    updateProfile: (data: { name: string; email: string; phone?: string; address?: string }) =>
      request<{ user: ApiUser }>("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
    forgotPassword: (email: string) =>
      request<{ success: boolean }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    verifyOtp: (email: string, otp: string) =>
      request<{ success: boolean }>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) }),
    resetPassword: (email: string, otp: string, password: string) =>
      request<{ success: boolean }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp, password }) }),
  },
  products: {
    list: () => request<ApiProduct[]>("/products"),
    listAll: () => request<ApiProduct[]>("/products/all"),
    get: (id: number) => request<ApiProduct>(`/products/${id}`),
    create: (data: Partial<ApiProduct>) =>
      request<ApiProduct>("/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ApiProduct>) =>
      request<ApiProduct>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/products/${id}`, { method: "DELETE" }),
  },
  orders: {
    create: (data: CreateOrderPayload) =>
      request<ApiOrder>("/orders", { method: "POST", body: JSON.stringify(data) }),
    my: () => request<ApiOrder[]>("/orders/my"),
    list: () => request<ApiOrder[]>("/orders"),
    updateStatus: (id: string, status: string) =>
      request<ApiOrder>(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
    cancel: (id: string) =>
      request<ApiOrder>(`/orders/${id}/cancel`, { method: "POST" }),
  },
  payments: {
    config: () => request<{ keyId: string | null; configured: boolean }>("/payments/config"),
    createOrder: (amount: number) =>
      request<{ id: string; amount: number; currency: string; mock?: boolean }>("/payments/create-order", {
        method: "POST", body: JSON.stringify({ amount }),
      }),
    verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      request<{ verified: boolean }>("/payments/verify", { method: "POST", body: JSON.stringify(data) }),
  },
  featureCards: {
    list: () => request<ApiFeatureCard[]>("/feature-cards"),
    create: (data: Partial<ApiFeatureCard>) =>
      request<ApiFeatureCard>("/feature-cards", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ApiFeatureCard>) =>
      request<ApiFeatureCard>(`/feature-cards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/feature-cards/${id}`, { method: "DELETE" }),
  },
  admin: {
    kpi: () => request<AdminKpi>("/admin/kpi"),
    customers: () => request<ApiCustomer[]>("/admin/customers"),
  },
  shipping: {
    zones: () => request<{ id: number; minKm: number; maxKm: number; charge: number }[]>("/shipping/zones"),
    createZone: (data: { minKm: number; maxKm: number; charge: number }) =>
      request<any>("/shipping/zones", { method: "POST", body: JSON.stringify(data) }),
    updateZone: (id: number, data: { minKm: number; maxKm: number; charge: number }) =>
      request<any>(`/shipping/zones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteZone: (id: number) =>
      request<{ ok: boolean }>(`/shipping/zones/${id}`, { method: "DELETE" }),
    calculate: (userPincode: string) =>
      request<{ charge: number; distance: number; originPincode?: string; message?: string }>("/shipping/calculate", { method: "POST", body: JSON.stringify({ userPincode }) }),
  },
  promo: {
    validate: (code: string) =>
      request<{ discountPercent: number; code: string }>("/promo/validate", { method: "POST", body: JSON.stringify({ code }) }),
    use: (code: string) =>
      request<{ success: boolean }>("/promo/use", { method: "POST", body: JSON.stringify({ code }) }),
    list: () => request<any[]>("/admin/promo-codes"),
    create: (data: { code: string; discountPercent: number; isActive?: boolean; maxUses?: number | null }) =>
      request<any>("/admin/promo-codes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request<any>(`/admin/promo-codes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/admin/promo-codes/${id}`, { method: "DELETE" }),
  },
  cartActivity: {
    track: (data: { userId?: number; userName?: string; userEmail?: string; sessionId?: string; productId: number; productName: string; productPrice: number; quantity: number }) =>
      request<{ success: boolean }>("/cart-activity", { method: "POST", body: JSON.stringify(data) }),
    list: (params?: { page?: number; limit?: number; search?: string; filter?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.search) q.set("search", params.search);
      if (params?.filter) q.set("filter", params.filter);
      return request<{ activities: any[]; total: number; page: number; limit: number; totalPages: number }>(`/admin/cart-activities?${q}`);
    },
  },
  siteFeatures: {
    list: () => request<ApiSiteFeature[]>("/site-features"),
    listAll: () => request<ApiSiteFeature[]>("/site-features/all"),
    create: (data: { label: string; icon?: string; sortOrder?: number; isActive?: boolean }) =>
      request<ApiSiteFeature>("/site-features", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ApiSiteFeature>) =>
      request<ApiSiteFeature>(`/site-features/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/site-features/${id}`, { method: "DELETE" }),
  },
  siteContent: {
    get: () => request<Record<string, string>>("/site-content"),
    save: (updates: Record<string, string>) =>
      request<{ ok: boolean; saved: number }>("/site-content", {
        method: "PUT", body: JSON.stringify({ updates }),
      }),
  },
  reels: {
    list: () => request<ApiReel[]>("/reels"),
    listAll: () => request<ApiReel[]>("/reels/all"),
    create: (data: Partial<ApiReel>) =>
      request<ApiReel>("/reels", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ApiReel>) =>
      request<ApiReel>(`/reels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/reels/${id}`, { method: "DELETE" }),
  },
  master: {
    listTypes: () => request<ApiProductType[]>("/master/types"),
    createType: (data: { name: string; slug: string; sortOrder?: number }) =>
      request<ApiProductType>("/master/types", { method: "POST", body: JSON.stringify(data) }),
    updateType: (id: number, data: Partial<ApiProductType>) =>
      request<ApiProductType>(`/master/types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    listCategories: (typeId?: number) =>
      request<ApiProductCategory[]>(`/master/categories${typeId ? `?typeId=${typeId}` : ""}`),
    createCategory: (data: { typeId: number; name: string; slug: string; sortOrder?: number }) =>
      request<ApiProductCategory>("/master/categories", { method: "POST", body: JSON.stringify(data) }),
    updateCategory: (id: number, data: Partial<ApiProductCategory>) =>
      request<ApiProductCategory>(`/master/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  reviews: {
    forProduct: (productId: number) => request<ApiReview[]>(`/products/${productId}/reviews`),
    submit: (data: { productId: number; orderId?: string; rating: number; title?: string; body: string; imageUrl?: string }) =>
      request<ApiReview>("/reviews", { method: "POST", body: JSON.stringify(data) }),
    adminList: () => request<ApiReview[]>("/admin/reviews"),
    setVisibility: (id: number, isVisible: boolean) =>
      request<ApiReview>(`/admin/reviews/${id}/visibility`, { method: "PATCH", body: JSON.stringify({ isVisible }) }),
    adminDelete: (id: number) =>
      request<{ success: boolean }>(`/admin/reviews/${id}`, { method: "DELETE" }),
    adminCreate: (data: { productId: number; reviewerName: string; rating: number; title?: string; body: string; imageUrl?: string; isVisible?: boolean }) =>
      request<ApiReview>("/admin/reviews", { method: "POST", body: JSON.stringify(data) }),
    adminUpdate: (id: number, data: { reviewerName?: string; rating?: number; title?: string; body?: string; imageUrl?: string; isVisible?: boolean }) =>
      request<ApiReview>(`/admin/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  reviewReminders: {
    register: (productId: number, orderId?: string) =>
      request<{ id: number }>("/review-reminders", { method: "POST", body: JSON.stringify({ productId, orderId }) }),
    markReviewed: (productId: number) =>
      request<{ success: boolean }>("/review-reminders/mark-reviewed", { method: "PATCH", body: JSON.stringify({ productId }) }),
  },
  contact: {
    submit: (data: { name: string; email: string; subject: string; message: string }) =>
      request<{ success: boolean; id: number }>("/contact", { method: "POST", body: JSON.stringify(data) }),
    adminList: () => request<ApiContactMessage[]>("/admin/contact-messages"),
    markRead: (id: number) =>
      request<ApiContactMessage>(`/admin/contact-messages/${id}/read`, { method: "PATCH" }),
    reply: (id: number, replyContent: string) =>
      request<{ success: boolean }>(`/admin/contact-messages/${id}/reply`, { method: "POST", body: JSON.stringify({ replyContent }) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/admin/contact-messages/${id}`, { method: "DELETE" }),
  },
};

export function setToken(token: string) { localStorage.setItem("ethura_token", token); }
export function clearToken() { localStorage.removeItem("ethura_token"); }

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  isAdmin: boolean;
}

export interface ApiProductType {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number | null;
  imageUrl: string | null;
}

export interface ApiContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  repliedAt: string | null;
  replyContent: string | null;
  createdAt: string;
}

export interface ApiProductCategory {
  id: number;
  typeId: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number | null;
}

export interface ApiProduct {
  id: number;
  name: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  description: string;
  imageKey: string | null;
  imageUrl: string | null;
  featureImageUrl: string | null;
  images: string | null;
  badge: string | null;
  stock: number | null;
  isFeatured: boolean | null;
  isActive: boolean;
  eligibleForOffer: boolean | null;
  createdAt: string;
  avgRating?: number;
  reviewCount?: number;
}

export interface ApiOrderItem {
  id: number;
  orderId: string;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  isGift: boolean;
  giftMessage: string | null;
  productImageKey?: string | null;
  productImageUrl?: string | null;
}

export interface ApiOrder {
  id: string;
  userId: number | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  paymentMethod: string | null;
  status: string;
  total: number;
  address: string;
  paymentId: string | null;
  paymentStatus: string | null;
  razorpayOrderId: string | null;
  isGift: boolean;
  giftMessage: string | null;
  notes: string | null;
  cancelledBy: string | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  items?: ApiOrderItem[];
  canCancel?: boolean;
  hoursLeftToCancel?: number;
  refundPercent?: number;
}

export interface ApiFeatureCard {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  badge: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AdminKpi {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
}

export interface ApiSiteFeature {
  id: number;
  label: string;
  icon: string | null;
  sortOrder: number | null;
  isActive: boolean;
}

export interface ApiReel {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  sortOrder: number | null;
  createdAt: string;
}

export interface ApiCustomer {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string | null;
}

export interface ApiReview {
  id: number;
  productId: number;
  userId: number | null;
  orderId: string | null;
  reviewerName: string;
  rating: number;
  title: string | null;
  body: string;
  imageUrl: string | null;
  isVisible: boolean;
  createdAt: string;
  productName?: string | null;
}

export interface CreateOrderPayload {
  items: Array<{ id: number; name: string; price: number; quantity: number; isGift?: boolean; giftMessage?: string }>;
  shippingData: {
    firstName: string; lastName: string; email: string;
    phone: string; address: string; city: string; state: string; zip: string; country: string;
  };
  total: number;
  paymentId?: string;
  razorpayOrderId?: string;
  isGift?: boolean;
  giftMessage?: string;
}
