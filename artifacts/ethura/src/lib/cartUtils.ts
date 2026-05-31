import type { ApiProduct } from "@/lib/api";
import { resolveImage } from "@/data/imageMap";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  badge?: string;
  stock?: number;
  imageKey?: string;
  imageUrl?: string;
  quantity: number;
  isGift?: boolean;
  giftMessage?: string;
}

export function apiProductToCart(p: ApiProduct): Omit<CartItem, "quantity"> {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: resolveImage(p.imageKey, p.imageUrl),
    category: p.category,
    description: p.description,
    badge: p.badge || undefined,
    stock: p.stock ?? undefined,
    imageKey: p.imageKey || undefined,
    imageUrl: p.imageUrl || undefined,
  };
}
