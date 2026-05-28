import { createContext, useContext, useEffect, ReactNode } from "react";
import { useLocalStorage } from "../lib/storage";
import {
  Task, Project, AITool, Roadmap, Note, JournalEntry,
  PomodoroData, AppSettings, StudyLog
} from "../lib/types";
import {
  SEED_PROJECTS, SEED_TASKS, SEED_TOOLS, SEED_ROADMAPS,
  SEED_NOTES, SEED_JOURNAL, SEED_POMODORO, SEED_SETTINGS, SEED_STUDY_LOGS
} from "../lib/seed";

interface AppContextType {
  tasks: Task[];
  setTasks: (v: Task[] | ((p: Task[]) => Task[])) => void;
  projects: Project[];
  setProjects: (v: Project[] | ((p: Project[]) => Project[])) => void;
  tools: AITool[];
  setTools: (v: AITool[] | ((p: AITool[]) => AITool[])) => void;
  roadmaps: Roadmap[];
  setRoadmaps: (v: Roadmap[] | ((p: Roadmap[]) => Roadmap[])) => void;
  notes: Note[];
  setNotes: (v: Note[] | ((p: Note[]) => Note[])) => void;
  journal: Record<string, JournalEntry>;
  setJournal: (v: Record<string, JournalEntry> | ((p: Record<string, JournalEntry>) => Record<string, JournalEntry>)) => void;
  pomodoroData: PomodoroData;
  setPomodoroData: (v: PomodoroData | ((p: PomodoroData) => PomodoroData)) => void;
  settings: AppSettings;
  setSettings: (v: AppSettings | ((p: AppSettings) => AppSettings)) => void;
  studyLogs: StudyLog[];
  setStudyLogs: (v: StudyLog[] | ((p: StudyLog[]) => StudyLog[])) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const p = `focus_${userId}_`;

  const [tasks, setTasks] = useLocalStorage<Task[]>(`${p}tasks`, SEED_TASKS);
  const [projects, setProjects] = useLocalStorage<Project[]>(`${p}projects`, SEED_PROJECTS);
  const [tools, setTools] = useLocalStorage<AITool[]>(`${p}tools`, SEED_TOOLS);
  const [roadmaps, setRoadmaps] = useLocalStorage<Roadmap[]>(`${p}roadmaps`, SEED_ROADMAPS);
  const [notes, setNotes] = useLocalStorage<Note[]>(`${p}notes`, SEED_NOTES);
  const [journal, setJournal] = useLocalStorage<Record<string, JournalEntry>>(`${p}journal`, SEED_JOURNAL);
  const [pomodoroData, setPomodoroData] = useLocalStorage<PomodoroData>(`${p}pomodoro`, SEED_POMODORO);
  const [settings, setSettings] = useLocalStorage<AppSettings>(`${p}settings`, SEED_SETTINGS);
  const [studyLogs, setStudyLogs] = useLocalStorage<StudyLog[]>(`${p}study_logs`, SEED_STUDY_LOGS);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", hexToHsl(settings.accent));
    document.documentElement.style.setProperty("--primary", hexToHsl(settings.accent));
  }, [settings.accent]);

  return (
    <AppContext.Provider value={{
      tasks, setTasks, projects, setProjects, tools, setTools,
      roadmaps, setRoadmaps, notes, setNotes, journal, setJournal,
      pomodoroData, setPomodoroData, settings, setSettings,
      studyLogs, setStudyLogs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "217 91% 60%";
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
