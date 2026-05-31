import { Link, useLocation } from "wouter";
import { useApp } from "@/context/AppContext";
import { SITE_CONTENT_DEFAULTS } from "@/lib/siteContent";

export default function Footer() {
  const { siteContent } = useApp();
  const [, navigate] = useLocation();
  const g = (key: string) => siteContent[key] ?? SITE_CONTENT_DEFAULTS[key] ?? "";

  const tagline = g("footer.tagline");
  const quote = g("footer.quote");
  const quoteAttr = g("footer.quote_attribution");
  const instagramUrl = g("footer.instagram_url") || "https://instagram.com";
  const copyright = g("footer.copyright") || "Ethura";

  const boutiqueLinks: { label: string; href: string }[] = (() => {
    try {
      const raw = g("footer.boutique_links") || SITE_CONTENT_DEFAULTS["footer.boutique_links"];
      if (!raw) return [];
      return JSON.parse(raw);
    } catch { return []; }
  })();

  return (
    <footer className="bg-background pt-20 pb-10 border-t border-border px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-serif tracking-widest mb-4">ETHURA</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm font-light mb-6">
            {tagline}
          </p>
          <div className="border-l-2 border-[#d4a853] pl-4 max-w-xs">
            <p className="font-serif italic text-base text-foreground/70 leading-relaxed">
              "{quote}"
            </p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#d4a853] mt-3">— {quoteAttr}</p>
          </div>
        </div>

        <div>
          <h4 className="uppercase tracking-widest text-xs mb-6 font-medium">Boutique</h4>
          <ul className="space-y-3 text-muted-foreground text-sm font-light">
            {boutiqueLinks.map(link => (
              <li key={link.href + link.label}>
                <button
                  onClick={() => { navigate(link.href); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="hover:text-primary transition-colors text-left"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="uppercase tracking-widest text-xs mb-6 font-medium">Assistance</h4>
          <ul className="space-y-3 text-muted-foreground text-sm font-light">
            <li><Link href="/about" className="hover:text-primary transition-colors" data-testid="footer-link-about">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-primary transition-colors" data-testid="footer-link-contact">Contact Us</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors" data-testid="footer-link-terms">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border text-xs text-muted-foreground/60 uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} {copyright}. All rights reserved.</p>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors mt-4 md:mt-0 flex items-center gap-2"
          data-testid="footer-instagram"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
          </svg>
          Instagram
        </a>
      </div>
    </footer>
  );
}
