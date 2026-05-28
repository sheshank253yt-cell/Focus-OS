import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, CalendarCheck, Wand2, Map, BarChart2, StickyNote, Settings, ChevronLeft, ChevronRight, Search, Plus, X, LogOut } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import QuickAdd from "@/components/QuickAdd";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home", shortcut: "1" },
  { to: "/schedule", icon: CalendarCheck, label: "Schedule", shortcut: "2" },
  { to: "/tools", icon: Wand2, label: "AI Tools", shortcut: "3" },
  { to: "/roadmap", icon: Map, label: "Roadmap", shortcut: "4" },
  { to: "/analytics", icon: BarChart2, label: "Analytics", shortcut: "5" },
  { to: "/notes", icon: StickyNote, label: "Notes", shortcut: "6" },
  { to: "/settings", icon: Settings, label: "Settings", shortcut: "7" },
];

const SHORTCUTS_NAV = ["1", "2", "3", "4", "5", "6", "7"];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { settings, setSettings } = useApp();
  const [location, setLocation] = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const expanded = settings.sidebarExpanded;
  const setExpanded = (v: boolean) => setSettings(s => ({ ...s, sidebarExpanded: v }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const displayName = settings.userName || "User";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "k") { e.preventDefault(); setQuickAddOpen(true); }
      if (meta && SHORTCUTS_NAV.includes(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (NAV_ITEMS[idx]) setLocation(NAV_ITEMS[idx].to);
      }
      if (e.key === "Escape") { setQuickAddOpen(false); setSearchOpen(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setLocation]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const isActive = (to: string) => to === "/dashboard" ? location === "/dashboard" || location === "/" : location.startsWith(to);

  const handleSignOut = () => {
    localStorage.removeItem("focus_os_authed");
    setLocation("/");
  };

  const initials = displayName?.[0].toUpperCase() || "U";

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className="fixed top-0 left-0 h-screen z-30 flex flex-col border-r border-border transition-all duration-300 hidden lg:flex"
        style={{ width: expanded ? 220 : 60, background: "hsl(var(--sidebar))" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 h-[60px] border-b border-border overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <LayoutDashboard size={16} className="text-primary-foreground" />
          </div>
          {expanded && <span className="font-display font-bold text-base whitespace-nowrap truncate">Focus OS</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-hidden">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link key={to} href={to}>
              <div
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-3 mx-2 px-2 py-2.5 rounded-lg mb-1 cursor-pointer transition-all duration-200 group
                  ${isActive(to)
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {expanded && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="px-2 pb-2 border-t border-border pt-2">
          {expanded ? (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex-shrink-0 overflow-hidden flex items-center justify-center">
                <span className="text-xs font-bold text-primary uppercase">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground/75 truncate">Local User</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* Quick Add button */}
        <div className="px-2 pb-2">
          <button
            data-testid="btn-quick-add"
            onClick={() => setQuickAddOpen(true)}
            className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted text-sm`}
          >
            <Plus size={18} className="flex-shrink-0" />
            {expanded && <span className="font-medium">Quick Add</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <div className="px-2 pb-4">
          <button
            data-testid="btn-sidebar-toggle"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
          >
            {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </aside>

      {/* Topbar */}
      <header
        className="fixed top-0 right-0 h-[60px] z-20 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm"
        style={{ left: typeof window !== "undefined" && window.innerWidth >= 1024 ? (expanded ? 220 : 60) : 0 }}
      >
        <div className="flex flex-col">
          <span className="text-sm font-display font-semibold">{greeting}, {displayName}</span>
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        </div>
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
              <Search size={14} className="text-muted-foreground" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks, tools, roadmaps..."
                className="bg-transparent text-sm outline-none w-48 placeholder:text-muted-foreground"
                data-testid="input-search"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}><X size={14} className="text-muted-foreground" /></button>
            </div>
          ) : (
            <button
              data-testid="btn-search"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Search size={18} />
            </button>
          )}
          <button
            data-testid="btn-header-quick-add"
            onClick={() => setQuickAddOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New</span>
          </button>
          {/* Mobile sign out */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex lg:hidden border-t border-border bg-background/95 backdrop-blur">
        {NAV_ITEMS.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <Link key={to} href={to} className="flex-1">
            <div className={`flex flex-col items-center py-2 gap-0.5 cursor-pointer transition-colors
              ${isActive(to) ? "text-primary" : "text-muted-foreground"}`}>
              <Icon size={20} />
              <span className="text-[10px]">{label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main
        className="flex-1 min-h-screen transition-all duration-300 pt-[60px] pb-[64px] lg:pb-0"
        style={{ paddingLeft: typeof window !== "undefined" && window.innerWidth >= 1024 ? (expanded ? 220 : 60) : 0 }}
      >
        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>

      <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
