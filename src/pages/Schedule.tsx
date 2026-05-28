import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Play, Pause, RotateCcw, SkipForward, Timer, List, Grid3X3, CalendarDays, Edit, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Task, TaskStatus, Priority } from "@/lib/types";
import TaskModal from "@/components/TaskModal";

type Tab = "kanban" | "list" | "calendar" | "focus";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "inprogress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const PRIORITY_BADGE: Record<Priority, string> = {
  P0: "bg-red-500/20 text-red-400 border-red-500/30",
  P1: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  P2: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  P3: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
}

export default function Schedule() {
  const { tasks, setTasks, projects, pomodoroData, setPomodoroData } = useApp();
  function removeTask(id: string) {
    if (!confirm("Delete this task?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  }
  const [tab, setTab] = useState<Tab>("kanban");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [addStatus, setAddStatus] = useState<TaskStatus>("backlog");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  // Pomodoro state
  const pomSettings = pomodoroData.settings;
  const [timerMode, setTimerMode] = useState<"work" | "short" | "long">("work");
  const [timeLeft, setTimeLeft] = useState(pomSettings.workDuration * 60);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const dueTodayFirst = [...tasks].sort((a, b) => a.priority.localeCompare(b.priority));
  const focusTask = dueTodayFirst.find(t => t.dueDate === today && t.status !== "done") || dueTodayFirst.find(t => t.status !== "done");

  function timerDuration(mode: typeof timerMode) {
    if (mode === "work") return pomSettings.workDuration * 60;
    if (mode === "short") return pomSettings.shortBreak * 60;
    return pomSettings.longBreak * 60;
  }

  const onTimerEnd = useCallback(() => {
    setRunning(false);
    if (timerMode === "work") {
      const count = sessionCount + 1;
      setSessionCount(count);
      if (focusTask) {
        setPomodoroData(prev => ({
          ...prev, sessions: [...prev.sessions, {
            id: `ps-${Date.now()}`, taskId: focusTask.id, taskName: focusTask.title,
            date: today, completedAt: new Date().toISOString(),
          }],
        }));
      }
      if (pomSettings.soundEnabled) {
        if (!audioRef.current) audioRef.current = new AudioContext();
        playBeep(audioRef.current);
      }
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pomodoro complete!", { body: "Take a break." });
      }
      const next = count % 4 === 0 ? "long" : "short";
      setTimerMode(next); setTimeLeft(timerDuration(next));
    } else {
      setTimerMode("work"); setTimeLeft(timerDuration("work"));
    }
  }, [timerMode, sessionCount, focusTask, pomSettings, today, setPomodoroData]);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { onTimerEnd(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, onTimerEnd]);

  function startPause() {
    if (!running && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setRunning(p => !p);
  }
  function reset() { setRunning(false); setTimeLeft(timerDuration(timerMode)); }

  function switchMode(mode: typeof timerMode) { setTimerMode(mode); setTimeLeft(timerDuration(mode)); setRunning(false); }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  // Drag and drop
  function onDragStart(e: React.DragEvent, id: string) { setDragId(id); e.dataTransfer.effectAllowed = "move"; }
  function onDragOver(e: React.DragEvent, col: TaskStatus) { e.preventDefault(); setDragOverCol(col); }
  function onDrop(e: React.DragEvent, col: TaskStatus) {
    e.preventDefault();
    if (dragId) setTasks(prev => prev.map(t => t.id === dragId ? { ...t, status: col } : t));
    setDragId(null); setDragOverCol(null);
  }

  const filteredTasks = tasks.filter(t => {
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterProject !== "all" && t.projectId !== filterProject) return false;
    return true;
  });

  // Calendar
  const calDays = () => {
    const year = calMonth.getFullYear(), month = calMonth.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (null | Date)[] = Array(first === 0 ? 6 : first - 1).fill(null);
    for (let i = 1; i <= days; i++) cells.push(new Date(year, month, i));
    return cells;
  };

  function getProjectColor(projectId: string) {
    return projects.find(p => p.id === projectId)?.colour || "#6B7280";
  }

  function getTasksForDay(date: Date) {
    const s = date.toISOString().split("T")[0];
    return tasks.filter(t => t.dueDate === s);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Scheduler</h1>
        <button data-testid="btn-add-task"
          onClick={() => { setEditTask(null); setTaskModalOpen(true); }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={14} /> New Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {[
          { id: "kanban", label: "Kanban", icon: Grid3X3 },
          { id: "list", label: "List", icon: List },
          { id: "calendar", label: "Calendar", icon: CalendarDays },
          { id: "focus", label: "Focus", icon: Timer },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} data-testid={`tab-${id}`}
            onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 font-medium
              ${tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* KANBAN */}
      {tab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} data-testid={`kanban-col-${col.id}`}
                onDragOver={e => onDragOver(e, col.id)} onDrop={e => onDrop(e, col.id)}
                className={`rounded-xl border transition-all duration-200 ${dragOverCol === col.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="font-semibold text-sm">{col.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-[200px]">
                  {colTasks.map(task => (
                    <div key={task.id} data-testid={`kanban-card-${task.id}`}
                      draggable onDragStart={e => onDragStart(e, task.id)}
                      className={`bg-background border border-border rounded-lg p-3 hover:border-primary/40 hover:shadow-sm transition-all duration-200 group relative ${dragId === task.id ? "opacity-40" : ""}`}>
                      <div onClick={() => { setEditTask(task); setTaskModalOpen(true); }} className="cursor-pointer">
                        <p className="text-sm font-medium leading-tight mb-2">{task.title}</p>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                          {task.dueDate && <span className="text-xs text-muted-foreground">{task.dueDate}</span>}
                          {task.estimatedHours > 0 && <span className="text-xs text-muted-foreground">{task.estimatedHours}h</span>}
                          {task.projectId && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md ml-auto" style={{ background: `${getProjectColor(task.projectId)}22`, color: getProjectColor(task.projectId) }}>
                              {projects.find(p => p.id === task.projectId)?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 flex gap-1">
                        <button title="Edit" onClick={(e) => { e.stopPropagation(); setEditTask(task); setTaskModalOpen(true); }}
                          className="p-1 rounded bg-muted/60 hover:bg-muted">
                          <Edit size={14} />
                        </button>
                        <button title="Delete" onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                          className="p-1 rounded bg-muted/60 hover:bg-muted text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button data-testid={`btn-add-to-${col.id}`}
                    onClick={() => { setEditTask(null); setAddStatus(col.id); setTaskModalOpen(true); }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 py-1.5 hover:bg-muted rounded-lg px-2 transition-colors">
                    <Plus size={12} /> Add task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST */}
      {tab === "list" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select data-testid="filter-priority" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="bg-muted text-sm rounded-lg px-3 py-1.5 border border-border outline-none focus:border-primary">
              <option value="all">All priorities</option>
              {["P0","P1","P2","P3"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select data-testid="filter-project" value={filterProject} onChange={e => setFilterProject(e.target.value)}
              className="bg-muted text-sm rounded-lg px-3 py-1.5 border border-border outline-none focus:border-primary">
              <option value="all">All projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Title", "Priority", "Project", "Due Date", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No tasks match the current filters.</td></tr>
                ) : filteredTasks.map(task => (
                  <tr key={task.id} data-testid={`list-row-${task.id}`}
                    onClick={() => { setEditTask(task); setTaskModalOpen(true); }}
                    className="border-b border-border hover:bg-muted/40 cursor-pointer transition-colors last:border-0">
                    <td className="px-4 py-3 font-medium">{task.title}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{projects.find(p => p.id === task.projectId)?.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{task.dueDate || "—"}</td>
                    <td className="px-4 py-3"><span className="capitalize text-xs bg-muted px-2 py-0.5 rounded-full">{task.status === "inprogress" ? "In Progress" : task.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2 items-center justify-end">
                        <button title="Edit" onClick={(e) => { e.stopPropagation(); setEditTask(task); setTaskModalOpen(true); }}
                          className="p-1 rounded hover:bg-muted">
                          <Edit size={14} />
                        </button>
                        <button title="Delete" onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                          className="p-1 rounded hover:bg-muted text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CALENDAR */}
      {tab === "calendar" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">‹</button>
              <span className="font-display font-semibold">
                {calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calDays().map((d, i) => {
                if (!d) return <div key={i} />;
                const ds = d.toISOString().split("T")[0];
                const dayTasks = getTasksForDay(d);
                const isToday = ds === today;
                const isSelected = ds === selectedDay;
                return (
                  <button key={i} data-testid={`cal-day-${ds}`}
                    onClick={() => setSelectedDay(isSelected ? null : ds)}
                    className={`min-h-[52px] p-1 rounded-lg text-left transition-all duration-200 relative
                      ${isToday ? "bg-primary/20 border border-primary/40" : "hover:bg-muted"}
                      ${isSelected ? "ring-1 ring-primary" : ""}`}>
                    <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>{d.getDate()}</span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayTasks.slice(0, 2).map(t => (
                        <div key={t.id} className="text-[10px] truncate px-1 rounded text-white"
                          style={{ background: PRIORITY_BADGE[t.priority].includes("red") ? "#ef4444" : PRIORITY_BADGE[t.priority].includes("orange") ? "#f97316" : "#3B82F6" }}>
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 2}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">{selectedDay ? `Tasks on ${selectedDay}` : "Click a day to see tasks"}</h3>
            {selectedDay ? (
              tasks.filter(t => t.dueDate === selectedDay).length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks on this day.</p>
              ) : tasks.filter(t => t.dueDate === selectedDay).map(task => (
                <div key={task.id} data-testid={`cal-task-${task.id}`}
                  className="p-3 rounded-lg border border-border mb-2 relative transition-colors">
                  <div onClick={() => { setEditTask(task); setTaskModalOpen(true); }} className="cursor-pointer">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                      {task.dueTime && <span className="text-xs text-muted-foreground">{task.dueTime}</span>}
                    </div>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button title="Edit" onClick={(e) => { e.stopPropagation(); setEditTask(task); setTaskModalOpen(true); }}
                      className="p-1 rounded hover:bg-muted">
                      <Edit size={14} />
                    </button>
                    <button title="Delete" onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                      className="p-1 rounded hover:bg-muted text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Select a date on the calendar.</p>
            )}
          </div>
        </div>
      )}

      {/* FOCUS MODE */}
      {tab === "focus" && (
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6">
            {focusTask ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Currently focused on</p>
                  <h2 className="text-xl font-display font-bold">{focusTask.title}</h2>
                  {focusTask.description && <p className="text-sm text-muted-foreground mt-1">{focusTask.description}</p>}
                </div>
                {/* Mode selector */}
                <div className="flex gap-2 justify-center">
                  {[
                    { id: "work", label: `Work ${pomSettings.workDuration}m` },
                    { id: "short", label: `Short ${pomSettings.shortBreak}m` },
                    { id: "long", label: `Long ${pomSettings.longBreak}m` },
                  ].map(m => (
                    <button key={m.id} onClick={() => switchMode(m.id as typeof timerMode)} data-testid={`btn-mode-${m.id}`}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${timerMode === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
                {/* Timer */}
                <div className="relative">
                  <div className="text-6xl font-display font-bold tracking-tight tabular-nums"
                    style={{ color: timerMode === "work" ? "hsl(var(--primary))" : "hsl(var(--secondary))" }}>
                    {mm}:{ss}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {timerMode === "work" ? "Focus session" : timerMode === "short" ? "Short break" : "Long break"} · Session {sessionCount + 1}
                  </p>
                </div>
                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button onClick={reset} data-testid="btn-timer-reset"
                    className="p-3 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <RotateCcw size={18} />
                  </button>
                  <button onClick={startPause} data-testid="btn-timer-start"
                    className="px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 shadow-lg"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    {running ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button onClick={() => {}} data-testid="btn-skip-task"
                    className="p-3 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <SkipForward size={18} />
                  </button>
                </div>
                {/* Session dots */}
                {sessionCount > 0 && (
                  <div className="flex gap-2 justify-center">
                    {Array.from({ length: Math.min(sessionCount, 8) }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary/60" />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="py-12">
                <Timer size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">All tasks done! No pending tasks.</p>
                <button onClick={() => { setEditTask(null); setTaskModalOpen(true); }}
                  className="mt-4 text-sm bg-primary/20 text-primary px-4 py-2 rounded-lg hover:bg-primary/30 transition-colors">
                  Add a task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <TaskModal open={taskModalOpen} onClose={() => { setTaskModalOpen(false); setEditTask(null); }}
        initialTask={editTask} initialStatus={addStatus} />
    </div>
  );
}
