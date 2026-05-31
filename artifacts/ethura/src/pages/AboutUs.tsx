import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteContent } from "@/hooks/useSiteContent";

import layeredNecklace from "@assets/1658729348133425152_1775578540034.jpg";
import pearlBeadedNecklace from "@assets/1718135768502898688_1775578540036.jpg";
import bowCharmNecklace from "@assets/1928289647822245888_1775578540040.jpg";

export default function AboutUs() {
  const get = useSiteContent();

  const values = [
    { title: get("about.value1_title"), desc: get("about.value1_desc") },
    { title: get("about.value2_title"), desc: get("about.value2_desc") },
    { title: get("about.value3_title"), desc: get("about.value3_desc") },
    { title: get("about.value4_title"), desc: get("about.value4_desc") },
  ];

  return (
    <div className="bg-background min-h-screen text-foreground">
      <Navbar />

      <div className="pt-28 pb-16 text-center bg-muted/30 border-b border-border">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="text-primary tracking-[0.2em] uppercase text-xs mb-3 block">{get("about.tagline")}</span>
          <h1 className="text-4xl md:text-6xl font-serif mb-4">{get("about.title")}</h1>
          <p className="text-muted-foreground font-light max-w-md mx-auto">{get("about.subtitle")}</p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="relative">
              <img src={layeredNecklace} alt="Layered necklace" className="w-full aspect-[4/5] object-cover" />
              <div className="absolute -bottom-6 -right-6 w-1/2 h-1/2 bg-muted -z-10" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h2 className="text-3xl md:text-4xl font-serif mb-6 leading-tight">
              {get("about.story_title").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="italic text-primary">{get("about.story_title").split(" ").slice(-1)[0]}</span>
            </h2>
            <p className="text-muted-foreground font-light leading-relaxed mb-6">{get("about.para1")}</p>
            <p className="text-muted-foreground font-light leading-relaxed mb-6">{get("about.para2")}</p>
            <p className="text-muted-foreground font-light leading-relaxed">{get("about.para3")}</p>
          </motion.div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">{get("about.values_title")}</h2>
          <p className="text-muted-foreground font-light">{get("about.values_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-32">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border p-8"
              data-testid={`value-${i}`}
            >
              <h3 className="font-serif text-xl mb-3">{v.title}</h3>
              <p className="text-muted-foreground font-light text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <img src={pearlBeadedNecklace} alt="Pearl necklace" className="w-full aspect-square object-cover" />
          <img src={bowCharmNecklace} alt="Bow necklace" className="w-full aspect-square object-cover" />
        </div>

        <div className="text-center py-16 bg-muted/30 border border-border">
          <h2 className="text-3xl font-serif mb-4">{get("about.cta_title")}</h2>
          <p className="text-muted-foreground font-light mb-8 max-w-sm mx-auto">{get("about.cta_desc")}</p>
          <Link href="/shop">
            <Button className="rounded-none bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-12 py-6 text-xs uppercase tracking-widest" data-testid="about-shop-btn">
              Shop Now
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
