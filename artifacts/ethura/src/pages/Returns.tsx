import { motion } from "framer-motion";
import { Link } from "wouter";
import { Package, RefreshCw, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function Returns() {
  const get = useSiteContent();

  const steps = [
    { icon: "01", title: get("returns.step1_title"), desc: get("returns.step1_desc") },
    { icon: "02", title: get("returns.step2_title"), desc: get("returns.step2_desc") },
    { icon: "03", title: get("returns.step3_title"), desc: get("returns.step3_desc") },
    { icon: "04", title: get("returns.step4_title"), desc: get("returns.step4_desc") },
  ];

  const eligible = [
    get("returns.eligible1"),
    get("returns.eligible2"),
    get("returns.eligible3"),
    get("returns.eligible4"),
  ];

  const notEligible = [
    get("returns.not1"),
    get("returns.not2"),
    get("returns.not3"),
    get("returns.not4"),
    get("returns.not5"),
  ];

  const additional = [
    { title: get("returns.info1_title"), text: get("returns.info1_text") },
    { title: get("returns.info2_title"), text: get("returns.info2_text") },
    { title: get("returns.info3_title"), text: get("returns.info3_text") },
  ];

  return (
    <div className="bg-background min-h-screen text-foreground">
      <Navbar />

      <div className="pt-28 pb-16 text-center bg-muted/30 border-b border-border">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h1 className="text-4xl md:text-5xl font-serif mb-2">{get("returns.title")}</h1>
          <p className="text-muted-foreground font-light text-sm">{get("returns.subtitle")}</p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-6 py-3 text-sm text-primary">
            <Package size={16} strokeWidth={1.5} />
            <span className="font-medium">15-Day Return Window</span>
            <span className="text-primary/70">·</span>
            <RefreshCw size={16} strokeWidth={1.5} />
            <span className="font-medium">Easy Refund Process</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 border border-border bg-card"
              data-testid={`return-step-${i}`}
            >
              <div className="text-3xl font-serif text-primary/40 mb-4">{step.icon}</div>
              <h3 className="font-serif text-base mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-xs font-light leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-card border border-border p-8">
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <Check size={18} strokeWidth={1.5} className="text-primary" />
              Eligible for Return
            </h3>
            <ul className="space-y-3">
              {eligible.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-light" data-testid={`eligible-${i}`}>
                  <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-border p-8">
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <X size={18} strokeWidth={1.5} className="text-muted-foreground" />
              Not Eligible
            </h3>
            <ul className="space-y-3">
              {notEligible.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-light" data-testid={`not-eligible-${i}`}>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6 mb-16">
          <h2 className="font-serif text-2xl mb-6">Additional Information</h2>
          {additional.map((item, i) => (
            <div key={i} className="pb-6 border-b border-border last:border-0" data-testid={`return-info-${i}`}>
              <h3 className="font-serif text-lg mb-2">{item.title}</h3>
              <p className="text-muted-foreground font-light text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted/30 border border-border p-8 text-center">
          <h3 className="font-serif text-xl mb-3">{get("returns.help_title")}</h3>
          <p className="text-muted-foreground font-light text-sm mb-6">{get("returns.help_desc")}</p>
          <Link href="/contact">
            <button className="text-sm uppercase tracking-widest border border-foreground px-8 py-3 hover:bg-foreground hover:text-background transition-all duration-300" data-testid="returns-contact-btn">
              Contact Us
            </button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
