import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ArrowRight, Minus, Plus, Trash2, Tag } from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { inr } from "@/data/products";
import { resolveImage } from "@/data/imageMap";

export default function CartDrawer() {
  const { cart, cartDrawerOpen, setCartDrawerOpen, removeFromCart, updateQuantity, cartTotal, shippingFee, freeShippingMin, freeShippingEnabled, offerDiscount, offerEnabled, offerLabel } = useApp();

  const discountedSubtotal = cartTotal - offerDiscount;
  const isFreeShipping = freeShippingEnabled && discountedSubtotal >= freeShippingMin;
  const shipping = isFreeShipping ? 0 : discountedSubtotal > 0 ? shippingFee : 0;
  const total = discountedSubtotal + shipping;

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[70] backdrop-blur-sm"
            onClick={() => setCartDrawerOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#1a1612] text-[#f5ede0] z-[80] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} strokeWidth={1.5} className="text-[#d4a853]" />
                <h2 className="font-serif text-xl text-[#f5ede0]">Your Bag</h2>
                {cart.length > 0 && (
                  <span className="text-xs bg-[#d4a853] text-[#1a1612] font-bold px-2 py-0.5 rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#9a8a76] hover:text-[#f5ede0] hover:bg-white/10 transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <ShoppingBag size={40} strokeWidth={1} className="text-[#3a3028] mb-4" />
                  <p className="text-[#9a8a76] text-sm font-light mb-2">Your bag is empty</p>
                  <p className="text-[#6a5a48] text-xs">Add some beautiful pieces to continue</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-start py-3 border-b border-white/5">
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm bg-[#2a2218]">
                      <img
                        src={item.image || resolveImage(null, null)}
                        alt={item.name}
                        className="w-full h-full object-cover opacity-90"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#f5ede0] truncate mb-0.5">{item.name}</p>
                      <p className="text-xs text-[#8a7a68] capitalize mb-2">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center hover:border-[#d4a853] hover:text-[#d4a853] transition-colors text-[#9a8a76]"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-sm font-medium w-5 text-center text-[#f5ede0]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center hover:border-[#d4a853] hover:text-[#d4a853] transition-colors text-[#9a8a76]"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#d4a853]">{inr(item.price * item.quantity)}</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#6a5a48] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t border-white/10 space-y-3">
                {/* Offer badge */}
                {offerEnabled && offerDiscount > 0 && (
                  <div className="flex items-center gap-2 bg-[#d4a853]/10 border border-[#d4a853]/30 rounded px-3 py-2">
                    <Tag size={12} className="text-[#d4a853] flex-shrink-0" />
                    <span className="text-[11px] text-[#d4a853] font-medium flex-1">{offerLabel} applied!</span>
                    <span className="text-[11px] text-[#d4a853] font-bold">-{inr(offerDiscount)}</span>
                  </div>
                )}

                {/* Free shipping progress */}
                {freeShippingEnabled && discountedSubtotal < freeShippingMin && discountedSubtotal > 0 && (
                  <div className="mb-1">
                    <div className="flex justify-between text-[10px] text-[#8a7a68] mb-1.5 uppercase tracking-widest">
                      <span>Free shipping at ₹{freeShippingMin.toLocaleString()}</span>
                      <span className="text-[#d4a853]">₹{(freeShippingMin - discountedSubtotal).toLocaleString()} away</span>
                    </div>
                    <div className="h-1 bg-[#2a2218] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#d4a853] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((discountedSubtotal / freeShippingMin) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7a68]">Subtotal</span>
                  <span className={offerDiscount > 0 ? "line-through text-[#6a5a48]" : "text-[#f5ede0]"}>{inr(cartTotal)}</span>
                </div>
                {offerDiscount > 0 && (
                  <div className="flex justify-between text-sm -mt-2">
                    <span className="text-[#d4a853] text-[11px]">After offer</span>
                    <span className="text-[#f5ede0] font-medium">{inr(discountedSubtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7a68]">Shipping</span>
                  <span className={isFreeShipping ? "text-[#d4a853] font-medium" : "text-[#f5ede0]"}>
                    {isFreeShipping ? "Free" : inr(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-white/10">
                  <span className="text-[#f5ede0]">Total</span>
                  <span className="text-[#d4a853] text-lg">{inr(total)}</span>
                </div>

                <Link href="/checkout" onClick={() => setCartDrawerOpen(false)}>
                  <button className="w-full bg-[#d4a853] text-[#1a1612] hover:bg-[#e8c06a] transition-colors py-4 text-xs uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 mt-2 rounded-sm">
                    Proceed to Checkout <ArrowRight size={14} />
                  </button>
                </Link>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full border border-white/20 hover:border-[#d4a853]/50 text-[#9a8a76] hover:text-[#f5ede0] transition-colors py-3 text-xs uppercase tracking-widest rounded-sm"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
