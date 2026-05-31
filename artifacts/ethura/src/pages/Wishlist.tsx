import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Heart, ShoppingBag, X, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useApp } from "@/context/AppContext";
import { inr } from "@/data/products";
import { resolveImage } from "@/data/imageMap";

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, products } = useApp();

  const likedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="bg-[#faf9f7] min-h-screen text-foreground">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-10 md:pt-36 md:pb-12 px-4 border-b border-[#e8e2d9]">
        <div className="max-w-7xl mx-auto flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px w-8 bg-[#d4a853]" />
              <span className="text-[#d4a853] text-[10px] uppercase tracking-[0.3em]">Your Collection</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif leading-tight">
              Liked <span className="italic text-[#d4a853]">Pieces</span>
            </h1>
          </div>
          {likedProducts.length > 0 && (
            <p className="text-muted-foreground text-sm font-light pb-2">
              {likedProducts.length} {likedProducts.length === 1 ? "piece" : "pieces"} saved
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-20 px-4 min-h-[50vh]">
        <div className="max-w-7xl mx-auto">
          {likedProducts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 md:gap-x-8 gap-y-12 md:gap-y-16">
              <AnimatePresence mode="popLayout">
                {likedProducts.map((product, i) => (
                  <WishlistCard
                    key={product.id}
                    product={product}
                    delay={(i % 4) * 0.07}
                    onRemove={() => toggleWishlist(product.id)}
                    onAdd={() => addToCart(product)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {likedProducts.length > 0 && (
        <div className="pb-16 px-4 text-center">
          <Link href="/shop">
            <button className="border border-[#1a1612] text-[#1a1612] hover:bg-[#1a1612] hover:text-[#f5ede0] transition-all duration-300 px-12 py-4 text-xs uppercase tracking-[0.2em]">
              Continue Shopping
            </button>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
}

function WishlistCard({
  product,
  delay,
  onRemove,
  onAdd,
}: {
  product: import("@/lib/api").ApiProduct;
  delay: number;
  onRemove: () => void;
  onAdd: () => void;
}) {
  const [added, setAdded] = useState(false);
  const [, navigate] = useLocation();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5, delay }}
      className="group relative"
      data-testid={`wishlist-card-${product.id}`}
    >
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 hover:bg-red-50"
        data-testid={`wishlist-remove-${product.id}`}
        title="Remove from liked"
      >
        <X size={12} className="text-foreground/60" />
      </button>

      {/* Image */}
      <div
        className="relative overflow-hidden aspect-[4/5] bg-[#f5f3ef] mb-4 cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img
          src={resolveImage(product.imageKey, product.imageUrl)}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 bg-[#1a1612] text-[#f5ede0] text-[9px] uppercase tracking-widest px-2.5 py-1">
            {product.badge}
          </span>
        )}
        {/* Filled heart indicator */}
        <div className="absolute bottom-3 left-3">
          <Heart size={13} fill="#d4a853" className="text-[#d4a853]" />
        </div>

        {/* Add to bag slide-up */}
        <div className="absolute bottom-0 left-0 right-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleAdd}
            className="w-full bg-[#1a1612]/90 backdrop-blur-sm text-[#f5ede0] hover:bg-[#d4a853] hover:text-[#1a1612] py-3 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors duration-200"
            data-testid={`wishlist-add-${product.id}`}
          >
            {added
              ? <><Check size={12} /> Added to Bag</>
              : <><ShoppingBag size={12} strokeWidth={1.5} /> Add to Bag</>
            }
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex justify-between items-start pr-1">
        <div className="min-w-0 pr-2">
          <h3 className="font-serif text-sm md:text-base text-foreground truncate">{product.name}</h3>
          <p className="text-muted-foreground text-[10px] mt-1 uppercase tracking-wider">{product.category}</p>
        </div>
        <span className="text-foreground font-medium text-sm flex-shrink-0">{inr(product.price)}</span>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center py-28 text-center"
      data-testid="wishlist-empty"
    >
      <div className="w-20 h-20 rounded-full bg-[#f5f3ef] flex items-center justify-center mb-8">
        <Heart size={28} strokeWidth={1} className="text-[#d4a853]" />
      </div>
      <h2 className="font-serif text-3xl mb-4">Nothing saved yet</h2>
      <p className="text-muted-foreground font-light text-sm max-w-xs leading-relaxed mb-10">
        Tap the heart icon on any piece you love — it will appear here for safekeeping.
      </p>
      <Link href="/shop">
        <button className="bg-[#1a1612] text-[#f5ede0] hover:bg-[#d4a853] hover:text-[#1a1612] transition-all duration-300 px-12 py-4 text-xs uppercase tracking-[0.2em]">
          Explore the Collection
        </button>
      </Link>
    </motion.div>
  );
}
