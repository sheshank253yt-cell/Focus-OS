import { useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { BarChart2, Timer, BookOpen, Wand2 } from "lucide-react";

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, rect.width, rect.height);
  });
  return ref;
}

const BLUE = "#3B82F6";
const TEAL = "#14B8A6";
const RED = "#EF4444";
const GRAY = "#6B7280";
const ORANGE = "#F97316";

export default function Analytics() {
  const { tasks, tools, pomodoroData, studyLogs } = useApp();

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString("en-US", { weekday: "short" }), date: fmt(d) };
  });
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (13 - i));
    return { date: fmt(d), label: i % 7 === 0 ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "" };
  });
  const last90 = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (89 - i));
    return { date: fmt(d) };
  });

  const completedByDay = last7.map(({ date }) =>
    tasks.filter(t => t.completedAt && t.completedAt.startsWith(date)).length);
  const maxBar = Math.max(...completedByDay, 1);

  const statusCounts = {
    done: tasks.filter(t => t.status === "done").length,
    inprogress: tasks.filter(t => t.status === "inprogress").length,
    overdue: tasks.filter(t => t.dueDate && t.dueDate < fmt(today) && t.status !== "done").length,
    backlog: tasks.filter(t => t.status === "backlog").length,
  };

  const studyByDay = last14.map(({ date }) =>
    studyLogs.filter(l => l.date === date).reduce((a, b) => a + b.minutes, 0) / 60);
  const maxStudy = Math.max(...studyByDay, 1);

  const topTools = [...tools].sort((a, b) => b.visitCount - a.visitCount).slice(0, 5);
  const maxVisits = Math.max(...topTools.map(t => t.visitCount), 1);

  const completedThisWeek = completedByDay.reduce((a, b) => a + b, 0);
  const pomosThisWeek = pomodoroData.sessions.filter(s =>
    last7.some(d => s.date === d.date)).length;
  const studyHoursThisWeek = studyLogs.filter(l => last7.some(d => d.date === l.date))
    .reduce((a, b) => a + b.minutes, 0) / 60;

  const heatmapData = last90.map(({ date }) =>
    tasks.filter(t => t.completedAt && t.completedAt.startsWith(date)).length);
  const maxHeat = Math.max(...heatmapData, 1);

  // Bar chart
  const barRef = useCanvas((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const padL = 32, padR = 16, padT = 16, padB = 32;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const barW = (chartW / last7.length) * 0.5;
    const gap = chartW / last7.length;

    // Gridlines
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH;
      ctx.beginPath(); ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 1;
      ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
      ctx.fillStyle = "rgba(148,163,184,0.6)"; ctx.font = "10px DM Sans, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round((i / 4) * maxBar)), padL - 4, y + 3);
    }

    completedByDay.forEach((val, i) => {
      const x = padL + i * gap + (gap - barW) / 2;
      const barH = val > 0 ? Math.max(4, (val / maxBar) * chartH) : 0;
      const y = padT + chartH - barH;
      const rd = 4;
      ctx.beginPath();
      ctx.fillStyle = BLUE + "CC";
      ctx.roundRect(x, y, barW, barH, [rd, rd, 0, 0]);
      ctx.fill();
      ctx.fillStyle = "rgba(148,163,184,0.7)"; ctx.font = "10px DM Sans, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(last7[i].label, x + barW / 2, padT + chartH + 18);
      if (val > 0) {
        ctx.fillStyle = "#F1F5F9"; ctx.fillText(String(val), x + barW / 2, y - 4);
      }
    });
  });

  // Donut chart
  const donutRef = useCanvas((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 - 10, r = Math.min(w, h) * 0.32, inner = r * 0.6;
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    if (total === 0) { ctx.fillStyle = "rgba(148,163,184,0.2)"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); return; }
    const slices = [
      { label: "Done", value: statusCounts.done, color: TEAL },
      { label: "In Progress", value: statusCounts.inprogress, color: BLUE },
      { label: "Overdue", value: statusCounts.overdue, color: RED },
      { label: "Backlog", value: statusCounts.backlog, color: GRAY },
    ].filter(s => s.value > 0);
    let angle = -Math.PI / 2;
    slices.forEach(s => {
      const sweep = (s.value / total) * Math.PI * 2;
      ctx.beginPath(); ctx.fillStyle = s.color;
      ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + sweep); ctx.closePath(); ctx.fill();
      angle += sweep;
    });
    ctx.beginPath(); ctx.fillStyle = "hsl(222,47%,15%)";
    ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#F1F5F9"; ctx.font = "bold 18px Syne, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(String(total), cx, cy + 6);
    ctx.fillStyle = "rgba(148,163,184,0.8)"; ctx.font = "10px DM Sans, sans-serif";
    ctx.fillText("tasks", cx, cy + 20);
    let legendY = h - slices.length * 16 - 4;
    slices.forEach(s => {
      ctx.fillStyle = s.color; ctx.fillRect(12, legendY - 10, 10, 10);
      ctx.fillStyle = "rgba(148,163,184,0.8)"; ctx.font = "11px DM Sans, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`${s.label} (${s.value})`, 28, legendY);
      legendY += 16;
    });
  });

  // Line chart (study hours)
  const lineRef = useCanvas((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const padL = 36, padR = 16, padT = 16, padB = 28;
    const chartW = w - padL - padR, chartH = h - padT - padB;
    const stepX = chartW / (last14.length - 1);
    const points = studyByDay.map((v, i) => ({ x: padL + i * stepX, y: padT + chartH - (v / maxStudy) * chartH }));
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (i / 4) * chartH;
      ctx.beginPath(); ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 1;
      ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
      ctx.fillStyle = "rgba(148,163,184,0.6)"; ctx.font = "10px DM Sans"; ctx.textAlign = "right";
      ctx.fillText(`${((i / 4) * maxStudy).toFixed(1)}h`, padL - 4, y + 3);
    }
    // Filled area
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, TEAL + "40"); grad.addColorStop(1, TEAL + "00");
    ctx.beginPath(); ctx.moveTo(points[0].x, padT + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padT + chartH); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    // Line
    ctx.beginPath(); ctx.strokeStyle = TEAL; ctx.lineWidth = 2; ctx.lineJoin = "round";
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    // Dots
    points.forEach((p, i) => {
      if (studyByDay[i] > 0) {
        ctx.beginPath(); ctx.fillStyle = TEAL; ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      }
    });
    // Labels
    last14.forEach(({ label }, i) => {
      if (label) {
        ctx.fillStyle = "rgba(148,163,184,0.6)"; ctx.font = "9px DM Sans"; ctx.textAlign = "center";
        ctx.fillText(label, padL + i * stepX, padT + chartH + 18);
      }
    });
  });

  // Horizontal bar (tools)
  const toolBarRef = useCanvas((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (topTools.length === 0) {
      ctx.fillStyle = "rgba(148,163,184,0.4)"; ctx.font = "12px DM Sans"; ctx.textAlign = "center";
      ctx.fillText("No tool visits yet", w / 2, h / 2); return;
    }
    const padL = 100, padR = 40, padT = 16, rowH = (h - padT) / topTools.length;
    topTools.forEach((tool, i) => {
      const y = padT + i * rowH;
      ctx.fillStyle = "rgba(148,163,184,0.8)"; ctx.font = "11px DM Sans"; ctx.textAlign = "right";
      ctx.fillText(tool.name.slice(0, 14), padL - 8, y + rowH / 2 + 4);
      const bw = ((tool.visitCount / maxVisits) * (w - padL - padR));
      const colors = [BLUE, TEAL, ORANGE, "#8B5CF6", "#EC4899"];
      ctx.beginPath(); ctx.fillStyle = colors[i % colors.length] + "CC";
      ctx.roundRect(padL, y + 4, bw, rowH - 10, 4); ctx.fill();
      if (tool.visitCount > 0) {
        ctx.fillStyle = "#F1F5F9"; ctx.font = "10px DM Sans"; ctx.textAlign = "left";
        ctx.fillText(String(tool.visitCount), padL + bw + 4, y + rowH / 2 + 4);
      }
    });
  });

  // Heatmap
  const heatRef = useCanvas((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cols = Math.ceil(last90.length / 7);
    const cellSize = Math.min(Math.floor((w - 20) / cols) - 2, 14);
    const cellGap = 2;
    const padL = 24, padT = 16;
    const dayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
    dayLabels.forEach((l, i) => {
      if (l) {
        ctx.fillStyle = "rgba(148,163,184,0.5)"; ctx.font = "9px DM Sans"; ctx.textAlign = "right";
        ctx.fillText(l, padL - 4, padT + i * (cellSize + cellGap) + cellSize - 2);
      }
    });
    // Start from Monday of 13 weeks ago
    const startDate = new Date(today);
    const dayOfWeek = startDate.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - 89 - mondayOffset);

    let col = 0, row = 0;
    for (let i = 0; i <= 89 + mondayOffset; i++) {
      const d = new Date(startDate); d.setDate(d.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      const count = tasks.filter(t => t.completedAt && t.completedAt.startsWith(ds)).length;
      const intensity = count === 0 ? 0 : Math.min(4, count);
      const x = padL + col * (cellSize + cellGap);
      const y = padT + row * (cellSize + cellGap);
      if (x + cellSize < w && y + cellSize < h) {
        ctx.beginPath(); ctx.fillStyle = intensity === 0 ? "rgba(148,163,184,0.08)" : `rgba(20,184,166,${0.2 + intensity * 0.2})`;
        ctx.roundRect(x, y, cellSize, cellSize, 2); ctx.fill();
      }
      row++;
      if (row === 7) { row = 0; col++; }
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Analytics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tasks Done (7d)", value: completedThisWeek, icon: BarChart2, color: "text-blue-400" },
          { label: "Pomodoros (7d)", value: pomosThisWeek, icon: Timer, color: "text-orange-400" },
          { label: "Study Hours (7d)", value: studyHoursThisWeek.toFixed(1) + "h", icon: BookOpen, color: "text-teal-400" },
          { label: "Tools Launched", value: tools.reduce((a, b) => a + b.visitCount, 0), icon: Wand2, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} data-testid={`analytics-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
            className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <span className="text-2xl font-display font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Row 2: bar + donut */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-sm mb-3">Tasks Completed — Last 7 Days</h3>
          <canvas ref={barRef} className="w-full h-48" style={{ display: "block" }} />
        </div>
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-sm mb-3">Task Status Breakdown</h3>
          <canvas ref={donutRef} className="w-full h-48" style={{ display: "block" }} />
        </div>
      </div>

      {/* Row 3: line + tools */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-sm mb-3">Study Hours — Last 14 Days</h3>
          <canvas ref={lineRef} className="w-full h-44" style={{ display: "block" }} />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-sm mb-3">Top 5 AI Tools by Visits</h3>
          <canvas ref={toolBarRef} className="w-full h-44" style={{ display: "block" }} />
        </div>
      </div>

      {/* Row 4: heatmap */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display font-semibold text-sm mb-3">Tasks Completed — Last 90 Days</h3>
        <canvas ref={heatRef} className="w-full h-32" style={{ display: "block" }} />
        <div className="flex items-center gap-2 mt-2 justify-end">
          <span className="text-xs text-muted-foreground">Less</span>
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: i === 0 ? "rgba(148,163,184,0.08)" : `rgba(20,184,166,${0.2 + i * 0.2})` }} />
          ))}
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
