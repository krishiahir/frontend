import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Save, Check, AlertCircle, Upload, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { SITE_CONTENT_DEFAULTS } from "@/lib/siteContent";

type PageEditorProps = {
  initialContent: Record<string, string>;
  onContentSaved: (updates: Record<string, string>) => void;
};

type NavItem = {
  id: string;
  label: string;
  group?: string;
  icon?: string;
};

const NAV: NavItem[] = [
  { id: "header",     label: "Header & Nav",    group: "Site" },
  { id: "footer",     label: "Footer",          group: "Site" },
  { id: "features",   label: "Feature Flags",   group: "Site" },
  { id: "hero",       label: "Hero Section",    group: "Homepage" },
  { id: "promise",    label: "Our Promise",     group: "Homepage" },
  { id: "lookbook",   label: "Lookbook",        group: "Homepage" },
  { id: "vault",      label: "The Vault",       group: "Homepage" },
  { id: "collection", label: "Collection",      group: "Homepage" },
  { id: "about",      label: "About Us" },
  { id: "contact",    label: "Contact Us" },
  { id: "terms",      label: "Terms & Conditions" },
  { id: "popup",      label: "Discount Popup" },
  { id: "email",      label: "Email Templates", group: "Emails" },
];

// ─── Utility ───
function c(
  content: Record<string, string>,
  key: string
): string {
  return content[key] ?? SITE_CONTENT_DEFAULTS[key] ?? "";
}

function Field({
  label,
  id,
  value,
  onChange,
  textarea = false,
  rows = 3,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const cls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853] transition-colors";
  return (
    <div>
      <label htmlFor={id} className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium block mb-1.5">
        {label}
      </label>
      {textarea ? (
        <textarea id={id} rows={rows} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={cls + " resize-y"} />
      ) : (
        <input id={id} type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
      <div className="h-px w-5 bg-[#d4a853]" />
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#d4a853] font-semibold">{children}</h3>
    </div>
  );
}

type LinkEntry = { label: string; href: string; enabled?: boolean };

function LinkListManager({
  value,
  onChange,
  withToggle = false,
  addLabel = "Add Link",
}: {
  value: string;
  onChange: (v: string) => void;
  withToggle?: boolean;
  addLabel?: string;
}) {
  const links: LinkEntry[] = (() => {
    try { return JSON.parse(value || "[]"); } catch { return []; }
  })();

  const save = (updated: LinkEntry[]) => onChange(JSON.stringify(updated));

  const update = (i: number, field: keyof LinkEntry, val: string | boolean) => {
    const next = links.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
    save(next);
  };

  const remove = (i: number) => save(links.filter((_, idx) => idx !== i));

  const add = () => save([...links, { label: "", href: "", enabled: true }]);

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...links];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    save(next);
  };

  const moveDown = (i: number) => {
    if (i === links.length - 1) return;
    const next = [...links];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    save(next);
  };

  const inputCls = "border border-border rounded-md px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#d4a853]/40 focus:border-[#d4a853] transition-colors";

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2.5 shadow-sm">
          <div className="flex flex-col gap-0.5">
            <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">▲</button>
            <button type="button" onClick={() => moveDown(i)} disabled={i === links.length - 1}
              className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">▼</button>
          </div>
          <input
            type="text" value={link.label} onChange={e => update(i, "label", e.target.value)}
            placeholder="Label (e.g. Shop)" className={inputCls + " flex-1"} />
          <input
            type="text" value={link.href} onChange={e => update(i, "href", e.target.value)}
            placeholder="URL (e.g. /shop)" className={inputCls + " flex-1"} />
          {withToggle && (
            <button
              type="button"
              onClick={() => update(i, "enabled", link.enabled === false ? true : false)}
              className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase flex-shrink-0 transition-colors ${link.enabled !== false ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}
            >
              {link.enabled !== false ? "On" : "Off"}
            </button>
          )}
          <button type="button" onClick={() => remove(i)}
            className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg px-4 py-2.5 w-full justify-center transition-colors hover:border-[#d4a853] hover:text-[#d4a853]"
      >
        <Plus size={13} /> {addLabel}
      </button>
    </div>
  );
}

export default function PageEditor({ initialContent, onContentSaved }: PageEditorProps) {
  const [selected, setSelected] = useState("hero");
  const [content, setContent] = useState<Record<string, string>>(() => ({ ...initialContent }));
  const [saving, setSaving] = useState(false);
  const [savedPage, setSavedPage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const set = useCallback((key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  }, []);

  const get = useCallback((key: string) => c(content, key), [content]);

  function keysForPage(page: string): string[] {
    return Object.keys(SITE_CONTENT_DEFAULTS).filter(k => k.startsWith(page + "."));
  }

  async function save() {
    setSaving(true); setError("");
    const keys = keysForPage(selected);
    const updates: Record<string, string> = {};
    for (const k of keys) updates[k] = content[k] ?? SITE_CONTENT_DEFAULTS[k] ?? "";
    try {
      await api.siteContent.save(updates);
      onContentSaved(updates);
      setSavedPage(selected);
      setTimeout(() => setSavedPage(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File, targetKey: string) {
    setUploading(true);
    try {
      const canvas = document.createElement("canvas");
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = URL.createObjectURL(file);
      });
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.82).split(",")[1];

      const res = await fetch(`${import.meta.env.BASE_URL}api/products/upload-image`.replace(/\/+api/, "/api"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("ethura_token") || ""}`,
        },
        body: JSON.stringify({ imageData: base64, mimeType: "image/jpeg" }),
      });
      const data = await res.json();
      if (data.url) set(targetKey, data.url);
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, "hero.image_url");
  }

  async function handlePopupImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file, "popup.image_url");
    const input = e.target;
    input.value = "";
  }

  // ─── Grouped nav ───
  const groups = Array.from(new Set(NAV.map(n => n.group || n.label)));
  const popupEnabled = get("popup.enabled") === "true";

  return (
    <div className="flex gap-0 h-full min-h-[600px] rounded-xl border border-border overflow-hidden bg-[#faf8f5]">

      {/* ─── Left nav ─── */}
      <div className="w-52 flex-shrink-0 bg-[#1a1612] flex flex-col">
        <div className="px-4 pt-5 pb-3 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#d4a853] font-semibold">Edit Pages</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {(["Site", "Homepage", "Emails"] as const).map(group => (
            <div key={group}>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-semibold mb-1">{group}</p>
              </div>
              {NAV.filter(n => n.group === group).map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSelected(item.id); setError(""); }}
                  className={`w-full text-left px-4 py-2 text-xs transition-all flex items-center justify-between group ${
                    selected === item.id
                      ? "bg-[#d4a853]/20 text-[#d4a853]"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  {item.label}
                  {selected === item.id && <ChevronRight size={12} />}
                </button>
              ))}
            </div>
          ))}
          {/* Other pages (no group) */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-semibold mb-1">Pages</p>
          </div>
          {NAV.filter(n => !n.group).map(item => (
            <button
              key={item.id}
              onClick={() => { setSelected(item.id); setError(""); }}
              className={`w-full text-left px-4 py-2 text-xs transition-all flex items-center justify-between group ${
                selected === item.id
                  ? "bg-[#d4a853]/20 text-[#d4a853]"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {item.label}
              {selected === item.id && <ChevronRight size={12} />}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── Right editor panel ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {NAV.find(n => n.id === selected)?.label}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Changes appear live on the store after saving
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {savedPage === selected && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                  <Check size={14} /> Saved!
                </motion.div>
              )}
            </AnimatePresence>
            {error && (
              <span className="flex items-center gap-1.5 text-red-500 text-xs">
                <AlertCircle size={13} /> {error}
              </span>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1a1612] text-white text-xs uppercase tracking-widest px-4 py-2.5 rounded-lg hover:bg-[#d4a853] hover:text-[#1a1612] transition-all disabled:opacity-60"
            >
              {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* ─── HEADER / NAV ─── */}
              {selected === "header" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Brand & Navigation</SectionHeading>
                  <Field label="Brand / Store Name" id="header.brand_name" value={get("header.brand_name")} onChange={v => set("header.brand_name", v)} placeholder="ETHURA" />

                  <SectionHeading>Navigation Menu Links</SectionHeading>
                  <p className="text-[11px] text-muted-foreground -mt-3 mb-2">Add, remove, reorder, or hide links in your site header. The "Home" link always appears on non-home pages automatically. "Reels" is controlled by the Feature Flags toggle.</p>
                  <LinkListManager
                    value={get("header.nav_links")}
                    onChange={v => set("header.nav_links", v)}
                    withToggle={true}
                    addLabel="Add Nav Link"
                  />

                  <SectionHeading>Announcement Bar</SectionHeading>
                  <div className="flex items-center justify-between bg-white border border-border rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Show Announcement Bar</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Display a slim banner at the top of every page</p>
                    </div>
                    <button
                      onClick={() => set("header.announcement_enabled", get("header.announcement_enabled") === "true" ? "false" : "true")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${get("header.announcement_enabled") === "true" ? "bg-[#d4a853]" : "bg-muted/40 border border-border"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${get("header.announcement_enabled") === "true" ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <Field label="Announcement Message" id="header.announcement" value={get("header.announcement")} onChange={v => set("header.announcement", v)} placeholder="Free shipping on orders above ₹2000" />
                  {get("header.announcement_enabled") === "true" && get("header.announcement") && (
                    <div className="bg-[#1a1612] text-white text-xs text-center py-2 px-4 rounded-lg">
                      Preview: {get("header.announcement")}
                    </div>
                  )}
                </div>
              )}

              {/* ─── FOOTER ─── */}
              {selected === "footer" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Brand Section</SectionHeading>
                  <Field label="Tagline / Description" id="footer.tagline" value={get("footer.tagline")} onChange={v => set("footer.tagline", v)} textarea rows={2} placeholder="Elegance that endures…" />

                  <SectionHeading>Quote Block</SectionHeading>
                  <Field label="Quote Text" id="footer.quote" value={get("footer.quote")} onChange={v => set("footer.quote", v)} textarea rows={2} placeholder="Wear it to sleep. Wear it to the gym…" />
                  <Field label="Quote Attribution" id="footer.quote_attribution" value={get("footer.quote_attribution")} onChange={v => set("footer.quote_attribution", v)} placeholder="The Ethura Promise" />

                  <SectionHeading>Boutique Links</SectionHeading>
                  <p className="text-[11px] text-muted-foreground -mt-3 mb-2">These are the "Boutique" column links in the footer. Link to any page or shop category. Use /shop?category=necklaces to filter to a specific category.</p>
                  <LinkListManager
                    value={get("footer.boutique_links")}
                    onChange={v => set("footer.boutique_links", v)}
                    addLabel="Add Boutique Link"
                  />

                  <SectionHeading>Links & Legal</SectionHeading>
                  <Field label="Instagram Profile URL" id="footer.instagram_url" value={get("footer.instagram_url")} onChange={v => set("footer.instagram_url", v)} placeholder="https://instagram.com/ethura.jewelry" />
                  <Field label="Copyright Name" id="footer.copyright" value={get("footer.copyright")} onChange={v => set("footer.copyright", v)} placeholder="Ethura" />
                  <p className="text-[11px] text-muted-foreground">Copyright year is set automatically to the current year.</p>
                </div>
              )}

              {/* ─── FEATURE FLAGS ─── */}
              {selected === "features" && (
                <div className="space-y-5 max-w-2xl">
                  <SectionHeading>Feature Flags</SectionHeading>
                  <p className="text-xs text-muted-foreground -mt-3">Toggle entire sections of your store on or off instantly. Changes appear live after saving.</p>

                  {([
                    {
                      key: "features.reels_enabled",
                      label: "Reels / Social Page",
                      desc: "Shows the 'Reels' link in the navbar and the /social page with video content",
                    },
                    {
                      key: "features.reviews_enabled",
                      label: "Customer Reviews",
                      desc: "Shows the reviews section on product pages. When off, the section is hidden completely",
                    },
                  ]).map(f => {
                    const enabled = get(f.key) !== "false";
                    return (
                      <div key={f.key} className="flex items-center justify-between bg-white border border-border rounded-lg px-4 py-4 shadow-sm">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-semibold text-foreground">{f.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${enabled ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}>
                            {enabled ? "Active" : "Off"}
                          </span>
                          <button
                            onClick={() => set(f.key, enabled ? "false" : "true")}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${enabled ? "bg-[#d4a853]" : "bg-muted/40 border border-border"}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
                    <span className="mt-0.5">⚠</span>
                    <p>Remember to click <strong>Save Changes</strong> at the top after toggling features. Changes only apply after saving.</p>
                  </div>
                </div>
              )}

              {/* ─── HERO ─── */}
              {selected === "hero" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Hero Section</SectionHeading>

                  {/* Image upload */}
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2">Background Image</p>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-20 rounded-lg border border-border overflow-hidden bg-muted/20 flex-shrink-0">
                        {get("hero.image_url") ? (
                          <img src={get("hero.image_url")} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={20} className="text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input type="file" ref={uploadRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        <button
                          onClick={() => uploadRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 border border-border text-xs px-3 py-2 rounded-lg hover:border-[#d4a853] hover:text-[#d4a853] transition-colors disabled:opacity-60"
                        >
                          <Upload size={13} />
                          {uploading ? "Uploading…" : "Upload Image"}
                        </button>
                        <p className="text-[10px] text-muted-foreground">JPG, PNG up to 5MB. Displays full-width behind hero text.</p>
                        {get("hero.image_url") && (
                          <button onClick={() => set("hero.image_url", "")} className="text-[10px] text-red-400 hover:text-red-600">
                            Remove (use default)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Field label="Badge Text" id="hero.badge" value={get("hero.badge")} onChange={v => set("hero.badge", v)} placeholder="Timeless Elegance" />
                  <Field label="Title Line 1" id="hero.title1" value={get("hero.title1")} onChange={v => set("hero.title1", v)} placeholder="Radiance That" />
                  <Field label="Title Line 2 (italic highlight)" id="hero.title2" value={get("hero.title2")} onChange={v => set("hero.title2", v)} placeholder="Endures" />
                  <Field label="Description" id="hero.description" value={get("hero.description")} onChange={v => set("hero.description", v)} textarea rows={2} />
                  <Field label="Primary Button Text" id="hero.cta_primary" value={get("hero.cta_primary")} onChange={v => set("hero.cta_primary", v)} placeholder="Discover the Collection" />
                  <Field label="Secondary Link Text" id="hero.cta_secondary" value={get("hero.cta_secondary")} onChange={v => set("hero.cta_secondary", v)} placeholder="Our Story" />
                </div>
              )}

              {/* ─── PROMISE ─── */}
              {selected === "promise" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Our Promise Section</SectionHeading>
                  <Field label="Section Label" id="promise.label" value={get("promise.label")} onChange={v => set("promise.label", v)} placeholder="Our Promise" />
                  <Field label="Section Title" id="promise.title" value={get("promise.title")} onChange={v => set("promise.title", v)} placeholder="The anti-tarnish promise." />
                  <Field label="Paragraph 1" id="promise.para1" value={get("promise.para1")} onChange={v => set("promise.para1", v)} textarea rows={3} />
                  <Field label="Paragraph 2" id="promise.para2" value={get("promise.para2")} onChange={v => set("promise.para2", v)} textarea rows={2} />
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {([1, 2, 3] as const).map(i => (
                      <div key={i} className="space-y-2 bg-white border border-border rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Stat {i}</p>
                        <Field label="Number/Symbol" id={`promise.stat${i}_num`} value={get(`promise.stat${i}_num`)} onChange={v => set(`promise.stat${i}_num`, v)} />
                        <Field label="Label" id={`promise.stat${i}_label`} value={get(`promise.stat${i}_label`)} onChange={v => set(`promise.stat${i}_label`, v)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── LOOKBOOK ─── */}
              {selected === "lookbook" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Lookbook Section</SectionHeading>
                  <Field label="Section Label" id="lookbook.label" value={get("lookbook.label")} onChange={v => set("lookbook.label", v)} placeholder="The Lookbook" />
                  <Field label="Section Title" id="lookbook.title" value={get("lookbook.title")} onChange={v => set("lookbook.title", v)} placeholder="Worn & Loved" />
                  {[1, 2, 3, 4].map(i => (
                    <Field key={i} label={`Quote ${i}`} id={`lookbook.quote${i}`} value={get(`lookbook.quote${i}`)} onChange={v => set(`lookbook.quote${i}`, v)} textarea rows={2} />
                  ))}
                </div>
              )}

              {/* ─── VAULT ─── */}
              {selected === "vault" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>The Vault Section</SectionHeading>
                  <Field label="Section Label" id="vault.label" value={get("vault.label")} onChange={v => set("vault.label", v)} placeholder="Limited Release" />
                  <Field label="Title" id="vault.title" value={get("vault.title")} onChange={v => set("vault.title", v)} placeholder="The Vault is Open." />
                  <Field label="Description" id="vault.description" value={get("vault.description")} onChange={v => set("vault.description", v)} textarea rows={3} />
                  <Field label="Button Text" id="vault.cta" value={get("vault.cta")} onChange={v => set("vault.cta", v)} placeholder="Enter the Vault" />
                </div>
              )}

              {/* ─── COLLECTION ─── */}
              {selected === "collection" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Collection Section</SectionHeading>
                  <Field label="Section Label" id="collection.label" value={get("collection.label")} onChange={v => set("collection.label", v)} placeholder="Curated" />
                  <Field label="Section Title" id="collection.title" value={get("collection.title")} onChange={v => set("collection.title", v)} placeholder="The Ethura Edit" />
                </div>
              )}

              {/* ─── ABOUT US ─── */}
              {selected === "about" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Hero</SectionHeading>
                  <Field label="Page Tagline" id="about.tagline" value={get("about.tagline")} onChange={v => set("about.tagline", v)} />
                  <Field label="Page Title" id="about.title" value={get("about.title")} onChange={v => set("about.title", v)} />
                  <Field label="Page Subtitle" id="about.subtitle" value={get("about.subtitle")} onChange={v => set("about.subtitle", v)} textarea rows={2} />

                  <SectionHeading>Story</SectionHeading>
                  <Field label="Story Section Title" id="about.story_title" value={get("about.story_title")} onChange={v => set("about.story_title", v)} />
                  <Field label="Paragraph 1" id="about.para1" value={get("about.para1")} onChange={v => set("about.para1", v)} textarea rows={3} />
                  <Field label="Paragraph 2" id="about.para2" value={get("about.para2")} onChange={v => set("about.para2", v)} textarea rows={3} />
                  <Field label="Paragraph 3" id="about.para3" value={get("about.para3")} onChange={v => set("about.para3", v)} textarea rows={3} />

                  <SectionHeading>Our Values</SectionHeading>
                  <Field label="Values Section Title" id="about.values_title" value={get("about.values_title")} onChange={v => set("about.values_title", v)} />
                  <Field label="Values Section Subtitle" id="about.values_subtitle" value={get("about.values_subtitle")} onChange={v => set("about.values_subtitle", v)} textarea rows={2} />
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white border border-border rounded-lg p-4 space-y-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Value {i}</p>
                      <Field label="Title" id={`about.value${i}_title`} value={get(`about.value${i}_title`)} onChange={v => set(`about.value${i}_title`, v)} />
                      <Field label="Description" id={`about.value${i}_desc`} value={get(`about.value${i}_desc`)} onChange={v => set(`about.value${i}_desc`, v)} textarea rows={2} />
                    </div>
                  ))}

                  <SectionHeading>Bottom CTA</SectionHeading>
                  <Field label="CTA Title" id="about.cta_title" value={get("about.cta_title")} onChange={v => set("about.cta_title", v)} />
                  <Field label="CTA Description" id="about.cta_desc" value={get("about.cta_desc")} onChange={v => set("about.cta_desc", v)} textarea rows={2} />
                </div>
              )}

              {/* ─── CONTACT ─── */}
              {selected === "contact" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Page Header</SectionHeading>
                  <Field label="Page Title" id="contact.title" value={get("contact.title")} onChange={v => set("contact.title", v)} />
                  <Field label="Page Subtitle" id="contact.subtitle" value={get("contact.subtitle")} onChange={v => set("contact.subtitle", v)} textarea rows={2} />

                  <SectionHeading>Contact Details</SectionHeading>
                  <Field label="Email Address" id="contact.email" value={get("contact.email")} onChange={v => set("contact.email", v)} placeholder="hello@ethura.com" />
                  <Field label="Business Hours" id="contact.hours" value={get("contact.hours")} onChange={v => set("contact.hours", v)} placeholder="Mon – Sat, 10am – 6pm IST" />
                  <Field label="Response Time" id="contact.response" value={get("contact.response")} onChange={v => set("contact.response", v)} placeholder="Within 24 hours" />

                  <SectionHeading>FAQs</SectionHeading>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white border border-border rounded-lg p-4 space-y-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">FAQ {i}</p>
                      <Field label="Question" id={`contact.faq${i}_q`} value={get(`contact.faq${i}_q`)} onChange={v => set(`contact.faq${i}_q`, v)} />
                      <Field label="Answer" id={`contact.faq${i}_a`} value={get(`contact.faq${i}_a`)} onChange={v => set(`contact.faq${i}_a`, v)} textarea rows={2} />
                    </div>
                  ))}
                </div>
              )}

              {/* ─── TERMS ─── */}
              {selected === "terms" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Page Header</SectionHeading>
                  <Field label="Page Title" id="terms.title" value={get("terms.title")} onChange={v => set("terms.title", v)} />
                  <Field label="Last Updated" id="terms.updated" value={get("terms.updated")} onChange={v => set("terms.updated", v)} />
                  <Field label="Intro Paragraph" id="terms.intro" value={get("terms.intro")} onChange={v => set("terms.intro", v)} textarea rows={3} />

                  <SectionHeading>Sections</SectionHeading>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(i => (
                    <div key={i} className="bg-white border border-border rounded-lg p-4 space-y-3">
                      <Field label={`Section ${i} Title`} id={`terms.s${i}_title`} value={get(`terms.s${i}_title`)} onChange={v => set(`terms.s${i}_title`, v)} />
                      <Field label="Content" id={`terms.s${i}_content`} value={get(`terms.s${i}_content`)} onChange={v => set(`terms.s${i}_content`, v)} textarea rows={3} />
                    </div>
                  ))}
                </div>
              )}

              {/* ─── RETURNS ─── */}
              {selected === "returns" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Page Header</SectionHeading>
                  <Field label="Page Title" id="returns.title" value={get("returns.title")} onChange={v => set("returns.title", v)} />
                  <Field label="Page Subtitle" id="returns.subtitle" value={get("returns.subtitle")} onChange={v => set("returns.subtitle", v)} />

                  <SectionHeading>Return Steps</SectionHeading>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white border border-border rounded-lg p-4 space-y-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Step {i}</p>
                      <Field label="Title" id={`returns.step${i}_title`} value={get(`returns.step${i}_title`)} onChange={v => set(`returns.step${i}_title`, v)} />
                      <Field label="Description" id={`returns.step${i}_desc`} value={get(`returns.step${i}_desc`)} onChange={v => set(`returns.step${i}_desc`, v)} textarea rows={2} />
                    </div>
                  ))}

                  <SectionHeading>Eligible for Return</SectionHeading>
                  {[1, 2, 3, 4].map(i => (
                    <Field key={i} label={`Item ${i}`} id={`returns.eligible${i}`} value={get(`returns.eligible${i}`)} onChange={v => set(`returns.eligible${i}`, v)} />
                  ))}

                  <SectionHeading>Not Eligible</SectionHeading>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Field key={i} label={`Item ${i}`} id={`returns.not${i}`} value={get(`returns.not${i}`)} onChange={v => set(`returns.not${i}`, v)} />
                  ))}

                  <SectionHeading>Additional Information</SectionHeading>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-border rounded-lg p-4 space-y-3">
                      <Field label="Title" id={`returns.info${i}_title`} value={get(`returns.info${i}_title`)} onChange={v => set(`returns.info${i}_title`, v)} />
                      <Field label="Text" id={`returns.info${i}_text`} value={get(`returns.info${i}_text`)} onChange={v => set(`returns.info${i}_text`, v)} textarea rows={2} />
                    </div>
                  ))}

                  <SectionHeading>Help Banner</SectionHeading>
                  <Field label="Title" id="returns.help_title" value={get("returns.help_title")} onChange={v => set("returns.help_title", v)} />
                  <Field label="Description" id="returns.help_desc" value={get("returns.help_desc")} onChange={v => set("returns.help_desc", v)} textarea rows={2} />
                </div>
              )}

              {/* ─── POPUP ─── */}
              {selected === "popup" && (
                <div className="space-y-6 max-w-2xl">
                  <SectionHeading>Discount Popup Settings</SectionHeading>

                  {/* Enable/Disable toggle */}
                  <div className="flex items-center justify-between bg-white border border-border rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Show Popup to Visitors</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Enable or disable the discount popup for all visitors</p>
                    </div>
                    <button
                      onClick={() => set("popup.enabled", popupEnabled ? "false" : "true")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${popupEnabled ? "bg-[#d4a853]" : "bg-muted/40 border border-border"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${popupEnabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  {/* Timing controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-border rounded-lg px-4 py-3">
                      <p className="text-[11px] font-medium text-foreground mb-1">First Appearance</p>
                      <p className="text-[10px] text-muted-foreground mb-2">Show popup after visitor has been on the site for:</p>
                      <select
                        value={get("popup.delay_minutes") || "5"}
                        onChange={e => set("popup.delay_minutes", e.target.value)}
                        className="w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-[#faf8f5] focus:outline-none focus:border-[#d4a853]"
                      >
                        {[1,2,3,5,10,15,20,30].map(m => (
                          <option key={m} value={String(m)}>{m} minute{m !== 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white border border-border rounded-lg px-4 py-3">
                      <p className="text-[11px] font-medium text-foreground mb-1">Repeat Every</p>
                      <p className="text-[10px] text-muted-foreground mb-2">Show popup again after visitor dismisses it:</p>
                      <select
                        value={get("popup.interval_minutes") || "10"}
                        onChange={e => set("popup.interval_minutes", e.target.value)}
                        className="w-full text-sm border border-border rounded-lg px-2 py-1.5 bg-[#faf8f5] focus:outline-none focus:border-[#d4a853]"
                      >
                        {[1,2,3,5,10,15,20,30,60].map(m => (
                          <option key={m} value={String(m)}>{m === 60 ? "1 hour" : `${m} minute${m !== 1 ? "s" : ""}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {popupEnabled && (
                    <div className="bg-green-50 border border-green-200 px-4 py-2.5 rounded-lg text-xs text-green-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      Popup is LIVE — appears after {get("popup.delay_minutes") || "5"} min, repeats every {get("popup.interval_minutes") || "10"} min
                    </div>
                  )}

                  {/* Image upload */}
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2">Popup Image</p>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-20 rounded-lg border border-border overflow-hidden bg-muted/20 flex-shrink-0">
                        {get("popup.image_url") ? (
                          <img src={get("popup.image_url")} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={20} className="text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input type="file" id="popup-img-upload" onChange={handlePopupImageUpload} accept="image/*" className="hidden" />
                        <button
                          onClick={() => document.getElementById("popup-img-upload")?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 border border-border text-xs px-3 py-2 rounded-lg hover:border-[#d4a853] hover:text-[#d4a853] transition-colors disabled:opacity-60"
                        >
                          <Upload size={13} />
                          {uploading ? "Uploading…" : "Upload Image"}
                        </button>
                        {get("popup.image_url") && (
                          <button onClick={() => set("popup.image_url", "")} className="text-[10px] text-red-400 hover:text-red-600 block">
                            Remove image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Field label="Badge Text" id="popup.badge" value={get("popup.badge")} onChange={v => set("popup.badge", v)} placeholder="Limited Time Offer" />
                  <Field label="Discount Text (large display)" id="popup.discount_text" value={get("popup.discount_text")} onChange={v => set("popup.discount_text", v)} placeholder="20% OFF" />
                  <Field label="Quote / Message" id="popup.quote" value={get("popup.quote")} onChange={v => set("popup.quote", v)} textarea rows={2} placeholder="An unmissable offer for you..." />
                  <Field label="Button Text" id="popup.cta" value={get("popup.cta")} onChange={v => set("popup.cta", v)} placeholder="Shop the Offer" />
                  <Field label="Button Link" id="popup.cta_link" value={get("popup.cta_link")} onChange={v => set("popup.cta_link", v)} placeholder="/shop" />
                </div>
              )}

              {/* ─── EMAIL TEMPLATES ─── */}
              {selected === "email" && (
                <div className="space-y-8 max-w-2xl">

                  {/* Brand / Footer */}
                  <div className="space-y-5">
                    <SectionHeading>Brand & Footer</SectionHeading>
                    <div className="bg-[#1a1612]/5 border border-[#d4a853]/20 rounded-lg px-4 py-3 mb-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        These appear in the <strong>header and footer</strong> of every email you send.
                      </p>
                    </div>
                    <Field label="Header Tagline (below ETHURA logo)" id="email.brand_tagline" value={get("email.brand_tagline")} onChange={v => set("email.brand_tagline", v)} placeholder="18k Gold Plated · Anti-Tarnish · Hypoallergenic" />
                    <Field label="Footer Tagline" id="email.footer_tagline" value={get("email.footer_tagline")} onChange={v => set("email.footer_tagline", v)} placeholder="18k Gold Plated Jewelry · Crafted with Love" />
                    <Field label="Contact Button Label" id="email.contact_cta_label" value={get("email.contact_cta_label")} onChange={v => set("email.contact_cta_label", v)} placeholder="Contact Us" />
                  </div>

                  {/* Order Confirmation */}
                  <div className="space-y-5">
                    <SectionHeading>Order Confirmation Email</SectionHeading>
                    <div className="bg-[#1a1612]/5 border border-[#d4a853]/20 rounded-lg px-4 py-3 mb-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Sent automatically when a customer places an order. Use <code className="bg-black/5 px-1 rounded text-[10px]">&#123;orderId&#125;</code> in the subject to insert the order number.
                      </p>
                    </div>
                    <Field label="Subject Line" id="email.order_subject" value={get("email.order_subject")} onChange={v => set("email.order_subject", v)} placeholder="Your Ethura Order is Confirmed — {orderId}" />
                    <Field label="Greeting / Thank-You Message" id="email.order_greeting" value={get("email.order_greeting")} onChange={v => set("email.order_greeting", v)} textarea rows={3} placeholder="Thank you for choosing Ethura Jewelry! Your order has been successfully placed..." />
                    <Field label="Body / Invoice Note" id="email.order_body" value={get("email.order_body")} onChange={v => set("email.order_body", v)} textarea rows={3} placeholder="Your invoice is attached as a PDF — please keep it for your records." />
                    <Field label="Cancellation Policy Text" id="email.cancellation_policy" value={get("email.cancellation_policy")} onChange={v => set("email.cancellation_policy", v)} textarea rows={4} placeholder="You may cancel your order within 24 hours..." />
                  </div>

                  {/* Cancellation */}
                  <div className="space-y-5">
                    <SectionHeading>Order Cancellation Email</SectionHeading>
                    <div className="bg-[#1a1612]/5 border border-[#d4a853]/20 rounded-lg px-4 py-3 mb-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Sent when a customer cancels their order. Use <code className="bg-black/5 px-1 rounded text-[10px]">&#123;orderId&#125;</code> in the subject.
                      </p>
                    </div>
                    <Field label="Subject Line" id="email.cancel_subject" value={get("email.cancel_subject")} onChange={v => set("email.cancel_subject", v)} placeholder="Order Cancellation Confirmed — {orderId} | Ethura Jewelry" />
                    <Field label="Body Message" id="email.cancel_greeting" value={get("email.cancel_greeting")} onChange={v => set("email.cancel_greeting", v)} textarea rows={3} placeholder="Your order has been successfully cancelled as per your request..." />
                    <Field label="Refund Note" id="email.cancel_refund_note" value={get("email.cancel_refund_note")} onChange={v => set("email.cancel_refund_note", v)} textarea rows={2} placeholder="Your refund will be processed within 5–7 business days..." />
                  </div>

                  {/* Live preview notice */}
                  <div className="bg-[#faf8f5] border border-border rounded-lg px-5 py-4 flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-[#d4a853] mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-foreground mb-1">Format is preserved automatically</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">The Ethura gold-and-dark email layout, logo, order table, and PDF invoice are always included. Only the text content you edit above changes.</p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
