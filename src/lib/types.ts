export type Priority = "P0" | "P1" | "P2" | "P3";
export type TaskStatus = "backlog" | "inprogress" | "review" | "done";
export type RecurringType = "none" | "daily" | "weekly" | "monthly";
export type StepStatus = "todo" | "inprogress" | "done";
export type NoteColor = "yellow" | "blue" | "green" | "pink" | "orange";
export type ResourceType = "Article" | "Video" | "Course" | "Book";

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  dueTime: string;
  estimatedHours: number;
  tags: string[];
  recurring: RecurringType;
  createdAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  colour: string;
}

export interface AITool {
  id: string;
  name: string;
  url: string;
  favicon: string;
  category: string;
  tags: string[];
  notes: string;
  rating: number;
  isPaid: boolean;
  isPinned: boolean;
  visitCount: number;
  addedAt: string;
}

export interface Resource {
  url: string;
  title: string;
  type: ResourceType;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  status: StepStatus;
  resources: Resource[];
  notes: string;
  order: number;
}

export interface Phase {
  id: string;
  title: string;
  order: number;
  steps: Step[];
}

export interface Roadmap {
  id: string;
  title: string;
  goal: string;
  targetDate: string;
  colour: string;
  icon: string;
  phases: Phase[];
}

export interface Note {
  id: string;
  title: string;
  body: string;
  colour: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  date: string;
  accomplishments: string;
  blockers: string;
  learnings: string;
  focusItems: string;
  freeText: string;
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  taskName: string;
  date: string;
  completedAt: string;
}

export interface PomodoroSettings {
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  soundEnabled: boolean;
}

export interface PomodoroData {
  sessions: PomodoroSession[];
  settings: PomodoroSettings;
}

export interface AppSettings {
  theme: "dark" | "light";
  accent: string;
  sidebarExpanded: boolean;
  userName: string;
}

export interface StudyLog {
  id: string;
  roadmapId: string;
  date: string;
  minutes: number;
}
