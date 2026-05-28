import { useState } from "react";
import { Link } from "wouter";
import { Plus, Map, ArrowRight, Edit, Trash2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { Roadmap, Phase, Step } from "@/lib/types";

function getRoadmapProgress(rm: Roadmap) {
  const steps = rm.phases.flatMap(p => p.steps);
  if (!steps.length) return 0;
  return Math.round((steps.filter(s => s.status === "done").length / steps.length) * 100);
}

function ProgressRing({ pct, size = 56, color }: { pct: number; size?: number; color: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

const TEMPLATES = [
  { name: "Web Development", colour: "#3B82F6", icon: "code", goal: "Go from fundamentals to full-stack" },
  { name: "Python & AI/ML", colour: "#8B5CF6", icon: "brain", goal: "Learn Python and build ML models" },
  { name: "UI/UX Design", colour: "#EC4899", icon: "palette", goal: "Master design thinking and tools" },
  { name: "Data Science", colour: "#14B8A6", icon: "chart", goal: "Analyse and visualise data professionally" },
  { name: "DevOps", colour: "#F59E0B", icon: "server", goal: "Automate deployments and manage infra" },
  { name: "Blank Roadmap", colour: "#6B7280", icon: "map", goal: "" },
];

export default function RoadmapList() {
  const { roadmaps, setRoadmaps } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function openCreate(tmpl: typeof TEMPLATES[0]) {
    setSelectedTemplate(tmpl);
    setTitle(tmpl.name);
    setGoal(tmpl.goal);
  }

  function createRoadmap() {
    if (!title.trim()) return;
    const newRm: Roadmap = {
      id: `rm-${Date.now()}`,
      title,
      goal,
      targetDate,
      colour: selectedTemplate?.colour || "#3B82F6",
      icon: selectedTemplate?.icon || "map",
      phases: [],
    };
    setRoadmaps(prev => [...prev, newRm]);
    setCreateOpen(false);
    setSelectedTemplate(null);
    setTitle(""); setGoal(""); setTargetDate("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Learning Roadmaps</h1>
        <button data-testid="btn-new-roadmap" onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={14} /> New Roadmap
        </button>
      </div>

      {roadmaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg width="80" height="80" viewBox="0 0 80 80" className="mb-4 opacity-30">
            <path d="M15 65 Q30 20 45 40 Q60 60 65 15" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="15" cy="65" r="5" fill="hsl(var(--primary))" />
            <circle cx="45" cy="40" r="4" fill="hsl(var(--secondary))" opacity="0.8" />
            <circle cx="65" cy="15" r="5" fill="hsl(var(--primary))" opacity="0.6" />
          </svg>
          <p className="text-muted-foreground mb-4">No roadmaps yet. Start your learning journey.</p>
          <button onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
            Create your first roadmap
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadmaps.map(rm => {
            const pct = getRoadmapProgress(rm);
            const stepsTotal = rm.phases.flatMap(p => p.steps).length;
            const stepsDone = rm.phases.flatMap(p => p.steps).filter(s => s.status === "done").length;
            const inEdit = editingId === rm.id;
            return (
              <div key={rm.id} data-testid={`roadmap-card-${rm.id}`}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {!inEdit ? (
                      <>
                        <h3 className="font-display font-bold text-base">{rm.title}</h3>
                        {rm.goal && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{rm.goal}</p>}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-muted rounded-lg px-2 py-1 text-sm outline-none border border-transparent focus:border-primary" />
                        <input value={editTargetDate} onChange={e => setEditTargetDate(e.target.value)} type="date"
                          className="w-full bg-muted rounded-lg px-2 py-1 text-sm outline-none border border-transparent focus:border-primary" />
                        <textarea value={editGoal} onChange={e => setEditGoal(e.target.value)} rows={2}
                          className="w-full bg-muted rounded-lg px-2 py-1 text-sm outline-none border border-transparent focus:border-primary resize-none" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressRing pct={pct} color={rm.colour} />
                    {!inEdit ? (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Edit" onClick={() => { setEditingId(rm.id); setEditTitle(rm.title); setEditGoal(rm.goal || ""); setEditTargetDate(rm.targetDate || ""); }}
                          className="p-1 rounded hover:bg-muted">
                          <Edit size={14} />
                        </button>
                        <button title="Delete" onClick={() => { if (!confirm('Delete this roadmap?')) return; setRoadmaps(prev => prev.filter(r => r.id !== rm.id)); }}
                          className="p-1 rounded hover:bg-muted text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button title="Save" onClick={() => {
                          setRoadmaps(prev => prev.map(r => r.id === rm.id ? { ...r, title: editTitle, goal: editGoal, targetDate: editTargetDate } : r));
                          setEditingId(null);
                        }} className="p-1 rounded bg-primary text-primary-foreground">
                          <Check size={14} />
                        </button>
                        <button title="Cancel" onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-muted">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span>{stepsDone}/{stepsTotal} steps</span>
                  <span>·</span>
                  <span>{pct}% complete</span>
                  {rm.targetDate && <><span>·</span><span>Due {rm.targetDate}</span></>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden mr-4">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: rm.colour }} />
                  </div>
                  <Link href={`/roadmap/${rm.id}`}>
                    <span data-testid={`btn-open-rm-${rm.id}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-medium">
                      Open <ArrowRight size={12} />
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={v => { if (!v) { setCreateOpen(false); setSelectedTemplate(null); } }}>
        <DialogContent className="max-w-lg bg-card border-border" data-testid="modal-new-roadmap">
          <DialogHeader>
            <DialogTitle className="font-display">New Roadmap</DialogTitle>
          </DialogHeader>
          {!selectedTemplate ? (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-muted-foreground">Choose a template to get started:</p>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.name} data-testid={`tmpl-${t.name.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => openCreate(t)}
                    className="p-3 rounded-xl border border-border text-left hover:border-primary/40 transition-all duration-200 group">
                    <div className="w-6 h-6 rounded-lg mb-2 flex-shrink-0" style={{ background: t.colour + "33" }}>
                      <Map size={14} className="m-1" style={{ color: t.colour }} />
                    </div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    {t.goal && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.goal}</p>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Title *</label>
                <input data-testid="input-rm-title" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Goal</label>
                <textarea data-testid="input-rm-goal" value={goal} onChange={e => setGoal(e.target.value)} rows={2}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary resize-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Target Date</label>
                <input data-testid="input-rm-date" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 text-sm transition-colors">Back</button>
                <button data-testid="btn-create-rm" onClick={createRoadmap} disabled={!title.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                  Create Roadmap
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
