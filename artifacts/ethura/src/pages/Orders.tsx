import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, RefreshCw, AlertCircle, ShoppingBag, X, ChevronDown, ChevronUp,
  Gift, Clock, Star, Camera, SendHorizonal, CheckCircle, MapPin, ArrowLeft,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import type { ApiOrder } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { printOrderBill } from "@/lib/printBill";
import { resolveImage } from "@/data/imageMap";

const inr = (n: number) => "\u20B9" + n.toLocaleString("en-IN");

const TRACK_STAGES = [
  { key: "placed",     label: "Order Placed",  icon: "\uD83D\uDCCB", desc: "Your order has been received" },
  { key: "processing", label: "Processing",     icon: "\u2699\uFE0F",  desc: "We are preparing your items" },
  { key: "shipped",    label: "Shipped",        icon: "\uD83D\uDE9A",  desc: "Your order is on the way" },
  { key: "delivered",  label: "Delivered",      icon: "\u2705",  desc: "Order delivered successfully" },
];

function getStageIndex(status: string): number {
  if (status === "delivered")  return 3;
  if (status === "shipped")    return 2;
  if (status === "processing") return 1;
  return 0;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-600",
};

function ReviewModal({ item, orderId, onClose, onSubmitted }: {
  item: { productId?: number; productName: string };
  orderId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!rating) { setError("Please select a star rating"); return; }
    if (!body.trim()) { setError("Please write something about your experience"); return; }
    if (!item.productId) { setError("Unable to determine product"); return; }
    setSubmitting(true); setError("");
    try {
      await api.reviews.submit({ productId: item.productId, orderId, rating, title: title.trim() || undefined, body: body.trim(), imageUrl: imageUrl || undefined });
      api.reviewReminders.markReviewed(item.productId).catch(() => {});
      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-[#1a1612] px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">Write a Review</p>
              <p className="text-white/50 text-[11px] mt-0.5 truncate">{item.productName}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Your Rating *</p>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                    <Star size={28} className={(hovered || rating) >= s ? "fill-[#d4a853] text-[#d4a853]" : "text-muted-foreground/30"} strokeWidth={1.5} />
                  </button>
                ))}
                <span className="text-sm text-muted-foreground ml-1">{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][hovered || rating] || ""}</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Headline <span className="normal-case opacity-60">(optional)</span></p>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Beautiful quality!" maxLength={80}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Your Experience *</p>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Tell us what you loved (or didn't)…" maxLength={300} rows={3}
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a853]/30 resize-none" />
              <p className="text-[10px] text-muted-foreground/50 text-right mt-0.5">{body.length}/300</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">Add a Photo <span className="normal-case opacity-60">(optional)</span></p>
              {imageUrl ? (
                <div className="relative inline-block">
                  <img src={imageUrl} alt="Review" className="h-20 w-20 object-cover rounded-xl border border-border" />
                  <button onClick={() => setImageUrl(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"><X size={10} /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-muted-foreground/30 rounded-xl text-sm text-muted-foreground hover:border-[#d4a853] hover:text-[#d4a853] transition-colors">
                  <Camera size={15} strokeWidth={1.5} /> Upload photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#d4a853] text-[#1a1612] text-[12px] uppercase tracking-widest font-semibold rounded-xl hover:bg-[#c49840] transition-all duration-300 disabled:opacity-60">
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function OrderCard({ order, onCancelled }: { order: ApiOrder; onCancelled: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelResult, setCancelResult] = useState<{ refundAmount: number; processingFee: number } | null>(null);
  const [reviewItem, setReviewItem] = useState<{ productId?: number; productName: string } | null>(null);
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
  const stageIdx = getStageIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const hoursLeft = order.hoursLeftToCancel ?? 0;
  const refundAmt = Math.round(order.total * ((order.refundPercent ?? 60) / 100));
  const retainAmt = order.total - refundAmt;

  async function handleCancel() {
    setCancelling(true); setCancelError("");
    try {
      const result = await api.orders.cancel(order.id) as any;
      setCancelResult({ refundAmount: result.refundAmount, processingFee: result.processingFee });
      onCancelled(order.id);
      setShowCancelConfirm(false);
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <AnimatePresence>
        {showCancelConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowCancelConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                <div className="bg-[#1a1612] px-6 py-4 flex items-center justify-between">
                  <p className="text-white font-semibold text-sm">Cancel Order?</p>
                  <button onClick={() => setShowCancelConfirm(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">Are you sure you want to cancel <span className="font-mono font-bold text-foreground">{order.id}</span>?</p>
                  <div className={`border rounded-xl p-4 mb-4 space-y-2 ${(order.refundPercent ?? 100) === 100 ? "bg-green-50 border-green-200" : "bg-[#faf8f5] border-[#e8ddd0]"}`}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Refund Breakdown</p>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order Total</span><span className="font-semibold">{inr(order.total)}</span></div>
                    {retainAmt > 0 && <div className="flex justify-between text-sm"><span className="text-red-500">Processing fee (40%)</span><span className="font-semibold text-red-500">- {inr(retainAmt)}</span></div>}
                    <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                      <span className="text-green-700">You will receive ({order.refundPercent ?? 100}%)</span>
                      <span className="text-green-700">{inr(refundAmt)}</span>
                    </div>
                  </div>
                  {hoursLeft > 0 ? (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">
                      <Clock size={13} className="text-green-600 flex-shrink-0" />
                      <p className="text-[11px] text-green-700">Cancel within <strong>{Math.floor(hoursLeft)}h {Math.round((hoursLeft % 1) * 60)}m</strong> for a <strong>100% refund</strong></p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                      <Clock size={13} className="text-amber-600 flex-shrink-0" />
                      <p className="text-[11px] text-amber-700">Past the 24-hour window · <strong>60% refund</strong> applies.</p>
                    </div>
                  )}
                  {cancelError && <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3"><AlertCircle size={13} /> {cancelError}</div>}
                  <div className="flex gap-3">
                    <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2.5 text-xs uppercase tracking-widest border border-border rounded-xl hover:border-foreground transition-colors">Keep Order</button>
                    <button onClick={handleCancel} disabled={cancelling}
                      className="flex-1 py-2.5 text-xs uppercase tracking-widest bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                      {cancelling ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <X size={13} />}
                      {cancelling ? "Cancelling…" : "Yes, Cancel"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {cancelResult && (
        <div className="bg-green-50 border-b border-green-200 px-5 py-3 flex items-center gap-2.5">
          <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-700">Order cancelled. <strong>{inr(cancelResult.refundAmount)}</strong> will be refunded within 5-7 business days.</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 cursor-pointer select-none hover:bg-[#faf8f5] transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex -space-x-2 flex-shrink-0">
            {(order.items || []).slice(0, 3).map((item, i) => (
              <div key={i} className="w-11 h-11 rounded-xl border-2 border-white overflow-hidden bg-[#d4a853]/10 flex-shrink-0" style={{ zIndex: 3 - i }}>
                {item.productImageKey || item.productImageUrl
                  ? <img src={resolveImage(item.productImageKey ?? null, item.productImageUrl ?? null)} alt={item.productName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[#d4a853] text-xs">{"\u2726"}</div>}
              </div>
            ))}
            {(order.items?.length || 0) > 3 && (
              <div className="w-11 h-11 rounded-xl border-2 border-white bg-[#1a1612] flex items-center justify-center flex-shrink-0" style={{ zIndex: 0 }}>
                <span className="text-white text-[10px] font-bold">+{(order.items?.length || 0) - 3}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono text-[10px] font-bold text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>{order.status}</span>
            </div>
            <p className="text-sm font-medium text-foreground mt-0.5 truncate">
              {(order.items || []).map(i => i.productName).join(", ").slice(0, 40) || "Order"}
              {(order.items || []).map(i => i.productName).join(", ").length > 40 ? "…" : ""}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              {" · "}{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="font-bold text-sm text-[#d4a853]">{inr(order.total)}</p>
            <p className={`text-[10px] font-medium ${order.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"}`}>
              {order.paymentStatus === "paid" ? "Paid" : "Pending"}
            </p>
          </div>
          {expanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-border px-4 sm:px-5 py-5 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">Delivery Tracking</p>
                {isCancelled ? (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-lg">{"\u274C"}</div>
                    <div><p className="text-sm font-semibold text-red-700">Order Cancelled</p><p className="text-xs text-red-500 mt-0.5">This order has been cancelled</p></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
                    <div className="absolute left-4 top-4 w-0.5 bg-[#d4a853] transition-all duration-700" style={{ height: `${(stageIdx / (TRACK_STAGES.length - 1)) * 100}%` }} />
                    <div className="space-y-5">
                      {TRACK_STAGES.map((stage, i) => {
                        const isDone = i <= stageIdx;
                        const isCurrent = i === stageIdx;
                        return (
                          <div key={stage.key} className="flex items-start gap-4 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0 z-10 transition-all ${isDone ? "bg-[#d4a853] border-[#d4a853] text-white shadow-md" : "bg-white border-border text-muted-foreground"} ${isCurrent ? "ring-4 ring-[#d4a853]/20" : ""}`}>
                              {isDone ? (isCurrent ? stage.icon : "\u2713") : <span className="w-2 h-2 rounded-full bg-border" />}
                            </div>
                            <div className={`pt-0.5 ${isDone ? "" : "opacity-40"}`}>
                              <p className={`text-sm font-semibold ${isCurrent ? "text-[#d4a853]" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                                {stage.label}
                                {isCurrent && <span className="ml-2 text-[10px] font-normal text-[#d4a853] uppercase tracking-widest">Current</span>}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{stage.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Items Ordered</p>
                <div className="space-y-3">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-[#faf8f5] overflow-hidden">
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#d4a853]/10 flex-shrink-0 border border-border">
                          {item.productImageKey || item.productImageUrl
                            ? <img src={resolveImage(item.productImageKey ?? null, item.productImageUrl ?? null)} alt={item.productName} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-[#d4a853] text-lg">{"\u2726"}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug truncate">{item.productName}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Qty {item.quantity} × {inr(item.productPrice)}</p>
                          {item.isGift && item.giftMessage && (
                            <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1"><Gift size={10} /> {item.giftMessage}</p>
                          )}
                        </div>
                        <p className="font-bold text-sm text-[#d4a853] flex-shrink-0">{inr(item.productPrice * item.quantity)}</p>
                      </div>
                      {isDelivered && (
                        reviewedItems.has(item.productName) ? (
                          <div className="border-t border-green-100 bg-green-50 px-3 py-2 flex items-center justify-center gap-2">
                            <Star size={11} className="fill-green-500 text-green-500" />
                            <span className="text-[11px] text-green-700 font-medium">Review submitted</span>
                          </div>
                        ) : (
                          <button
                            onClick={e => { e.stopPropagation(); setReviewItem({ productId: item.productId, productName: item.productName }); }}
                            className="w-full border-t border-[#d4a853]/20 bg-gradient-to-r from-[#d4a853]/10 to-[#d4a853]/5 px-3 py-2.5 flex items-center justify-center gap-2 hover:from-[#d4a853]/20 hover:to-[#d4a853]/10 transition-colors group"
                          >
                            <Star size={13} className="text-[#d4a853] group-hover:fill-[#d4a853] transition-colors" strokeWidth={2} />
                            <span className="text-[12px] text-[#d4a853] font-semibold uppercase tracking-wide">Write a Review</span>
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl bg-[#1a1612] text-white">
                  <div>
                    <p className="text-[10px] text-white/50">Shipping: <span className="text-green-400 font-medium">Free</span></p>
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {order.paymentMethod === "razorpay" ? "Razorpay (Online)" : "Cash on Delivery"}
                      {" · "}<span className={order.paymentStatus === "paid" ? "text-green-400" : "text-amber-400"}>{order.paymentStatus === "paid" ? "Paid" : "Pending"}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Total</p>
                    <p className="font-bold text-lg text-[#d4a853]">{inr(order.total)}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Shipping Address</p>
                <div className="flex items-start gap-2.5 bg-[#faf8f5] rounded-xl px-3 py-3">
                  <MapPin size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <p className="text-sm text-foreground leading-relaxed">{order.address}</p>
                </div>
              </div>

              {order.isGift && order.giftMessage && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <span className="text-base">{"\uD83C\uDF81"}</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-widest mb-0.5">Gift Message</p>
                    <p className="text-sm text-amber-900 italic">"{order.giftMessage}"</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={e => { e.stopPropagation(); printOrderBill(order); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1a1612] text-white text-[11px] uppercase tracking-widest font-medium rounded-xl hover:bg-[#d4a853] hover:text-[#1a1612] transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Download Invoice
                </button>
                {order.canCancel && !cancelResult && (
                  <button onClick={e => { e.stopPropagation(); setShowCancelConfirm(true); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-red-300 text-red-600 text-[11px] uppercase tracking-widest font-medium rounded-xl hover:bg-red-50 transition-colors">
                    <X size={13} /> Cancel Order
                  </button>
                )}
              </div>

              {order.canCancel && !cancelResult && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${hoursLeft > 0 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                  <Clock size={12} className={hoursLeft > 0 ? "text-green-600" : "text-amber-600"} />
                  <p className={`text-[11px] ${hoursLeft > 0 ? "text-green-700" : "text-amber-700"}`}>
                    {hoursLeft > 0
                      ? <>Free cancellation for <strong>{Math.floor(hoursLeft)}h {Math.round((hoursLeft % 1) * 60)}m</strong> · 100% refund</>
                      : <>Past 24-hour window · <strong>60% refund</strong> if cancelled</>
                    }
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reviewItem && (
          <ReviewModal item={reviewItem} orderId={order.id} onClose={() => setReviewItem(null)}
            onSubmitted={() => setReviewedItems(prev => new Set([...prev, reviewItem.productName]))} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Orders() {
  const { user, userLoading } = useApp();
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [reviewPrompt, setReviewPrompt] = useState<{ orderId: string; item: { productId?: number; productName: string } } | null>(null);
  const [directReviewItem, setDirectReviewItem] = useState<{ orderId: string; item: { productId?: number; productName: string } } | null>(null);
  const reviewPromptShown = useRef(false);

  useEffect(() => {
    if (!userLoading && !user) navigate("/login");
  }, [user, userLoading, navigate]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true); setOrdersError("");
    try {
      const data = await api.orders.my();
      setOrders(data);
      if (!reviewPromptShown.current) {
        const promptedKey = "ethura_review_prompted";
        const alreadyPrompted: number[] = JSON.parse(localStorage.getItem(promptedKey) || "[]");
        let foundItem: { orderId: string; item: { productId?: number; productName: string } } | null = null;
        for (const order of data) {
          if (order.status !== "delivered" || !order.items?.length) continue;
          for (const item of order.items) {
            if (item.productId && alreadyPrompted.includes(item.productId)) continue;
            foundItem = { orderId: order.id, item: { productId: item.productId, productName: item.productName } };
            break;
          }
          if (foundItem) break;
        }
        if (foundItem) {
          reviewPromptShown.current = true;
          const { orderId, item } = foundItem;
          if (item.productId) {
            localStorage.setItem(promptedKey, JSON.stringify([...alreadyPrompted, item.productId]));
            api.reviewReminders.register(item.productId, orderId).catch(() => {});
          }
          setTimeout(() => setReviewPrompt({ orderId, item }), 900);
        }
      }
    } catch (err: any) {
      setOrdersError(err.message || "Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadOrders();
  }, [user, loadOrders]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#d4a853] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const filtered = orderFilter === "all" ? orders : orders.filter(o => o.status === orderFilter);
  const totalSpent = orders.reduce((s, o) => s + (o.status !== "cancelled" ? o.total : 0), 0);

  return (
    <>
      <Navbar />

      <AnimatePresence>
        {reviewPrompt && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setReviewPrompt(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
              <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden pointer-events-auto">
                <div className="bg-[#1a1612] px-6 pt-7 pb-6 text-center relative">
                  <button onClick={() => setReviewPrompt(null)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"><X size={18} /></button>
                  <div className="w-14 h-14 rounded-full bg-[#d4a853]/20 border-2 border-[#d4a853]/40 flex items-center justify-center mx-auto mb-3">
                    <Star size={24} className="text-[#d4a853]" strokeWidth={1.5} />
                  </div>
                  <p className="text-white font-serif text-xl mb-1">How was your order?</p>
                  <p className="text-white/50 text-sm">Share your experience with others</p>
                </div>
                <div className="px-6 py-5">
                  <div className="bg-[#faf8f5] rounded-xl px-4 py-3 mb-5 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Item</p>
                    <p className="text-sm font-semibold text-foreground">{reviewPrompt.item.productName}</p>
                  </div>
                  <button onClick={() => { setDirectReviewItem(reviewPrompt); setReviewPrompt(null); }}
                    className="w-full py-3.5 bg-[#d4a853] text-[#1a1612] text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-[#b8923f] transition-colors flex items-center justify-center gap-2">
                    <Star size={15} className="fill-[#1a1612]" /> Write a Review
                  </button>
                  <button onClick={() => setReviewPrompt(null)} className="w-full mt-2.5 py-2.5 text-[11px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {directReviewItem && (
          <ReviewModal item={directReviewItem.item} orderId={directReviewItem.orderId}
            onClose={() => setDirectReviewItem(null)} onSubmitted={() => setDirectReviewItem(null)} />
        )}
      </AnimatePresence>

      <main className="min-h-screen bg-[#faf8f5] pt-[72px]">
        <div className="bg-gradient-to-b from-[#1a1612] to-[#2a231c] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-14 sm:pb-16">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link href="/profile" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-[11px] uppercase tracking-widest mb-5 transition-colors">
                <ArrowLeft size={13} /> Back to Profile
              </Link>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl">My Orders</h1>
                  <p className="text-white/40 text-sm mt-1">
                    {ordersLoading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`}
                  </p>
                </div>
                <button onClick={loadOrders} disabled={ordersLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-xs font-medium transition-all disabled:opacity-50 border border-white/10">
                  <RefreshCw size={13} className={ordersLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 pb-12 space-y-5">

          {!ordersLoading && orders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: "Total Orders", value: String(orders.length), color: "text-[#d4a853]" },
                  { label: "Delivered", value: String(orders.filter(o => o.status === "delivered").length), color: "text-green-600" },
                  { label: "Total Spent", value: inr(totalSpent), color: "text-[#1a1612]" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-border px-3 sm:px-4 py-4 text-center shadow-sm">
                    <p className={`font-bold text-base sm:text-2xl truncate ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!ordersLoading && orders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { key: "all", label: "All", count: orders.length },
                  { key: "processing", label: "Processing", count: orders.filter(o => o.status === "processing").length },
                  { key: "shipped", label: "Shipped", count: orders.filter(o => o.status === "shipped").length },
                  { key: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
                  { key: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
                ].filter(f => f.count > 0 || f.key === "all").map(f => (
                  <button key={f.key} onClick={() => setOrderFilter(f.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all whitespace-nowrap flex-shrink-0 ${
                      orderFilter === f.key
                        ? "bg-[#d4a853] text-[#1a1612] shadow-[0_2px_8px_0_rgba(212,168,83,0.3)]"
                        : "bg-white border border-border text-muted-foreground hover:border-[#d4a853]/50 hover:text-foreground"
                    }`}>
                    {f.label}
                    {f.count > 0 && (
                      <span className={`text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold ${
                        orderFilter === f.key ? "bg-[#1a1612]/15 text-[#1a1612]" : "bg-[#d4a853]/15 text-[#b8923f]"
                      }`}>{f.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {ordersLoading && (
            <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-border shadow-sm">
              <div className="w-10 h-10 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading your orders…</p>
            </div>
          )}

          {ordersError && !ordersLoading && (
            <div className="flex items-start gap-3 text-red-600 bg-red-50 rounded-2xl px-5 py-4 border border-red-200">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div><p className="text-sm font-semibold">Couldn't load orders</p><p className="text-xs mt-0.5">{ordersError}</p></div>
            </div>
          )}

          {!ordersLoading && !ordersError && orders.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center py-24 bg-white rounded-3xl border border-border shadow-sm">
                <div className="w-20 h-20 rounded-full bg-[#d4a853]/10 flex items-center justify-center mx-auto mb-5">
                  <ShoppingBag size={36} className="text-[#d4a853]" strokeWidth={1} />
                </div>
                <h3 className="font-serif text-2xl text-[#1a1612] mb-2">No orders yet</h3>
                <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">Start shopping and your orders will appear here.</p>
                <Link href="/shop" className="inline-flex items-center gap-2 bg-[#d4a853] text-[#1a1612] text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl hover:bg-[#c49840] transition-all font-semibold">
                  Browse Collection
                </Link>
              </div>
            </motion.div>
          )}

          {!ordersLoading && !ordersError && orders.length > 0 && (
            <>
              {filtered.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-border shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#d4a853]/10 flex items-center justify-center mx-auto mb-4">
                    <Package size={24} className="text-[#d4a853]" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">No {orderFilter} orders</p>
                  <p className="text-[12px] text-muted-foreground">You don't have any {orderFilter} orders yet.</p>
                </div>
              )}
              <div className="space-y-4">
                {filtered.map((order, i) => (
                  <OrderCard key={order.id} order={order} onCancelled={id => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled", canCancel: false } : o))} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
