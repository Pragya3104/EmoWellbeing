const API_BASE = "http://localhost:8000";

// Generic API request helper
async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("emowell_token"); 
  console.log("📤 Sending request to:", endpoint);
  console.log("🔑 Using token:", token);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }), // ✅ only attach if exists
    },
    body: body ? JSON.stringify(body) : null,
  });

  let data;
  try {
    data = await res.json();  // ✅ avoids crash if response is not JSON
  } catch {
    data = null;
  }

  if (res.status === 401) {
    console.error("❌ Unauthorized! Token invalid or expired.");
    localStorage.removeItem("emowell_token");
    window.location.replace("/login"); // ✅ safer redirect
    return;
  }

  if (!res.ok) {
    console.error("❌ API Error:", data);
    throw new Error(data?.detail || "Something went wrong");
  }

  return data;
}

// Auth APIs
export const registerUser = (data) => apiRequest("/api/auth/register", "POST", data);
export const loginUser = (data) => apiRequest("/api/auth/login", "POST", data);

// Chat API — Make sure to send { message: "your text" }
export const sendChatMessage = (message) =>
  apiRequest("/api/chat/send", "POST", { message });

// Mood API
export const submitMood = (data) => apiRequest("/api/mood/checkin", "POST", data);

// Contact API
export const sendContactMessage = (data) => apiRequest("/api/contact", "POST", data);
export const getMoodTrends = () => apiRequest("/api/mood/trends", "GET");

