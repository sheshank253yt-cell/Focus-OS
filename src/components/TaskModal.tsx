import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Task, Priority, TaskStatus } from "@/lib/types";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  initialTask?: Task | null;
  initialStatus?: TaskStatus;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "P0", label: "P0", color: "bg-red-500 text-white" },
  { value: "P1", label: "P1", color: "bg-orange-500 text-white" },
  { value: "P2", label: "P2", color: "bg-blue-500 text-white" },
  { value: "P3", label: "P3", color: "bg-gray-500 text-white" },
];

const RECURRING = ["none", "daily", "weekly", "monthly"] as const;

export default function TaskModal({ open, onClose, initialTask, initialStatus = "backlog" }: TaskModalProps) {
  const { tasks, setTasks, projects } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<Priority>("P2");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none");

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setProjectId(initialTask.projectId);
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setDueDate(initialTask.dueDate);
      setDueTime(initialTask.dueTime);
      setEstimatedHours(String(initialTask.estimatedHours || ""));
      setTags(initialTask.tags);
      setRecurring(initialTask.recurring);
    } else {
      setTitle(""); setDescription(""); setProjectId(projects[0]?.id || "");
      setPriority("P2"); setStatus(initialStatus); setDueDate("");
      setDueTime(""); setEstimatedHours(""); setTags([]); setRecurring("none");
    }
  }, [initialTask, open, initialStatus, projects]);

  function addTag(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags(prev => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    if (initialTask) {
      setTasks(prev => prev.map(t => t.id === initialTask.id ? {
        ...t, title, description, projectId, priority, status,
        dueDate, dueTime, estimatedHours: parseFloat(estimatedHours) || 0, tags, recurring,
      } : t));
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`, title, description, projectId, priority, status,
        dueDate, dueTime, estimatedHours: parseFloat(estimatedHours) || 0, tags, recurring,
        createdAt: new Date().toISOString(), completedAt: null,
      };
      setTasks(prev => [newTask, ...prev]);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border" data-testid="modal-task">
        <DialogHeader>
          <DialogTitle className="font-display">{initialTask ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Title *</label>
            <input data-testid="input-task-title" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary transition-all" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Description</label>
            <textarea data-testid="input-task-description" value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder="Optional details..."
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Project</label>
              <select data-testid="select-task-project" value={projectId} onChange={e => setProjectId(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary">
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Status</label>
              <select data-testid="select-task-status" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary">
                {["backlog", "inprogress", "review", "done"].map(s => (
                  <option key={s} value={s}>{s === "inprogress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p.value} data-testid={`btn-priority-${p.value}`} onClick={() => setPriority(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${priority === p.value ? p.color : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Due Date</label>
              <input data-testid="input-task-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Due Time</label>
              <input data-testid="input-task-due-time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Est. Hours</label>
              <input data-testid="input-task-hours" type="number" step="0.5" min="0" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)}
                placeholder="e.g. 2"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Recurring</label>
              <select data-testid="select-task-recurring" value={recurring} onChange={e => setRecurring(e.target.value as typeof recurring)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary">
                {RECURRING.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {t}
                  <button onClick={() => setTags(prev => prev.filter(x => x !== t))}><X size={10} /></button>
                </span>
              ))}
            </div>
            <input data-testid="input-task-tags" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              placeholder="Type and press Enter..."
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
          </div>
        </div>
        <DialogFooter className="mt-4 gap-2">
          <button data-testid="btn-task-cancel" onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 text-sm transition-colors">
            Cancel
          </button>
          <button data-testid="btn-task-save" onClick={handleSave} disabled={!title.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {initialTask ? "Save Changes" : "Create Task"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
