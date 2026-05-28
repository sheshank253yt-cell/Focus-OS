import { Link } from "wouter";
import { LayoutDashboard, CalendarCheck, Wand2, Map, BarChart2, StickyNote, ArrowRight, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Work Scheduler",
    description: "Kanban boards, list view, calendar and a built-in Pomodoro timer to keep you in flow.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Wand2,
    title: "AI Tools Hub",
    description: "Curated collection of your favourite AI tools — ChatGPT, Claude, Midjourney and more.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Map,
    title: "Learning Roadmap",
    description: "Track skill trees and learning paths with progress milestones and study logs.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    description: "Visual charts for task completion, focus time, and productivity trends over time.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: StickyNote,
    title: "Notes & Journal",
    description: "Sticky notes for quick thoughts and a daily journal for deeper reflection.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Zap,
    title: "Quick Add",
    description: "Cmd+K to instantly add tasks, notes or tools from anywhere in the app.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard size={15} className="text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base">Focus OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted">
                Sign in
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5">
                Get started <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap size={11} />
            Your personal command center
          </div>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl leading-tight mb-6">
            One dashboard for{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #3B82F6, #14B8A6)" }}
            >
              everything you do
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Tasks, AI tools, learning roadmaps, focus sessions, notes and analytics —
            beautifully unified in a single dark workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                Start for free <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="flex items-center justify-center gap-2 border border-border bg-muted/40 text-foreground px-7 py-3 rounded-xl font-medium text-base hover:bg-muted transition-colors">
                Sign in to your workspace
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl mb-3">Everything in one place</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Six powerful modules, one keyboard shortcut away.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/30 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center rounded-3xl border border-border bg-card/60 backdrop-blur p-12"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(20,184,166,0.06) 100%)" }}
        >
          <h2 className="font-display font-bold text-3xl mb-3">Ready to focus?</h2>
          <p className="text-muted-foreground mb-8">
            Sign up for free and start building your productivity system today.
          </p>
          <Link href="/sign-up">
            <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              Create free account <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
