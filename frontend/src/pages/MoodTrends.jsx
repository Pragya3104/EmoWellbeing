import React, { useEffect, useState, useRef } from "react";
import { getMoodTrends } from "../api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
  Legend,
  defaults,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler, Legend);
defaults.font.family = "Poppins, sans-serif";

/* ── Mood label → numeric score ── */
const LABEL_TO_SCORE = {
  "very happy": 5,
  "happy": 4,
  "calm": 4,
  "neutral": 3,
  "anxious": 2,
  "sad": 2,
  "angry": 1,
  "very sad": 1,
};

/* ── Score → readable label ── */
const SCORE_TO_LABEL = { 5: "Very Happy", 4: "Happy", 3: "Neutral", 2: "Sad", 1: "Very Sad" };

/* ── Score → colour ── */
const SCORE_COLOR = {
  5: "#22c55e",
  4: "#a78bfa",
  3: "#60a5fa",
  2: "#fb923c",
  1: "#f87171",
};

function safeDate(d) {
  try { return new Date(d).toISOString().split("T")[0]; }
  catch { return String(d); }
}

/* ── Format YYYY-MM-DD → "Feb 8" ── */
function fmtDate(str) {
  try {
    return new Date(str + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return str; }
}

const FILTERS = ["7D", "30D", "All"];

export default function MoodTrends() {
  const [allData, setAllData]   = useState([]);
  const [filter, setFilter]     = useState("30D");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const containerRef            = useRef(null);

  /* ── Auto-fit height (same as Chat.jsx) ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fit = () => {
      const rect = el.getBoundingClientRect();
      el.style.height = (window.innerHeight - rect.top) + "px";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, []);

  /* ── Fetch ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMoodTrends();
        const arr = Array.isArray(res) ? res : (res?.data ?? []);

        const normalized = arr.map((item) => {
          const dateStr = item.date || item.timestamp || item.created_at || item.time || null;
          const date = safeDate(dateStr || Date.now());

          let score = 3;
          if (typeof item.score === "number") score = item.score;
          else if (typeof item.score === "string" && !isNaN(Number(item.score))) score = Number(item.score);
          else if (item.mood) score = LABEL_TO_SCORE[String(item.mood).toLowerCase()] ?? 3;

          return { date, score };
        });

        setAllData(normalized);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Filter by window ── */
  const filtered = (() => {
    if (!allData.length) return [];
    if (filter === "All") return allData;
    const days = filter === "7D" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allData.filter((r) => new Date(r.date) >= cutoff);
  })();

  /* ── Group by date → daily average ── */
  const grouped = {};
  filtered.forEach(({ date, score }) => {
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(score);
  });
  const labels = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
  const values = labels.map((d) => {
    const scores = grouped[d];
    return Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100;
  });

  /* ── Stats ── */
  const avg  = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;
  const best = values.length ? Math.max(...values) : null;
  const worst = values.length ? Math.min(...values) : null;
  const trend = values.length >= 2
    ? values[values.length - 1] - values[values.length - 2]
    : null;

  /* ── Chart: custom gradient per-segment using canvas plugin ── */
  const chartRef = useRef(null);

  // Build a multi-stop gradient that reflects mood colours across the line
  function buildLineGradient(ctx, chartArea, dataValues) {
    if (!chartArea || dataValues.length < 2) return "#8b5cf6";
    const { left, right } = chartArea;
    const g = ctx.createLinearGradient(left, 0, right, 0);
    dataValues.forEach((v, i) => {
      const stop = i / (dataValues.length - 1);
      g.addColorStop(stop, SCORE_COLOR[Math.round(v)] || "#8b5cf6");
    });
    return g;
  }

  // Area fill — vertical purple-to-transparent
  function buildAreaGradient(ctx, chartArea) {
    if (!chartArea) return "rgba(139,92,246,0.15)";
    const { top, bottom } = chartArea;
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, "rgba(139,92,246,0.22)");
    g.addColorStop(0.6, "rgba(139,92,246,0.06)");
    g.addColorStop(1, "rgba(139,92,246,0)");
    return g;
  }

  const gradientPlugin = {
    id: "moodGradient",
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, data } = chart;
      if (!chartArea) return;
      const ds = chart.data.datasets[0];
      const vals = data.datasets[0].data;
      ds.borderColor = buildLineGradient(ctx, chartArea, vals);
      ds.backgroundColor = buildAreaGradient(ctx, chartArea);
    },
  };

  const chartData = {
    labels: labels.map(fmtDate),
    datasets: [{
      label: "Mood",
      data: values,
      borderColor: "#8b5cf6",          // overridden by plugin
      borderWidth: 3,
      tension: 0.45,
      pointRadius: values.map(() => 6),
      pointHoverRadius: 10,
      pointBackgroundColor: values.map((v) => SCORE_COLOR[Math.round(v)] || "#8b5cf6"),
      pointBorderWidth: 2.5,
      pointBorderColor: "#ffffff",
      pointHoverBorderWidth: 3,
      pointHoverBorderColor: "#ffffff",
      fill: true,
      backgroundColor: "rgba(139,92,246,0.15)", // overridden by plugin
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        padding: { top: 10, bottom: 10, left: 14, right: 14 },
        backgroundColor: "#1a1035",
        titleColor: "#e9d5ff",
        bodyColor: "#c4b5fd",
        borderColor: "rgba(168,85,247,0.3)",
        borderWidth: 1,
        titleFont: { size: 12, weight: "600", family: "Poppins, sans-serif" },
        bodyFont: { size: 12, family: "Poppins, sans-serif" },
        cornerRadius: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          title: (items) => items[0].label,
          label: (ctx) => {
            const score = ctx.parsed.y;
            const rounded = Math.round(score);
            const label = SCORE_TO_LABEL[rounded] || "Unknown";
            const emoji = { 5: "🌟", 4: "😊", 3: "😐", 2: "😢", 1: "😞" }[rounded] || "";
            return `  ${emoji}  ${label}  (${score})`;
          },
          labelColor: (ctx) => ({
            borderColor: "transparent",
            backgroundColor: SCORE_COLOR[Math.round(ctx.parsed.y)] || "#8b5cf6",
            borderRadius: 4,
          }),
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#9ca3af",
          font: { size: 11, family: "Poppins, sans-serif" },
          maxRotation: 0,
          maxTicksLimit: 9,
          padding: 8,
        },
        border: { display: false },
      },
      y: {
        min: 0.5,
        max: 5.5,
        grid: {
          color: (ctx) => {
            // Highlight the grid line at each mood level with its colour
            const v = ctx.tick?.value;
            const c = SCORE_COLOR[v];
            return c ? c + "22" : "rgba(139,92,246,0.07)";
          },
          lineWidth: (ctx) => (SCORE_COLOR[ctx.tick?.value] ? 1.5 : 1),
          drawBorder: false,
        },
        ticks: {
          color: (ctx) => SCORE_COLOR[ctx.tick?.value] || "#9ca3af",
          font: { size: 11, family: "Poppins, sans-serif", weight: "500" },
          stepSize: 1,
          padding: 10,
          callback: (v) => {
            const emoji = { 5: "🌟", 4: "😊", 3: "😐", 2: "😢", 1: "😞" }[v] || "";
            return v % 1 === 0 ? `${emoji}  ${SCORE_TO_LABEL[v] ?? ""}` : "";
          },
        },
        border: { display: false },
      },
    },
  };

  /* ── Stat card ── */
  const StatCard = ({ label, value, sub, color }) => (
    <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-[#f3e8ff]">
      <p className="text-xs text-[#9ca3af] mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-[#c4b5fd] mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div ref={containerRef} className="w-full overflow-y-auto">
      <div className="px-8 py-10 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2d1b4e]">Mood Trends</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">How you've been feeling over time</p>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 bg-white border border-[#ede9fe] rounded-xl p-1 shadow-sm">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-[#6b21a8] text-white shadow-sm"
                    : "text-[#6b21a8]/60 hover:text-[#6b21a8]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stat cards ── */}
        {!loading && !error && values.length > 0 && (
          <div className="flex gap-4">
            <StatCard
              label="Average Mood"
              value={avg}
              sub={SCORE_TO_LABEL[Math.round(avg)] || ""}
              color="#8b5cf6"
            />
            <StatCard
              label="Best Day"
              value={best}
              sub={SCORE_TO_LABEL[Math.round(best)] || ""}
              color="#22c55e"
            />
            <StatCard
              label="Lowest Day"
              value={worst}
              sub={SCORE_TO_LABEL[Math.round(worst)] || ""}
              color="#f87171"
            />
            <StatCard
              label="Trend"
              value={trend !== null ? (trend > 0 ? `↑ ${trend.toFixed(1)}` : trend < 0 ? `↓ ${Math.abs(trend).toFixed(1)}` : "→ Stable") : "—"}
              sub="vs previous day"
              color={trend > 0 ? "#22c55e" : trend < 0 ? "#f87171" : "#9ca3af"}
            />
          </div>
        )}

        {/* ── Chart card ── */}
        <div className="bg-white rounded-2xl border border-[#ede9fe] p-6" style={{ boxShadow: "0 4px 24px rgba(139,92,246,0.07), inset 0 1px 0 rgba(255,255,255,0.9)" }}>

          {loading && (
            <div className="flex flex-col items-center justify-center h-56 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#a855f7] border-t-transparent animate-spin" />
              <p className="text-sm text-[#c4b5fd]">Loading your mood data…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center h-56">
              <p className="text-sm text-red-400">Failed to load: {error}</p>
            </div>
          )}

          {!loading && !error && values.length === 0 && (
            <div className="flex flex-col items-center justify-center h-56 text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#ede9fe] flex items-center justify-center text-2xl">🌱</div>
              <p className="text-[#6b21a8] font-medium">No mood data yet</p>
              <p className="text-sm text-[#9ca3af] max-w-xs">Complete a mood check-in to start tracking how you feel over time.</p>
            </div>
          )}

          {!loading && !error && values.length > 0 && (
            <>
              {/* Mood legend — pill badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { score: 5, emoji: "🌟", label: "Very Happy" },
                  { score: 4, emoji: "😊", label: "Happy" },
                  { score: 3, emoji: "😐", label: "Neutral" },
                  { score: 2, emoji: "😢", label: "Sad" },
                  { score: 1, emoji: "😞", label: "Very Sad" },
                ].map(({ score, emoji, label }) => (
                  <div
                    key={score}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
                    style={{
                      color: SCORE_COLOR[score],
                      background: SCORE_COLOR[score] + "15",
                      borderColor: SCORE_COLOR[score] + "40",
                    }}
                  >
                    <span>{emoji}</span>
                    {label}
                  </div>
                ))}
              </div>

              <div style={{ height: "380px" }}>
                <Line
                  ref={chartRef}
                  data={chartData}
                  options={options}
                  plugins={[gradientPlugin]}
                />
              </div>
            </>
          )}
        </div>

        {/* ── Mood log list ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#ede9fe] p-6" style={{ boxShadow: "0 4px 24px rgba(139,92,246,0.07), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
            <h3 className="text-sm font-semibold text-[#4b2c82] mb-4 uppercase tracking-wide">Recent Entries</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {[...filtered].reverse().map((entry, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#f5f3ff] last:border-0">
                  <span className="text-sm text-[#6b7280]">{fmtDate(entry.date)}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: SCORE_COLOR[Math.round(entry.score)] || "#8b5cf6" }} />
                    <span className="text-sm font-medium text-[#4b2c82]">
                      {SCORE_TO_LABEL[Math.round(entry.score)] || `Score ${entry.score}`}
                    </span>
                    <span className="text-xs text-[#c4b5fd] tabular-nums">{entry.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      </div>
      </div>
  );
}