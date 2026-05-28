import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CheckSquare, Wand2, StickyNote, Map } from "lucide-react";
import TaskModal from "@/components/TaskModal";
import ToolModal from "@/components/ToolModal";
import { useApp } from "@/contexts/AppContext";
import { Note } from "@/lib/types";

interface QuickAddProps {
  open: boolean;
  onClose: () => void;
}

type AddMode = null | "task" | "tool" | "note";

export default function QuickAdd({ open, onClose }: QuickAddProps) {
  const [mode, setMode] = useState<AddMode>(null);
  const { notes, setNotes } = useApp();

  function handleClose() {
    setMode(null);
    onClose();
  }

  function addNote() {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "New note",
      body: "",
      colour: "yellow",
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    handleClose();
  }

  if (mode === "task") return <TaskModal open onClose={handleClose} />;
  if (mode === "tool") return <ToolModal open onClose={handleClose} />;

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-sm bg-card border-border" data-testid="modal-quick-add">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Quick Add</DialogTitle>
          <p className="text-sm text-muted-foreground">What would you like to create?</p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {[
            { icon: CheckSquare, label: "Task", sub: "Add to scheduler", color: "text-blue-400", onClick: () => setMode("task") },
            { icon: Wand2, label: "AI Tool", sub: "Save a new tool", color: "text-purple-400", onClick: () => setMode("tool") },
            { icon: StickyNote, label: "Note", sub: "Sticky or journal", color: "text-yellow-400", onClick: addNote },
            { icon: Map, label: "Roadmap", sub: "Start a new path", color: "text-teal-400", onClick: handleClose },
          ].map(({ icon: Icon, label, sub, color, onClick }) => (
            <button
              key={label}
              data-testid={`btn-quick-${label.toLowerCase()}`}
              onClick={onClick}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-muted/40 hover:bg-muted hover:border-primary/40 transition-all duration-200 text-left group"
            >
              <Icon size={22} className={`${color} group-hover:scale-110 transition-transform`} />
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-muted-foreground">{sub}</div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> to close</p>
      </DialogContent>
    </Dialog>
  );
}
