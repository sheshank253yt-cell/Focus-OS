import { useState } from "react";
import { Pin, ExternalLink, Star, Plus, Search, Wand2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { AITool } from "@/lib/types";
import ToolModal from "@/components/ToolModal";

const CATEGORIES = [
  "All", "Writing & Content", "Image Generation", "Code Assistants",
  "Research & Search", "Audio & Video", "Productivity", "Data & Analytics", "Other",
];

type SortMode = "recent" | "visits" | "rating" | "alpha";

export default function Tools() {
  const { tools, setTools } = useApp();
  const [toolModal, setToolModal] = useState(false);
  const [editTool, setEditTool] = useState<AITool | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [freeOnly, setFreeOnly] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  function togglePin(id: string) {
    setTools(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
  }

  function visitTool(tool: AITool) {
    setTools(prev => prev.map(t => t.id === tool.id ? { ...t, visitCount: t.visitCount + 1 } : t));
    window.open(tool.url, "_blank", "noopener,noreferrer");
  }

  const filtered = tools
    .filter(t => {
      if (category !== "All" && t.category !== category) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (freeOnly && t.isPaid) return false;
      if (pinnedOnly && !t.isPinned) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "recent") return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      if (sort === "visits") return b.visitCount - a.visitCount;
      if (sort === "rating") return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">AI Tools Hub</h1>
        <button data-testid="btn-add-tool" onClick={() => { setEditTool(null); setToolModal(true); }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={14} /> Add Tool
        </button>
      </div>

      {/* Search + sort */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input data-testid="input-tool-search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground" />
        </div>
        <select data-testid="select-sort" value={sort} onChange={e => setSort(e.target.value as SortMode)}
          className="bg-muted text-sm rounded-lg px-3 py-2 border border-border outline-none focus:border-primary">
          <option value="recent">Recently Added</option>
          <option value="visits">Most Visited</option>
          <option value="rating">Top Rated</option>
          <option value="alpha">A → Z</option>
        </select>
        <button data-testid="btn-filter-free" onClick={() => setFreeOnly(p => !p)}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${freeOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
          Free only
        </button>
        <button data-testid="btn-filter-pinned" onClick={() => setPinnedOnly(p => !p)}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${pinnedOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
          Pinned
        </button>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c} data-testid={`cat-${c.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Tool grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg width="80" height="80" viewBox="0 0 80 80" className="mb-4 opacity-30">
            <circle cx="40" cy="40" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M28 40 Q40 25 52 40 Q40 55 28 40Z" fill="hsl(var(--primary))" opacity="0.5" />
            <circle cx="40" cy="40" r="6" fill="hsl(var(--primary))" />
          </svg>
          <p className="text-muted-foreground mb-3">No tools found. Try adjusting your filters.</p>
          <button onClick={() => { setCategory("All"); setSearch(""); setFreeOnly(false); setPinnedOnly(false); }}
            className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(tool => (
            <div key={tool.id} data-testid={`tool-card-${tool.id}`}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/40 transition-all duration-200 group">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={tool.favicon} alt="" className="w-8 h-8 rounded-lg flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%23334155' width='24' height='24' rx='6'/><text x='12' y='16' text-anchor='middle' font-size='12' fill='%2394a3b8'>?</text></svg>"; }} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{tool.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tool.category}</p>
                  </div>
                </div>
                <button data-testid={`btn-pin-${tool.id}`} onClick={() => togglePin(tool.id)}
                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${tool.isPinned ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}>
                  <Pin size={14} fill={tool.isPinned ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tool.isPaid ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}`}>
                  {tool.isPaid ? "Paid" : "Free"}
                </span>
                {tool.visitCount >= 5 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Used {tool.visitCount}×</span>
                )}
                {tool.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                ))}
              </div>

              {/* Stars */}
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={12} className={n <= tool.rating ? "fill-yellow-400 text-yellow-400" : "text-muted/30"} />
                ))}
              </div>

              {/* Notes */}
              {tool.notes && <p className="text-xs text-muted-foreground italic leading-relaxed">{tool.notes}</p>}

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <button data-testid={`btn-edit-tool-${tool.id}`} onClick={() => { setEditTool(tool); setToolModal(true); }}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  Edit
                </button>
                <button data-testid={`btn-visit-${tool.id}`} onClick={() => visitTool(tool)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                  Visit <ExternalLink size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tools.length === 0 && (
        <div className="text-center py-16">
          <Wand2 size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-display font-semibold mb-2">No tools yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start building your personal AI toolkit.</p>
          <button onClick={() => { setEditTool(null); setToolModal(true); }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Add your first tool
          </button>
        </div>
      )}

      <ToolModal open={toolModal} onClose={() => { setToolModal(false); setEditTool(null); }} initialTool={editTool} />
    </div>
  );
}
