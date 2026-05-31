import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function Terms() {
  const get = useSiteContent();

  const sections = Array.from({ length: 10 }, (_, i) => ({
    title: get(`terms.s${i + 1}_title`),
    content: get(`terms.s${i + 1}_content`),
  }));

  return (
    <div className="bg-background min-h-screen text-foreground">
      <Navbar />

      <div className="pt-28 pb-16 text-center bg-muted/30 border-b border-border">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h1 className="text-4xl md:text-5xl font-serif mb-2">{get("terms.title")}</h1>
          <p className="text-muted-foreground font-light text-sm">{get("terms.updated")}</p>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-muted-foreground font-light leading-relaxed mb-12 text-sm">
          {get("terms.intro")}
        </p>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              data-testid={`terms-section-${i}`}
            >
              <h2 className="font-serif text-lg mb-3">{section.title}</h2>
              <p className="text-muted-foreground font-light text-sm leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border text-center text-xs text-muted-foreground/60 uppercase tracking-widest">
          <p>Questions? <a href={`mailto:${get("contact.email")}`} className="hover:text-primary transition-colors">{get("contact.email")}</a></p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
