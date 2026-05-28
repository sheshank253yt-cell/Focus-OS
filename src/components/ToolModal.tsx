import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Star, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { AITool } from "@/lib/types";

interface ToolModalProps {
  open: boolean;
  onClose: () => void;
  initialTool?: AITool | null;
}

const CATEGORIES = [
  "Writing & Content", "Image Generation", "Code Assistants",
  "Research & Search", "Audio & Video", "Productivity",
  "Data & Analytics", "Other",
];

export default function ToolModal({ open, onClose, initialTool }: ToolModalProps) {
  const { tools, setTools } = useApp();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(3);
  const [isPaid, setIsPaid] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (initialTool) {
      setName(initialTool.name); setUrl(initialTool.url);
      setCategory(initialTool.category); setNotes(initialTool.notes);
      setRating(initialTool.rating); setIsPaid(initialTool.isPaid);
      setTags(initialTool.tags);
    } else {
      setName(""); setUrl(""); setCategory(CATEGORIES[0]); setNotes("");
      setRating(3); setIsPaid(false); setTags([]); setTagInput("");
    }
  }, [initialTool, open]);

  function getDomain(u: string) {
    try { return new URL(u.startsWith("http") ? u : `https://${u}`).hostname; } catch { return ""; }
  }
  function getFavicon(u: string) {
    const domain = getDomain(u);
    return domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : "";
  }

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags(prev => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  }

  function handleSave() {
    if (!name.trim()) return;
    const finalCategory = category === "Other" && customCategory.trim() ? customCategory.trim() : category;
    const favicon = getFavicon(url);
    const normalUrl = url.startsWith("http") ? url : `https://${url}`;
    if (initialTool) {
      setTools(prev => prev.map(t => t.id === initialTool.id ? { ...t, name, url: normalUrl, favicon, category: finalCategory, tags, notes, rating, isPaid } : t));
    } else {
      const newTool: AITool = {
        id: `tool-${Date.now()}`, name, url: normalUrl, favicon, category: finalCategory,
        tags, notes, rating, isPaid, isPinned: false, visitCount: 0,
        addedAt: new Date().toISOString(),
      };
      setTools(prev => [newTool, ...prev]);
    }
    onClose();
  }

  const favicon = getFavicon(url);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-card border-border" data-testid="modal-tool">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {favicon && <img src={favicon} alt="" className="w-5 h-5 rounded" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            {initialTool ? "Edit Tool" : "Add AI Tool"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Tool Name *</label>
            <input data-testid="input-tool-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ChatGPT"
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">URL</label>
            <input data-testid="input-tool-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Category</label>
            <select data-testid="select-tool-category" value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {category === "Other" && (
              <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Custom category name"
                className="mt-2 w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {t}<button onClick={() => setTags(p => p.filter(x => x !== t))}><X size={10} /></button>
                </span>
              ))}
            </div>
            <input data-testid="input-tool-tags" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              placeholder="Type and press Enter..."
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Personal Notes</label>
            <textarea data-testid="input-tool-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Why is this useful to you?"
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary resize-none" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Rating</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} data-testid={`btn-star-${n}`}
                    onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(n)}
                    className="transition-colors">
                    <Star size={18} className={n <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Pricing</label>
              <div className="flex gap-2">
                {[false, true].map(paid => (
                  <button key={String(paid)} onClick={() => setIsPaid(paid)}
                    data-testid={`btn-pricing-${paid ? "paid" : "free"}`}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${isPaid === paid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                    {paid ? "Paid" : "Free"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 gap-2">
          <button data-testid="btn-tool-cancel" onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 text-sm transition-colors">Cancel</button>
          <button data-testid="btn-tool-save" onClick={handleSave} disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {initialTool ? "Save Changes" : "Add Tool"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
