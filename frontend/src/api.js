const API_BASE = "http://localhost:8000";

/* ---------------------------
   Token refresh state
---------------------------- */
let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function attemptTokenRefresh() {
  if (isRefreshing) {
    return new Promise((resolve) => refreshSubscribers.push(resolve));
  }
  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    const newToken = data.access_token;
    localStorage.setItem("emowell_token", newToken);
    onTokenRefreshed(newToken);
    return newToken;
  } catch {
    localStorage.removeItem("emowell_token");
    localStorage.removeItem("emowell_user");
    window.location.replace("/login");
    throw new Error("Session expired");
  } finally {
    isRefreshing = false;
  }
}

/* ---------------------------
   Core request helper
---------------------------- */
export async function apiRequest(endpoint, options = {}, _retry = false) {
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
  try { data = await res.json(); } catch {}

  if (res.status === 401 && !_retry) {
    try {
      await attemptTokenRefresh();
      return apiRequest(endpoint, options, true);
    } catch {
      throw new Error("Session expired");
    }
  }

  if (res.status === 401 && _retry) {
    localStorage.removeItem("emowell_token");
    localStorage.removeItem("emowell_user");
    window.location.replace("/login");
    throw new Error("Session expired");
  }

  if (!res.ok) throw new Error(data?.detail || "Request failed");

  return data;
}

/* ---------------------------
   AUTH
---------------------------- */
export const registerUser = (data) =>
  apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(data) });

export const loginUser = async ({ email, password }) => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail || "Login failed");
  localStorage.setItem("emowell_token", data.access_token);
  localStorage.setItem("emowell_user", JSON.stringify(data.user));
  return data;
};

export const logoutUser = async () => {
  await apiRequest("/api/auth/logout", { method: "POST" });
  localStorage.removeItem("emowell_token");
  localStorage.removeItem("emowell_user");
};

export const refreshToken = async () => {
  const res = await apiRequest("/api/auth/refresh", { method: "POST" });
  localStorage.setItem("emowell_token", res.access_token);
  return res.access_token;
};

export const updateProfile   = (data) => apiRequest("/api/auth/profile",  { method: "PATCH",  body: JSON.stringify(data) });
export const changePassword  = (data) => apiRequest("/api/auth/password", { method: "PATCH",  body: JSON.stringify(data) });
export const deleteAccount   = ()     => apiRequest("/api/auth/account",  { method: "DELETE" });
export const getWellnessTip  = ()     => apiRequest("/api/auth/tip");

/* ---------------------------
   MOOD
---------------------------- */
export const submitMood    = (data) => apiRequest("/api/mood/checkin", { method: "POST", body: JSON.stringify(data) });
export const getMoodTrends = ()     => apiRequest("/api/mood/trends");

/* ---------------------------
   CONTACT
---------------------------- */
export const sendContactMessage = (data) =>
  apiRequest("/api/contact", { method: "POST", body: JSON.stringify(data) });

/* ---------------------------
   CHAT
---------------------------- */
export const getChatHistory     = ()        => apiRequest("/api/chat/history");
export const createConversation = ()        => apiRequest("/api/chat/conversation", { method: "POST" });
export const getConversations   = ()        => apiRequest("/api/chat/conversations");
export const getMessages        = (id)      => apiRequest(`/api/chat/conversation/${id}`);
export const deleteConversation = (id)      => apiRequest(`/api/chat/conversation/${id}`, { method: "DELETE" });
export const sendChatMessage    = (cid, msg) =>
  apiRequest(`/api/chat/send?conversation_id=${cid}`, { method: "POST", body: JSON.stringify({ message: msg }) });