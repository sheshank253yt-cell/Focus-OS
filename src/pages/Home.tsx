import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, AlertCircle, Wand2, Map, ArrowRight, ExternalLink, Plus, Circle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import TaskModal from "@/components/TaskModal";

const PRIORITY_DOT: Record<string, string> = {
  P0: "bg-red-500", P1: "bg-orange-500", P2: "bg-blue-500", P3: "bg-gray-500",
};

function getRoadmapProgress(rm: import("@/lib/types").Roadmap) {
  const steps = rm.phases.flatMap(p => p.steps);
  if (!steps.length) return 0;
  return Math.round((steps.filter(s => s.status === "done").length / steps.length) * 100);
}

export default function Home() {
  const { tasks, setTasks, projects, tools, roadmaps } = useApp();
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => t.dueDate === today && t.status !== "done");
  const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "done");
  const pinnedTools = tools.filter(t => t.isPinned).slice(0, 6);
  const activeRoadmaps = roadmaps;

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, status: t.status === "done" ? "inprogress" : "done", completedAt: t.status !== "done" ? new Date().toISOString() : null }
      : t));
  }

  function getProjectColor(projectId: string) {
    return projects.find(p => p.id === projectId)?.colour || "#6B7280";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your personal cockpit for the day ahead.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Due Today", value: todayTasks.length, icon: CheckCircle2, color: "text-blue-400", link: "/schedule" },
          { label: "Overdue", value: overdueTasks.length, icon: AlertCircle, color: overdueTasks.length > 0 ? "text-red-400" : "text-muted-foreground", link: "/schedule" },
          { label: "AI Tools", value: tools.length, icon: Wand2, color: "text-purple-400", link: "/tools" },
          { label: "Roadmaps", value: roadmaps.length, icon: Map, color: "text-teal-400", link: "/roadmap" },
        ].map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} href={link}>
            <div data-testid={`stat-card-${label.toLowerCase().replace(/\s/g, "-")}`}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 cursor-pointer transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
                <Icon size={16} className={`${color} group-hover:scale-110 transition-transform`} />
              </div>
              <span className="text-2xl font-display font-bold">{value}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main two-column area */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Today's Agenda */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base">Today's Agenda</h2>
            <button data-testid="btn-add-task-home" onClick={() => setAddTaskOpen(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Plus size={14} /> Add task
            </button>
          </div>
          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg width="80" height="60" viewBox="0 0 80 60" className="mb-4 opacity-30">
                <rect x="10" y="10" width="60" height="40" rx="6" fill="currentColor" opacity="0.3" />
                <rect x="20" y="22" width="20" height="3" rx="2" fill="currentColor" />
                <rect x="20" y="30" width="35" height="3" rx="2" fill="currentColor" />
                <rect x="20" y="38" width="25" height="3" rx="2" fill="currentColor" />
                <circle cx="14" cy="22" r="3" fill="hsl(var(--primary))" />
                <circle cx="14" cy="30" r="3" fill="hsl(var(--primary))" opacity="0.5" />
                <circle cx="14" cy="38" r="3" fill="hsl(var(--primary))" opacity="0.3" />
              </svg>
              <p className="text-sm text-muted-foreground mb-3">Nothing due today — great focus!</p>
              <button onClick={() => setAddTaskOpen(true)}
                className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors">
                Add your first task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {[...todayTasks].sort((a, b) => a.priority.localeCompare(b.priority)).map(task => (
                <div key={task.id} data-testid={`task-item-${task.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                    <CheckCircle2 size={18} className={task.status === "done" ? "text-primary" : "text-muted-foreground group-hover:text-primary/60 transition-colors"} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </span>
                    {task.dueTime && <span className="ml-2 text-xs text-muted-foreground">{task.dueTime}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
                    {task.projectId && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: `${getProjectColor(task.projectId)}22`, color: getProjectColor(task.projectId) }}>
                        {projects.find(p => p.id === task.projectId)?.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {overdueTasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-red-400 mb-2 font-medium">{overdueTasks.length} overdue</p>
                  {overdueTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg">
                      <Circle size={16} className="text-red-400 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{task.title}</span>
                      <span className="ml-auto text-xs text-red-400">{task.dueDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pinned AI Tools */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base">Pinned Tools</h2>
            <Link href="/tools">
              <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                All tools <ArrowRight size={12} />
              </span>
            </Link>
          </div>
          {pinnedTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wand2 size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No tools pinned yet</p>
              <Link href="/tools">
                <span className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer">
                  Browse tools
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {pinnedTools.map(tool => (
                <div key={tool.id} data-testid={`pinned-tool-${tool.id}`}
                  className="flex flex-col gap-2 p-3 rounded-lg border border-border hover:border-primary/40 transition-all duration-200">
                  <img src={tool.favicon} alt="" className="w-6 h-6 rounded"
                    onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%23444' width='24' height='24' rx='4'/></svg>"; }} />
                  <span className="text-xs font-medium leading-tight">{tool.name}</span>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                    Visit <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Learning Pulse */}
      {activeRoadmaps.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base">Learning Pulse</h2>
            <Link href="/roadmap">
              <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                All roadmaps <ArrowRight size={12} />
              </span>
            </Link>
          </div>
          <div className="space-y-3">
            {activeRoadmaps.map(rm => {
              const pct = getRoadmapProgress(rm);
              return (
                <div key={rm.id} data-testid={`roadmap-pulse-${rm.id}`} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{rm.title}</span>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: rm.colour || "hsl(var(--primary))" }} />
                    </div>
                  </div>
                  <Link href={`/roadmap/${rm.id}`}>
                    <span className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap">Continue →</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TaskModal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} />
    </div>
  );
}
