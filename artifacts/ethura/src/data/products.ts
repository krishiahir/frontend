import pearlEarrings1 from "@assets/2039926189497389056_1775578540030.jpg";
import crystalHeartEarring from "@assets/2040050587508281344_1775578540031.jpg";
import goldBracelet from "@assets/2040088606135160832_1775578540032.jpg";
import snakeRing from "@assets/1570216754091790336_1775578540033.jpg";
import layeredNecklace from "@assets/1658729348133425152_1775578540034.jpg";
import pearlPendantNecklace from "@assets/1659002664194805760_1775578540035.jpg";
import pearlBeadedNecklace from "@assets/1718135768502898688_1775578540036.jpg";
import tinyHeartNecklace from "@assets/1820634780966981632_1775578540037.jpg";
import teardropPendant from "@assets/1829102189944115200_1775578540039.jpg";
import teardropStuds from "@assets/1829102247812927488_1775578540040.jpg";
import bowCharmNecklace from "@assets/1928289647822245888_1775578540040.jpg";
import crystalButterfly from "@assets/1991341727855808512_1775578540041.jpg";
import pearlDropEarrings from "@assets/2039912385875152896_1775578540042.jpg";

export type Category = "all" | "necklaces" | "earrings" | "rings" | "bracelets";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: Exclude<Category, "all">;
  description: string;
  badge?: string;
  stock?: number;
}

export const products: Product[] = [
  { id: 1,  name: "Layered Gold Chain",         price: 2999, image: layeredNecklace,      category: "necklaces",  description: "Delicate double-chain necklace with crystal teardrop accent. Hypoallergenic, 18k gold plated.", badge: "Bestseller", stock: 3 },
  { id: 2,  name: "Pearl & Heart Pendant",       price: 3299, image: pearlPendantNecklace, category: "necklaces",  description: "Korean-inspired layered pearl choker with opal heart pendant." },
  { id: 3,  name: "Pearl Beaded Heart",          price: 3599, image: pearlBeadedNecklace,  category: "necklaces",  description: "Classic pearl strand with gold beads and puffed gold heart pendant.", badge: "New" },
  { id: 4,  name: "Tiny Heart Necklace",         price: 2299, image: tinyHeartNecklace,    category: "necklaces",  description: "Minimalist dainty gold chain with tiny puffed heart. Effortlessly everyday." },
  { id: 5,  name: "Larmes Teardrop Pendant",     price: 2699, image: teardropPendant,      category: "necklaces",  description: "Smooth herringbone chain with sculptural gold teardrop pendant." },
  { id: 6,  name: "Bow Charm Necklace",          price: 2499, image: bowCharmNecklace,     category: "necklaces",  description: "Fine cable chain with a three-dimensional gold bow charm pendant.", badge: "New" },
  { id: 7,  name: "Papillon Crystal",            price: 3099, image: crystalButterfly,     category: "necklaces",  description: "Delicate chain with a shimmering crystal butterfly pendant." },
  { id: 8,  name: "Lumière Pearl Drop",          price: 2799, image: pearlEarrings1,       category: "earrings",   description: "Architectural gold U-bar stud with large lustrous pearl drop.", badge: "Bestseller", stock: 2 },
  { id: 9,  name: "Crystal Heart Earring",       price: 3399, image: crystalHeartEarring,  category: "earrings",   description: "Silver huggie hoop with sparkling crystal heart pendant. Catches the light beautifully." },
  { id: 10, name: "Gold Teardrop Studs",         price: 2399, image: teardropStuds,        category: "earrings",   description: "Smooth, sculptural 18k gold teardrop stud earrings. Bold and minimal." },
  { id: 11, name: "Pearl & Crystal Ball Drops",  price: 2999, image: pearlDropEarrings,    category: "earrings",   description: "Front-back earrings with pearl stud and pavé crystal ball drop." },
  { id: 12, name: "Serpentine Ring",             price: 1899, image: snakeRing,            category: "rings",      description: "Bold sculptural snake ring in 18k gold plated stainless steel. Adjustable fit.", badge: "Bestseller", stock: 4 },
  { id: 13, name: "Amour Chain Bracelet",        price: 2299, image: goldBracelet,         category: "bracelets",  description: "Chunky rolo chain bracelet with smooth gold heart charm. Timeless and bold." },
];

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
