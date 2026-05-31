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

export const imageMap: Record<string, string> = {
  "pearl-earrings-1": pearlEarrings1,
  "crystal-heart-earring": crystalHeartEarring,
  "gold-bracelet": goldBracelet,
  "snake-ring": snakeRing,
  "layered-necklace": layeredNecklace,
  "pearl-pendant-necklace": pearlPendantNecklace,
  "pearl-beaded-necklace": pearlBeadedNecklace,
  "tiny-heart-necklace": tinyHeartNecklace,
  "teardrop-pendant": teardropPendant,
  "teardrop-studs": teardropStuds,
  "bow-charm-necklace": bowCharmNecklace,
  "crystal-butterfly": crystalButterfly,
  "pearl-drop-earrings": pearlDropEarrings,
};

export function resolveImage(imageKey?: string | null, imageUrl?: string | null): string {
  if (imageKey && imageMap[imageKey]) return imageMap[imageKey];
  if (imageUrl) return imageUrl;
  return "";
}
