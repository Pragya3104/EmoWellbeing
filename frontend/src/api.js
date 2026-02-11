const API_BASE = "http://localhost:8000";

/* ---------------------------
   Core request helper
---------------------------- */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("emowell_token");

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(options.body && { body: options.body }),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (res.status === 401) {
    console.error("❌ Unauthorized. Clearing session.");
    localStorage.removeItem("emowell_token");
    localStorage.removeItem("emowell_user");
    window.location.replace("/login");
    throw new Error("Session expired");
  }

  if (!res.ok) {
    throw new Error(data?.detail || "Request failed");
  }

  return data;
}

/* ---------------------------
   AUTH
---------------------------- */

// ✅ REGISTER
export const registerUser = (data) =>
  apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ✅ LOGIN (OAuth2 form)
export const loginUser = async ({ email, password }) => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.detail || "Login failed");
  }

  localStorage.setItem("emowell_token", data.access_token);
  localStorage.setItem("emowell_user", JSON.stringify(data.user));

  return data;
};

// ✅ LOGOUT
export const logoutUser = async () => {
  await apiRequest("/api/auth/logout", { method: "POST" });
  localStorage.removeItem("emowell_token");
  localStorage.removeItem("emowell_user");
};

// ✅ REFRESH TOKEN
export const refreshToken = async () => {
  const res = await apiRequest("/api/auth/refresh", { method: "POST" });
  localStorage.setItem("emowell_token", res.access_token);
  return res.access_token;
};

/* ---------------------------
   MOOD
---------------------------- */
export const submitMood = (data) =>
  apiRequest("/api/mood/checkin", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMoodTrends = () =>
  apiRequest("/api/mood/trends");

/* ---------------------------
   CONTACT
---------------------------- */
export const sendContactMessage = (data) =>
  apiRequest("/api/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });

/* ---------------------------
   Chat History
---------------------------- */
export const getChatHistory = () =>
  apiRequest("/api/chat/history");


export const createConversation = () =>
  apiRequest("/api/chat/conversation", { method: "POST" });

export const getConversations = () =>
  apiRequest("/api/chat/conversations");

export const getMessages = (id) =>
  apiRequest(`/api/chat/conversation/${id}`);

export const sendChatMessage = (conversationId, message) =>
  apiRequest(`/api/chat/send?conversation_id=${conversationId}`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
