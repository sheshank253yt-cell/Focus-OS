import { Task, Project, AITool, Roadmap, Note, JournalEntry, PomodoroData, AppSettings, StudyLog } from "./types";

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
const daysAhead = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

export const SEED_PROJECTS: Project[] = [
  { id: "proj-1", name: "Personal", colour: "#3B82F6" },
  { id: "proj-2", name: "Work", colour: "#14B8A6" },
];

export const SEED_TASKS: Task[] = [
  {
    id: "task-1", title: "Review quarterly goals", description: "Go through Q2 targets and adjust priorities.", projectId: "proj-2",
    priority: "P1", status: "backlog", dueDate: daysAhead(3), dueTime: "10:00",
    estimatedHours: 1.5, tags: ["planning", "review"], recurring: "none", createdAt: daysAgo(5), completedAt: null,
  },
  {
    id: "task-2", title: "Set up dev environment", description: "Install Node 20, configure ESLint and Prettier.",
    projectId: "proj-1", priority: "P0", status: "inprogress", dueDate: fmt(today), dueTime: "14:00",
    estimatedHours: 2, tags: ["dev", "setup"], recurring: "none", createdAt: daysAgo(2), completedAt: null,
  },
  {
    id: "task-3", title: "Read Clean Code chapter 3", description: "Functions — take notes.",
    projectId: "proj-1", priority: "P2", status: "done", dueDate: daysAgo(1), dueTime: "20:00",
    estimatedHours: 1, tags: ["reading"], recurring: "none", createdAt: daysAgo(3), completedAt: daysAgo(1),
  },
];

export const SEED_TOOLS: AITool[] = [
  { id: "tool-1", name: "ChatGPT", url: "https://chat.openai.com", favicon: "https://www.google.com/s2/favicons?sz=64&domain=openai.com", category: "Writing & Content", tags: ["chat", "ai"], notes: "Best for brainstorming and drafting.", rating: 5, isPaid: false, isPinned: true, visitCount: 24, addedAt: daysAgo(10) },
  { id: "tool-2", name: "Claude", url: "https://claude.ai", favicon: "https://www.google.com/s2/favicons?sz=64&domain=claude.ai", category: "Writing & Content", tags: ["chat", "ai", "analysis"], notes: "Great for long documents and reasoning.", rating: 5, isPaid: false, isPinned: true, visitCount: 18, addedAt: daysAgo(8) },
  { id: "tool-3", name: "Midjourney", url: "https://www.midjourney.com", favicon: "https://www.google.com/s2/favicons?sz=64&domain=midjourney.com", category: "Image Generation", tags: ["image", "design"], notes: "Stunning artistic outputs.", rating: 4, isPaid: true, isPinned: true, visitCount: 7, addedAt: daysAgo(6) },
  { id: "tool-4", name: "GitHub Copilot", url: "https://github.com/features/copilot", favicon: "https://www.google.com/s2/favicons?sz=64&domain=github.com", category: "Code Assistants", tags: ["code", "autocomplete"], notes: "Indispensable for daily coding.", rating: 5, isPaid: true, isPinned: false, visitCount: 41, addedAt: daysAgo(14) },
];

export const SEED_ROADMAPS: Roadmap[] = [
  {
    id: "rm-1", title: "Web Development", goal: "Go from zero to building full-stack web apps", targetDate: daysAhead(180), colour: "#3B82F6", icon: "code",
    phases: [
      {
        id: "ph-1", title: "Fundamentals", order: 0,
        steps: [
          { id: "s-1", title: "Learn HTML basics", description: "Understand semantic HTML, forms, and accessibility.", estimatedHours: 8, status: "done", resources: [{ url: "https://developer.mozilla.org/en-US/docs/Learn/HTML", title: "MDN HTML Guide", type: "Article" }], notes: "Completed! Semantic elements are key.", order: 0 },
          { id: "s-2", title: "CSS fundamentals", description: "Box model, flexbox, grid, responsive design.", estimatedHours: 12, status: "done", resources: [], notes: "", order: 1 },
          { id: "s-3", title: "JavaScript intro", description: "Variables, functions, DOM manipulation, events.", estimatedHours: 20, status: "inprogress", resources: [{ url: "https://javascript.info", title: "javascript.info", type: "Course" }], notes: "On chapter 5 — closures.", order: 2 },
          { id: "s-4", title: "DOM manipulation", description: "Selecting elements, event listeners, AJAX.", estimatedHours: 10, status: "todo", resources: [], notes: "", order: 3 },
        ],
      },
      {
        id: "ph-2", title: "Intermediate", order: 1,
        steps: [
          { id: "s-5", title: "React basics", description: "Components, props, state, hooks.", estimatedHours: 20, status: "todo", resources: [], notes: "", order: 0 },
          { id: "s-6", title: "State management", description: "Context API, Redux Toolkit.", estimatedHours: 15, status: "todo", resources: [], notes: "", order: 1 },
          { id: "s-7", title: "Backend with Node.js", description: "Express, REST APIs, middleware.", estimatedHours: 20, status: "todo", resources: [], notes: "", order: 2 },
          { id: "s-8", title: "Databases — SQL & NoSQL", description: "PostgreSQL, MongoDB basics.", estimatedHours: 15, status: "todo", resources: [], notes: "", order: 3 },
        ],
      },
    ],
  },
];

export const SEED_NOTES: Note[] = [
  { id: "note-1", title: "Daily intentions", body: "**Focus**: One deep work block per day.\n`git commit` early and often.\nDrink water.", colour: "yellow", pinned: true, createdAt: daysAgo(2), updatedAt: daysAgo(1) },
  { id: "note-2", title: "Book ideas", body: "- The Pragmatic Programmer\n- A Philosophy of Software Design\n- Staff Engineer", colour: "blue", pinned: false, createdAt: daysAgo(4), updatedAt: daysAgo(4) },
];

export const SEED_JOURNAL: Record<string, JournalEntry> = {
  [fmt(today)]: { date: fmt(today), accomplishments: "", blockers: "", learnings: "", focusItems: "", freeText: "" },
  [daysAgo(1)]: { date: daysAgo(1), accomplishments: "Finished the CSS chapter, reviewed sprint goals.", blockers: "Got distracted by notifications.", learnings: "Flexbox gap property is a game changer.", focusItems: "1. Start JS chapter\n2. 30min run\n3. Review goals", freeText: "Good productive day overall." },
  [daysAgo(2)]: { date: daysAgo(2), accomplishments: "Set up dev environment, read 20 pages of Clean Code.", blockers: "Node version conflicts took 45 min.", learnings: "nvm makes Node management painless.", focusItems: "1. CSS study session\n2. Team meeting prep\n3. Exercise", freeText: "" },
};

export const SEED_POMODORO: PomodoroData = {
  sessions: [],
  settings: { workDuration: 25, shortBreak: 5, longBreak: 15, soundEnabled: true },
};

export const SEED_SETTINGS: AppSettings = {
  theme: "dark", accent: "#3B82F6", sidebarExpanded: true, userName: "Alex",
};

export const SEED_STUDY_LOGS: StudyLog[] = [
  { id: "sl-1", roadmapId: "rm-1", date: daysAgo(1), minutes: 90 },
  { id: "sl-2", roadmapId: "rm-1", date: daysAgo(2), minutes: 60 },
  { id: "sl-3", roadmapId: "rm-1", date: daysAgo(4), minutes: 45 },
  { id: "sl-4", roadmapId: "rm-1", date: daysAgo(5), minutes: 120 },
  { id: "sl-5", roadmapId: "rm-1", date: daysAgo(6), minutes: 30 },
];

export function seedIfNeeded() {
  if (localStorage.getItem("dashboard_seeded")) return;
  localStorage.setItem("dashboard_projects", JSON.stringify(SEED_PROJECTS));
  localStorage.setItem("dashboard_tasks", JSON.stringify(SEED_TASKS));
  localStorage.setItem("dashboard_tools", JSON.stringify(SEED_TOOLS));
  localStorage.setItem("dashboard_roadmaps", JSON.stringify(SEED_ROADMAPS));
  localStorage.setItem("dashboard_notes", JSON.stringify(SEED_NOTES));
  localStorage.setItem("dashboard_journal", JSON.stringify(SEED_JOURNAL));
  localStorage.setItem("dashboard_pomodoro", JSON.stringify(SEED_POMODORO));
  localStorage.setItem("dashboard_settings", JSON.stringify(SEED_SETTINGS));
  localStorage.setItem("dashboard_study_logs", JSON.stringify(SEED_STUDY_LOGS));
  localStorage.setItem("dashboard_seeded", "1");
}
