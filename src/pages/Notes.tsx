import { useState, useRef } from "react";
import { Plus, X, Download, Pin } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Note, NoteColor, JournalEntry } from "@/lib/types";

const NOTE_COLORS: { id: NoteColor; bg: string; border: string; text: string }[] = [
  { id: "yellow", bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-200" },
  { id: "blue", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-200" },
  { id: "green", bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-200" },
  { id: "pink", bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-200" },
  { id: "orange", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-200" },
];

function getNoteStyle(colour: NoteColor) {
  return NOTE_COLORS.find(c => c.id === colour) || NOTE_COLORS[0];
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-black/20 px-1 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

function today() { return new Date().toISOString().split("T")[0]; }
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function Notes() {
  const { notes, setNotes, journal, setJournal } = useApp();
  const [tab, setTab] = useState<"sticky" | "journal">("sticky");
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today());

  // Ensure today's journal entry exists
  const ensureToday = () => {
    if (!journal[today()]) {
      setJournal(prev => ({
        ...prev,
        [today()]: { date: today(), accomplishments: "", blockers: "", learnings: "", focusItems: "", freeText: "" },
      }));
    }
  };

  function addNote() {
    const newNote: Note = {
      id: `note-${Date.now()}`, title: "New note", body: "",
      colour: "yellow", pinned: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    setEditNoteId(newNote.id);
  }

  function updateNote(id: string, update: Partial<Note>) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...update, updatedAt: new Date().toISOString() } : n));
  }

  function deleteNote(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editNoteId === id) setEditNoteId(null);
  }

  function updateJournal(date: string, update: Partial<JournalEntry>) {
    setJournal(prev => ({ ...prev, [date]: { ...prev[date], ...update } }));
  }

  function exportJournal(date: string) {
    const entry = journal[date];
    if (!entry) return;
    const md = `# Journal Entry — ${fmtDate(date)}\n\n## Accomplishments\n${entry.accomplishments}\n\n## Blockers\n${entry.blockers}\n\n## Learnings\n${entry.learnings}\n\n## Tomorrow's Focus\n${entry.focusItems}\n\n---\n\n${entry.freeText}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `journal-${date}.md`;
    a.click();
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const journalDates = Object.keys(journal).sort((a, b) => b.localeCompare(a));
  const currentEntry: JournalEntry = journal[selectedDate] || { date: selectedDate, accomplishments: "", blockers: "", learnings: "", focusItems: "", freeText: "" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Notes</h1>
        {tab === "sticky" && (
          <button data-testid="btn-add-note" onClick={addNote}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={14} /> New Note
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {[{ id: "sticky", label: "Sticky Notes" }, { id: "journal", label: "Daily Journal" }].map(t => (
          <button key={t.id} data-testid={`tab-notes-${t.id}`}
            onClick={() => { setTab(t.id as typeof tab); if (t.id === "journal") ensureToday(); }}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all duration-200 font-medium
              ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* STICKY NOTES */}
      {tab === "sticky" && (
        sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg width="80" height="80" viewBox="0 0 80 80" className="mb-4 opacity-30">
              <rect x="15" y="10" width="50" height="55" rx="4" fill="currentColor" opacity="0.3" />
              <polygon points="50,10 65,10 65,25" fill="hsl(var(--primary))" opacity="0.7" />
              <rect x="24" y="30" width="32" height="3" rx="2" fill="currentColor" opacity="0.6" />
              <rect x="24" y="39" width="24" height="3" rx="2" fill="currentColor" opacity="0.4" />
            </svg>
            <p className="text-muted-foreground mb-4">No notes yet. Capture a thought.</p>
            <button onClick={addNote} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
              Create your first note
            </button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-0">
            {sortedNotes.map(note => {
              const style = getNoteStyle(note.colour);
              const isEditing = editNoteId === note.id;
              return (
                <div key={note.id} data-testid={`note-card-${note.id}`}
                  className={`break-inside-avoid mb-4 rounded-xl border p-4 transition-all duration-200 ${style.bg} ${style.border} group relative`}>
                  {/* Actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1">
                      {NOTE_COLORS.map(c => (
                        <button key={c.id} data-testid={`btn-note-color-${c.id}`}
                          onClick={() => updateNote(note.id, { colour: c.id })}
                          className={`w-3 h-3 rounded-full transition-all ${c.id === "yellow" ? "bg-yellow-400" : c.id === "blue" ? "bg-blue-400" : c.id === "green" ? "bg-green-400" : c.id === "pink" ? "bg-pink-400" : "bg-orange-400"} ${note.colour === c.id ? "ring-1 ring-white/50 scale-125" : "opacity-50 hover:opacity-100"}`} />
                      ))}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button data-testid={`btn-pin-note-${note.id}`}
                        onClick={() => updateNote(note.id, { pinned: !note.pinned })}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${note.pinned ? "text-primary" : "text-muted-foreground"}`}>
                        <Pin size={12} fill={note.pinned ? "currentColor" : "none"} />
                      </button>
                      <button data-testid={`btn-delete-note-${note.id}`}
                        onClick={() => deleteNote(note.id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-destructive">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  {isEditing ? (
                    <>
                      <input value={note.title}
                        onChange={e => updateNote(note.id, { title: e.target.value })}
                        onBlur={() => setEditNoteId(null)}
                        className={`w-full bg-transparent font-display font-semibold text-sm mb-1 outline-none border-b border-white/20 pb-1 ${style.text}`}
                        data-testid={`input-note-title-${note.id}`} autoFocus />
                      <textarea value={note.body}
                        onChange={e => updateNote(note.id, { body: e.target.value })}
                        rows={4}
                        className="w-full bg-transparent text-xs text-foreground/80 outline-none resize-none"
                        placeholder="Start writing..." data-testid={`input-note-body-${note.id}`} />
                    </>
                  ) : (
                    <div onClick={() => setEditNoteId(note.id)} className="cursor-text">
                      <p className={`font-display font-semibold text-sm mb-1 ${style.text}`}>{note.title}</p>
                      <div className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                        {note.body.split("\n").map((line, i) => (
                          <div key={i}>{renderInline(line)}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {note.updatedAt && (
                    <p className="text-[10px] text-muted-foreground mt-2 opacity-60">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* DAILY JOURNAL */}
      {tab === "journal" && (
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Past entries sidebar */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Past Entries</p>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {journalDates.map(date => (
                <button key={date} data-testid={`journal-date-${date}`}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${date === selectedDate ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
                  {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {date === today() && <span className="ml-2 text-[10px] opacity-70">Today</span>}
                </button>
              ))}
              {journalDates.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No entries yet.</p>
              )}
            </div>
          </div>

          {/* Journal entry */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">{fmtDate(selectedDate)}</h2>
              <button data-testid={`btn-export-journal-${selectedDate}`}
                onClick={() => exportJournal(selectedDate)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
                <Download size={13} /> Export .md
              </button>
            </div>

            {[
              { key: "accomplishments", label: "What did I accomplish today?", placeholder: "Shipped the new feature, finished chapter 3..." },
              { key: "blockers", label: "What blocked me?", placeholder: "Got distracted by notifications, merge conflict..." },
              { key: "learnings", label: "What did I learn?", placeholder: "Async/await is cleaner with Promise.all..." },
              { key: "focusItems", label: "Tomorrow's top 3 focus items", placeholder: "1. Write tests\n2. Review PR\n3. Deep work block" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block">{label}</label>
                <textarea
                  data-testid={`journal-${key}`}
                  value={(currentEntry as Record<string, string>)[key] || ""}
                  onChange={e => updateJournal(selectedDate, { [key]: e.target.value } as Partial<JournalEntry>)}
                  placeholder={placeholder} rows={3}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary resize-none transition-all placeholder:text-muted-foreground/50" />
              </div>
            ))}

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5 block">Free-form thoughts</label>
              <textarea data-testid="journal-freeText"
                value={currentEntry.freeText || ""}
                onChange={e => updateJournal(selectedDate, { freeText: e.target.value })}
                placeholder="Anything else on your mind..." rows={4}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary resize-none transition-all placeholder:text-muted-foreground/50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
