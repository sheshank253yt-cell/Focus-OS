import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Download, Upload, Trash2, Moon, Sun, Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ACCENT_SWATCHES = [
  "#3B82F6", "#14B8A6", "#8B5CF6", "#EC4899",
  "#F59E0B", "#10B981", "#EF4444", "#F97316",
];

const SHORTCUTS = [
  { keys: "⌘ K", label: "Quick Add" },
  { keys: "⌘ 1–7", label: "Navigate to section" },
  { keys: "T", label: "New Task (in Scheduler)" },
  { keys: "Esc", label: "Close modal / panel" },
];

export default function Settings() {
  const { settings, setSettings, pomodoroData, setPomodoroData } = useApp();
  const [customAccent, setCustomAccent] = useState(settings.accent);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importRef] = useState(() => ({ current: null as HTMLInputElement | null }));

  function updateSettings(update: Partial<typeof settings>) {
    setSettings(prev => ({ ...prev, ...update }));
  }

  function updatePomodoroSettings(update: Partial<typeof pomodoroData.settings>) {
    setPomodoroData(prev => ({ ...prev, settings: { ...prev.settings, ...update } }));
  }

  function exportData() {
    const data: Record<string, unknown> = {};
    const keys = ["dashboard_tasks","dashboard_projects","dashboard_tools","dashboard_roadmaps","dashboard_notes","dashboard_journal","dashboard_pomodoro","dashboard_settings","dashboard_study_logs"];
    keys.forEach(k => { try { data[k] = JSON.parse(localStorage.getItem(k) || "null"); } catch { data[k] = null; } });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dashboard-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([k, v]) => { if (v !== null) localStorage.setItem(k, JSON.stringify(v)); });
        window.location.reload();
      } catch { alert("Invalid backup file."); }
    };
    reader.readAsText(file);
  }

  function clearAllData() {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === "focus_os_authed" || key.startsWith("focus_") || key.startsWith("dashboard_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-display font-bold">Settings</h1>

      {/* Appearance */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h2 className="font-display font-semibold text-base">Appearance</h2>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Display Name</label>
          <input data-testid="input-user-name" value={settings.userName}
            onChange={e => updateSettings({ userName: e.target.value })}
            className="w-full max-w-xs bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">Theme</label>
          <div className="flex gap-3">
            {[
              { value: "dark" as const, label: "Dark", icon: Moon },
              { value: "light" as const, label: "Light", icon: Sun },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} data-testid={`btn-theme-${value}`}
                onClick={() => updateSettings({ theme: value })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border transition-all duration-200
                  ${settings.theme === value ? "bg-primary/20 border-primary text-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/40"}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">Accent Color</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {ACCENT_SWATCHES.map(color => (
              <button key={color} data-testid={`btn-accent-${color.replace("#", "")}`}
                onClick={() => { updateSettings({ accent: color }); setCustomAccent(color); }}
                className={`w-8 h-8 rounded-lg transition-all duration-200 ${settings.accent === color ? "scale-125 ring-2 ring-white/50 ring-offset-1 ring-offset-background" : "hover:scale-110"}`}
                style={{ background: color }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={customAccent} onChange={e => setCustomAccent(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            <input data-testid="input-custom-accent" value={customAccent} onChange={e => setCustomAccent(e.target.value)}
              onBlur={() => { if (/^#[0-9A-Fa-f]{6}$/.test(customAccent)) updateSettings({ accent: customAccent }); }}
              placeholder="#3B82F6" maxLength={7}
              className="w-28 bg-muted rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary font-mono" />
            <button onClick={() => { if (/^#[0-9A-Fa-f]{6}$/.test(customAccent)) updateSettings({ accent: customAccent }); }}
              className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors">
              Apply
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">Sidebar default</label>
          <div className="flex gap-3">
            {[{ value: true, label: "Expanded" }, { value: false, label: "Collapsed" }].map(({ value, label }) => (
              <button key={String(value)} data-testid={`btn-sidebar-${value ? "expanded" : "collapsed"}`}
                onClick={() => updateSettings({ sidebarExpanded: value })}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${settings.sidebarExpanded === value ? "bg-primary/20 border-primary text-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/40"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pomodoro */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-display font-semibold text-base">Pomodoro Timer</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "workDuration", label: "Work (mins)" },
            { key: "shortBreak", label: "Short break" },
            { key: "longBreak", label: "Long break" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <input data-testid={`input-pomo-${key}`} type="number" min="1" max="120"
                value={(pomodoroData.settings as Record<string, number>)[key]}
                onChange={e => updatePomodoroSettings({ [key]: parseInt(e.target.value) || 25 } as Record<string, number>)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sound notifications</p>
            <p className="text-xs text-muted-foreground">Play a beep when a session ends</p>
          </div>
          <button data-testid="btn-pomo-sound"
            onClick={() => updatePomodoroSettings({ soundEnabled: !pomodoroData.settings.soundEnabled })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${pomodoroData.settings.soundEnabled ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${pomodoroData.settings.soundEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-display font-semibold text-base">Data Management</h2>
        <div className="space-y-3">
          <button data-testid="btn-export-data" onClick={exportData}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm">
            <Download size={16} className="text-teal-400" />
            <div className="text-left">
              <p className="font-medium">Export All Data</p>
              <p className="text-xs text-muted-foreground">Download a complete backup as JSON</p>
            </div>
          </button>
          <label className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm cursor-pointer">
            <Upload size={16} className="text-blue-400" />
            <div className="text-left">
              <p className="font-medium">Import Data</p>
              <p className="text-xs text-muted-foreground">Restore from a backup file</p>
            </div>
            <input data-testid="input-import-data" type="file" accept=".json" className="hidden"
              onChange={importData} ref={el => { importRef.current = el; }} />
          </label>
          <button data-testid="btn-clear-roadmaps-schedule" onClick={() => {
            if (!confirm("Clear roadmaps and schedule? This will remove roadmaps, tasks and study logs.")) return;
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i += 1) {
              const key = localStorage.key(i);
              if (!key) continue;
              if (key.includes("roadmap") || key.endsWith("_roadmaps") || key.endsWith("_tasks") || key.endsWith("_study_logs")) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            window.location.reload();
          }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-100 hover:bg-yellow-200 transition-colors text-sm border border-yellow-200">
            <Trash2 size={16} className="text-yellow-600" />
            <div className="text-left">
              <p className="font-medium">Clear Roadmaps & Schedule</p>
              <p className="text-xs text-muted-foreground">Remove only roadmaps, tasks, and study logs</p>
            </div>
          </button>
          <button data-testid="btn-list-storage-keys" onClick={() => {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i += 1) {
              const k = localStorage.key(i);
              if (!k) continue;
              if (k.startsWith("focus_") || k.startsWith("dashboard_") || k === "focus_os_authed") keys.push(k);
            }
            const out = keys.length ? keys.join("\n") : "(no matching keys)";
            try { navigator.clipboard.writeText(out); } catch {}
            alert("Storage keys copied to clipboard:\n\n" + out);
          }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm">
            <Download size={16} className="text-muted-foreground" />
            <div className="text-left">
              <p className="font-medium">List Storage Keys</p>
              <p className="text-xs text-muted-foreground">Shows and copies matching localStorage keys</p>
            </div>
          </button>
          <button data-testid="btn-clear-data" onClick={() => setClearDialogOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors text-sm border border-destructive/20">
            <Trash2 size={16} className="text-destructive" />
            <div className="text-left">
              <p className="font-medium text-destructive">Clear All Data</p>
              <p className="text-xs text-muted-foreground">Permanently delete everything and reset</p>
            </div>
          </button>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard size={16} className="text-muted-foreground" />
          <h2 className="font-display font-semibold text-base">Keyboard Shortcuts</h2>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={keys} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{keys}</kbd>
            </div>
          ))}
        </div>
      </section>

      {/* Clear confirmation */}
      <Dialog open={clearDialogOpen} onOpenChange={v => !v && setClearDialogOpen(false)}>
        <DialogContent className="max-w-sm bg-card border-border" data-testid="modal-clear-data">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Clear All Data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">This will permanently delete all tasks, tools, roadmaps, notes, and journal entries. This action cannot be undone.</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setClearDialogOpen(false)}
              className="flex-1 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 text-sm transition-colors">Cancel</button>
            <button data-testid="btn-confirm-clear" onClick={clearAllData}
              className="flex-1 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:opacity-90 transition-opacity">
              Yes, clear everything
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
