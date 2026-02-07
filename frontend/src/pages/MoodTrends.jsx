import React, { useEffect, useState } from "react";
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

const LABEL_TO_SCORE = {
  // adapt these to your app's mood labels
  "very happy": 5,
  "happy": 4,
  "neutral": 3,
  "sad": 2,
  "very sad": 1,
  "calm": 4,
  "anxious": 2,
  "angry": 1,
  "happy": 4,
  "sad": 2,
  "neutral": 3,
  // fallback: if label not found, treat as neutral
};

function safeDate(d) {
  // input may be ISO string or already date
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch {
    return String(d);
  }
}

export default function MoodTrends() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState(null); // keep raw response for debugging
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getMoodTrends();
        console.log("📦 /api/mood/trends raw response:", res);
        setRaw(res);

        // Support either: an array returned directly OR { data: [...] } OR { count, data }
        const arr = Array.isArray(res) ? res : (res.data && Array.isArray(res.data) ? res.data : null);

        if (!arr || !arr.length) {
          setChartData(null);
          setLoading(false);
          return;
        }

        // Normalize each entry to have: { date: 'YYYY-MM-DD', score: number }
        const normalized = arr.map((item) => {
          // possible field names: date, timestamp
          const dateStr = item.date || item.timestamp || item.created_at || item.time || null;
          const date = safeDate(dateStr || item._id || Date.now());

          // score might already be present
          let score = null;
          if (typeof item.score === "number") score = item.score;
          else if (typeof item.score === "string" && !isNaN(Number(item.score))) score = Number(item.score);
          else if (item.mood) {
            const key = String(item.mood).toLowerCase();
            score = LABEL_TO_SCORE[key] ?? 3; // fallback neutral=3
          } else {
            score = 3;
          }

          return { date, score };
        });

        // Group by date and compute daily average
        const grouped = {};
        normalized.forEach((r) => {
          if (!grouped[r.date]) grouped[r.date] = [];
          grouped[r.date].push(r.score);
        });

        const labels = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
        const values = labels.map((d) => {
          const arr = grouped[d];
          return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 100) / 100; // avg rounded 2 decimals
        });

        // Chart dataset
        const data = {
          labels,
          datasets: [
            {
              label: "Mood Score",
              data: values,
              borderColor: "#8b5cf6",
              borderWidth: 3,
              tension: 0.42,
              pointRadius: 6,
              pointHoverRadius: 9,
              pointBackgroundColor: "#fff",
              pointBorderWidth: 3,
              pointBorderColor: "#8b5cf6",
              fill: true,
              backgroundColor: (ctx) => {
                const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
                g.addColorStop(0, "rgba(139,92,246,0.35)");
                g.addColorStop(1, "rgba(139,92,246,0.05)");
                return g;
              },
            },
          ],
        };

        setChartData(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load mood trends:", err);
        setError(err.message || String(err));
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 12,
        backgroundColor: "#111",
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `Avg: ${context.parsed.y}`,
        },
      },
    },
    animation: { duration: 1000, easing: "easeOutQuart" },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#6b7280" } },
      y: {
        grid: { color: "rgba(200,200,200,0.12)" },
        ticks: { color: "#6b7280" },
        beginAtZero: true,
        suggestedMax: 5,
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">📈 Mood Trends</h2>

      {loading && <p className="text-center text-gray-500 animate-pulse">Loading mood trends...</p>}

      {!loading && error && (
        <div className="text-red-600">Error loading trends: {error}</div>
      )}

      {!loading && !chartData && !error && (
        <div className="text-center text-gray-600">
          No mood data to show yet. Try creating a mood check-in first.
        </div>
      )}

      {!loading && chartData && (
        <div>
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}