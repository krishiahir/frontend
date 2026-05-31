import { Link } from "wouter";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { inr } from "@/data/products";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, giftTotal, shippingFee, freeShippingMin } = useApp();

  const shipping = cartTotal >= freeShippingMin ? 0 : shippingFee;
  const total = cartTotal + shipping + giftTotal;

  return (
    <div className="bg-background min-h-screen text-foreground">
      <Navbar />

      <div className="pt-24 pb-12 text-center bg-muted/30 border-b border-border">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h1 className="text-3xl md:text-5xl font-serif mb-2">Your Cart</h1>
          <p className="text-muted-foreground font-light text-sm">
            {cart.length === 0
              ? "Your cart is empty"
              : `${cart.reduce((s, i) => s + i.quantity, 0)} item${cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}`}
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        {cart.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <ShoppingBag size={48} strokeWidth={1} className="mx-auto mb-6 text-muted-foreground/40" />
            <h2 className="font-serif text-2xl mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground font-light mb-8">Add some beautiful pieces to get started.</p>
            <Link href="/shop">
              <Button
                className="rounded-none bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-10 py-6 text-xs uppercase tracking-widest"
                data-testid="cart-shop-link"
              >
                Shop the Collection
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-0">
              {cart.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 md:gap-6 py-6 md:py-8 border-b border-border"
                  data-testid={`cart-item-${item.id}`}
                >
                  <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 bg-card overflow-hidden rounded-sm">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover object-center" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-serif text-sm md:text-base truncate">{item.name}</h3>
                        <p className="text-muted-foreground text-xs mt-1 capitalize">{item.category} · 18k Gold Plated</p>
                        {item.isGift && (
                          <div className="mt-2 flex items-start gap-2 bg-[#f5ede0] px-2.5 py-1.5">
                            <Gift size={10} className="text-[#d4a853] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-[#d4a853]">Gift wrapping · +₹99</p>
                              {item.giftMessage && (
                                <p className="text-[11px] text-foreground/60 font-light mt-0.5 italic">"{item.giftMessage}"</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
                        data-testid={`remove-item-${item.id}`}
                        title="Remove"
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 md:p-2 hover:bg-muted transition-colors"
                          data-testid={`qty-decrease-${item.id}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium border-x border-border min-w-[2.5rem] text-center" data-testid={`qty-value-${item.id}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 md:p-2 hover:bg-muted transition-colors"
                          data-testid={`qty-increase-${item.id}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="font-medium text-sm" data-testid={`item-total-${item.id}`}>
                        {inr(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border p-6 md:p-8 lg:sticky lg:top-28 rounded-sm"
              >
                <h2 className="font-serif text-lg md:text-xl mb-6 pb-4 border-b border-border">Order Summary</h2>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="cart-subtotal">{inr(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span data-testid="cart-shipping" className={shipping === 0 ? "text-primary" : ""}>
                      {shipping === 0 ? "Free" : inr(shipping)}
                    </span>
                  </div>
                  {giftTotal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Gift size={11} strokeWidth={1.5} />
                        Gift Wrapping
                      </span>
                      <span data-testid="cart-gift">{inr(giftTotal)}</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground font-light">Free shipping on orders over ₹{freeShippingMin.toLocaleString("en-IN")}</p>
                  )}
                  <div className="flex justify-between pt-4 border-t border-border font-semibold text-base">
                    <span>Total</span>
                    <span data-testid="cart-total">{inr(total)}</span>
                  </div>
                </div>

                <Link href="/checkout">
                  <Button
                    className="w-full rounded-none bg-foreground text-background hover:bg-primary hover:text-primary-foreground py-5 md:py-6 text-xs uppercase tracking-widest mb-3 transition-all duration-300 flex items-center justify-center gap-2"
                    data-testid="checkout-btn"
                  >
                    Proceed to Checkout <ArrowRight size={14} />
                  </Button>
                </Link>

                <Link href="/shop">
                  <button
                    className="w-full text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2"
                    data-testid="continue-shopping-btn"
                  >
                    Continue Shopping
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
