import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Clock, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSiteContent } from "@/hooks/useSiteContent";
import { api } from "@/lib/api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const get = useSiteContent();

  const faqs = [
    { q: get("contact.faq1_q"), a: get("contact.faq1_a") },
    { q: get("contact.faq2_q"), a: get("contact.faq2_a") },
    { q: get("contact.faq3_q"), a: get("contact.faq3_a") },
    { q: get("contact.faq4_q"), a: get("contact.faq4_a") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.contact.submit(form);
      setSubmitted(true);
    } catch {
      setSubmitError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      <Navbar />

      <div className="pt-28 pb-16 text-center bg-muted/30 border-b border-border">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h1 className="text-4xl md:text-5xl font-serif mb-2">{get("contact.title")}</h1>
          <p className="text-muted-foreground font-light text-sm">{get("contact.subtitle")}</p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-24">
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="font-serif text-xl mb-6">Get in Touch</h2>
            </div>

            <div className="flex gap-4 items-start" data-testid="contact-email">
              <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0">
                <Mail size={16} strokeWidth={1.5} className="text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                <a href={`mailto:${get("contact.email")}`} className="text-sm hover:text-primary transition-colors">{get("contact.email")}</a>
              </div>
            </div>

            <div className="flex gap-4 items-start" data-testid="contact-hours">
              <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0">
                <Clock size={16} strokeWidth={1.5} className="text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Hours</p>
                <p className="text-sm">{get("contact.hours")}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start" data-testid="contact-response">
              <div className="w-10 h-10 border border-border flex items-center justify-center flex-shrink-0">
                <MessageCircle size={16} strokeWidth={1.5} className="text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Response Time</p>
                <p className="text-sm">{get("contact.response")}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full py-16 text-center"
                  data-testid="contact-success"
                >
                  <div className="w-16 h-16 border border-primary rounded-full flex items-center justify-center mb-6">
                    <Check size={24} strokeWidth={1.5} className="text-primary" />
                  </div>
                  <h3 className="font-serif text-2xl mb-3">Message Sent</h3>
                  <p className="text-muted-foreground font-light">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  data-testid="contact-form"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Name *</label>
                      <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-none border-border h-11" placeholder="Your name" data-testid="contact-name" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Email *</label>
                      <Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-none border-border h-11" placeholder="you@example.com" data-testid="contact-email-input" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Subject</label>
                    <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="rounded-none border-border h-11" placeholder="How can we help?" data-testid="contact-subject" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Message *</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      rows={6}
                      className="w-full rounded-none border border-border bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      placeholder="Tell us about your order, question, or feedback..."
                      data-testid="contact-message"
                    />
                  </div>
                  {submitError && (
                    <p className="text-sm text-red-500">{submitError}</p>
                  )}
                  <Button type="submit" disabled={submitting} className="rounded-none bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-12 py-6 text-xs uppercase tracking-widest" data-testid="contact-submit">
                    {submitting ? "Sending…" : "Send Message"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="border-t border-border pt-16">
          <h2 className="text-2xl font-serif mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border" data-testid={`faq-${i}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-muted/30 transition-colors text-sm font-medium"
                  data-testid={`faq-toggle-${i}`}
                >
                  {faq.q}
                  <span className="text-primary ml-4 flex-shrink-0">{openFaq === i ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-4 text-sm text-muted-foreground font-light leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
