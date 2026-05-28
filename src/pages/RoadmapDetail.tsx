import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Plus, Check, Circle, Loader, ChevronDown, ChevronRight, ExternalLink, Play, Square, Flame } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Phase, Step, StepStatus, Resource, StudyLog } from "@/lib/types";

function ProgressRing({ pct, size = 72, color }: { pct: number; size?: number; color: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct/100)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

function getToday() { return new Date().toISOString().split("T")[0]; }

export default function RoadmapDetail() {
  const [, params] = useRoute("/roadmap/:id");
  const id = params?.id;
  const { roadmaps, setRoadmaps, studyLogs, setStudyLogs } = useApp();
  const rm = roadmaps.find(r => r.id === id);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(rm?.phases.map(p => p.id) || []));
  const [studyRunning, setStudyRunning] = useState(false);
  const [studySeconds, setStudySeconds] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(60);
  const studyInterval = useRef<number | null>(null);
  const today = getToday();

  useEffect(() => {
    if (studyRunning) {
      studyInterval.current = window.setInterval(() => setStudySeconds(s => s + 1), 1000);
    } else if (studyInterval.current) {
      clearInterval(studyInterval.current);
    }
    return () => { if (studyInterval.current) clearInterval(studyInterval.current); };
  }, [studyRunning]);

  function stopStudy() {
    if (studySeconds < 10 || !id) { setStudyRunning(false); setStudySeconds(0); return; }
    const mins = Math.round(studySeconds / 60);
    const existing = studyLogs.find(l => l.roadmapId === id && l.date === today);
    if (existing) {
      setStudyLogs(prev => prev.map(l => l.id === existing.id ? { ...l, minutes: l.minutes + mins } : l));
    } else {
      setStudyLogs(prev => [...prev, { id: `sl-${Date.now()}`, roadmapId: id, date: today, minutes: mins }]);
    }
    setStudyRunning(false); setStudySeconds(0);
  }

  function updateStep(phaseId: string, stepId: string, update: Partial<Step>) {
    setRoadmaps(prev => prev.map(r => r.id === id ? {
      ...r, phases: r.phases.map(p => p.id === phaseId ? {
        ...p, steps: p.steps.map(s => s.id === stepId ? { ...s, ...update } : s),
      } : p),
    } : r));
  }

  function cycleStatus(phaseId: string, step: Step) {
    const next: Record<StepStatus, StepStatus> = { todo: "inprogress", inprogress: "done", done: "todo" };
    updateStep(phaseId, step.id, { status: next[step.status], notes: step.notes });
  }

  function addPhase() {
    if (!id) return;
    const newPhase: Phase = { id: `ph-${Date.now()}`, title: "New Phase", order: rm!.phases.length, steps: [] };
    setRoadmaps(prev => prev.map(r => r.id === id ? { ...r, phases: [...r.phases, newPhase] } : r));
  }

  function addStep(phaseId: string) {
    const newStep: Step = {
      id: `s-${Date.now()}`, title: "New step", description: "", estimatedHours: 2,
      status: "todo", resources: [], notes: "", order: (rm?.phases.find(p => p.id === phaseId)?.steps.length || 0),
    };
    setRoadmaps(prev => prev.map(r => r.id === id ? {
      ...r, phases: r.phases.map(p => p.id === phaseId ? { ...p, steps: [...p.steps, newStep] } : p),
    } : r));
  }

  function addResource(phaseId: string, stepId: string, res: Resource) {
    const step = rm?.phases.find(p => p.id === phaseId)?.steps.find(s => s.id === stepId);
    if (step) updateStep(phaseId, stepId, { resources: [...step.resources, res] });
  }

  if (!rm) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground mb-4">Roadmap not found.</p>
      <Link href="/roadmap"><span className="text-primary hover:underline">Back to roadmaps</span></Link>
    </div>
  );

  const allSteps = rm.phases.flatMap(p => p.steps);
  const pct = allSteps.length ? Math.round(allSteps.filter(s => s.status === "done").length / allSteps.length * 100) : 0;

  const todayMins = studyLogs.filter(l => l.roadmapId === id && l.date === today).reduce((a, b) => a + b.minutes, 0);
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const ds = d.toISOString().split("T")[0];
    const mins = studyLogs.filter(l => l.roadmapId === id && l.date === ds).reduce((a, b) => a + b.minutes, 0);
    return { date: ds, mins };
  });

  const streak = (() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().split("T")[0];
      const hasMins = studyLogs.some(l => l.roadmapId === id && l.date === ds && l.minutes > 0);
      if (!hasMins) break;
      count++; d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const maxMins = Math.max(...last30Days.map(d => d.mins), 1);
  const mm = String(Math.floor(studySeconds / 60)).padStart(2, "0");
  const ss = String(studySeconds % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/roadmap">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground mt-1">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">{rm.title}</h1>
          {rm.goal && <p className="text-muted-foreground text-sm mt-0.5">{rm.goal}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{pct}% complete</span>
            {rm.targetDate && <><span>·</span><span>Target: {rm.targetDate}</span></>}
            <span>·</span><span>{allSteps.filter(s => s.status === "done").length}/{allSteps.length} steps</span>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <ProgressRing pct={pct} color={rm.colour} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-display"
            style={{ transform: "rotate(90deg)" }}>{pct}%</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {rm.phases.map(phase => {
            const phasePct = phase.steps.length ? Math.round(phase.steps.filter(s => s.status === "done").length / phase.steps.length * 100) : 0;
            const isOpen = expandedPhases.has(phase.id);
            return (
              <div key={phase.id} data-testid={`phase-${phase.id}`} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedPhases(prev => { const n = new Set(prev); isOpen ? n.delete(phase.id) : n.add(phase.id); return n; })}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="font-display font-semibold text-sm flex-1 text-left">{phase.title}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{phase.steps.filter(s => s.status === "done").length}/{phase.steps.length}</span>
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${phasePct}%`, background: rm.colour }} />
                    </div>
                    <span>{phasePct}%</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 space-y-2">
                    {phase.steps.map(step => {
                      const isExpanded = expandedSteps.has(step.id);
                      return (
                        <div key={step.id} data-testid={`step-${step.id}`}
                          className="border border-border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-3">
                            <button onClick={() => cycleStatus(phase.id, step)} className="flex-shrink-0 transition-colors">
                              {step.status === "done" ? <Check size={16} className="text-green-400" /> :
                               step.status === "inprogress" ? <Loader size={16} className="text-blue-400 animate-spin" /> :
                               <Circle size={16} className="text-muted-foreground" />}
                            </button>
                            <span className={`flex-1 text-sm font-medium ${step.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                              {step.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {step.estimatedHours > 0 && <span>{step.estimatedHours}h</span>}
                              <button onClick={() => setExpandedSteps(prev => { const n = new Set(prev); isExpanded ? n.delete(step.id) : n.add(step.id); return n; })}
                                className="hover:text-foreground transition-colors">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                              {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
                              {step.resources.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Resources</p>
                                  {step.resources.map((res, i) => (
                                    <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs text-primary hover:underline">
                                      <ExternalLink size={12} /> {res.title}
                                      <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{res.type}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                              <AddResourceForm onAdd={res => addResource(phase.id, step.id, res)} />
                              <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Notes</p>
                                <textarea value={step.notes} rows={2}
                                  onChange={e => updateStep(phase.id, step.id, { notes: e.target.value })}
                                  placeholder="Your notes on this step..."
                                  className="w-full bg-muted rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary resize-none" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button data-testid={`btn-add-step-${phase.id}`} onClick={() => addStep(phase.id)}
                      className="w-full flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground py-2 px-2 rounded-lg hover:bg-muted transition-colors">
                      <Plus size={12} /> Add step
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button data-testid="btn-add-phase" onClick={addPhase}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 text-sm">
            <Plus size={14} /> Add Phase
          </button>
        </div>

        {/* Study Tracker */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-display font-semibold mb-4">Study Tracker</h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">Daily goal (mins)</span>
              <input type="number" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value) || 30)}
                className="w-16 bg-muted rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary text-right" />
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-500 bg-teal-500"
                style={{ width: `${Math.min(100, (todayMins / dailyGoal) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mb-4">{todayMins}/{dailyGoal} mins today</p>
            <div className="text-center">
              <div className="text-3xl font-display font-bold tabular-nums text-primary mb-3">{mm}:{ss}</div>
              <button data-testid="btn-study-toggle"
                onClick={() => studyRunning ? stopStudy() : setStudyRunning(true)}
                className={`flex items-center gap-2 mx-auto px-5 py-2 rounded-lg text-sm font-medium transition-all ${studyRunning ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30"}`}>
                {studyRunning ? <><Square size={14} /> Stop & Save</> : <><Play size={14} /> Start Session</>}
              </button>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-orange-400" />
              <span className="font-semibold text-sm">{streak} day streak</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {last30Days.map((d, i) => {
                const intensity = d.mins === 0 ? 0 : Math.min(4, Math.ceil((d.mins / maxMins) * 4));
                const colors = ["bg-muted/30", "bg-teal-900/60", "bg-teal-700/70", "bg-teal-500/80", "bg-teal-400"];
                return (
                  <div key={i} title={`${d.date}: ${d.mins}min`}
                    className={`w-full aspect-square rounded-sm ${colors[intensity]} transition-colors`} />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddResourceForm({ onAdd }: { onAdd: (r: Resource) => void }) {
  const [show, setShow] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Resource["type"]>("Article");

  function save() {
    if (!url.trim()) return;
    onAdd({ url: url.startsWith("http") ? url : `https://${url}`, title: title || url, type });
    setUrl(""); setTitle(""); setShow(false);
  }

  return show ? (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL"
        className="w-full bg-background rounded px-2 py-1 text-xs outline-none border border-border focus:border-primary" />
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)"
        className="w-full bg-background rounded px-2 py-1 text-xs outline-none border border-border focus:border-primary" />
      <div className="flex gap-2">
        <select value={type} onChange={e => setType(e.target.value as Resource["type"])}
          className="flex-1 bg-background rounded px-2 py-1 text-xs border border-border outline-none">
          {["Article","Video","Course","Book"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={save} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">Add</button>
        <button onClick={() => setShow(false)} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">Cancel</button>
      </div>
    </div>
  ) : (
    <button onClick={() => setShow(true)}
      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
      <Plus size={11} /> Add resource
    </button>
  );
}
