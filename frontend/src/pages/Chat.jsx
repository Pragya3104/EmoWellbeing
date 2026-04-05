import React, { useState, useEffect, useRef } from "react";
import {
  createConversation,
  getConversations,
  getMessages,
  sendChatMessage,
  deleteConversation,
} from "../api";
import { useAuth } from "../context/AuthContext";

/* ================= TYPEWRITER COMPONENT ================= */
function TypewriterText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    if (!text) return;

    const speed = text.length > 300 ? 12 : text.length > 150 ? 18 : 22;

    const tick = () => {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayed(text.slice(0, indexRef.current));
        timer = setTimeout(tick, speed);
      } else {
        setDone(true);
        onDone?.();
      }
    };

    let timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            background: "#6b21a8",
            marginLeft: "2px",
            verticalAlign: "text-bottom",
            animation: "cursorBlink 0.7s steps(1) infinite",
          }}
        />
      )}
    </span>
  );
}

/* ================= CURSOR BLINK KEYFRAMES ================= */
const cursorBlinkStyle = `
  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

export default function Chat() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const bottomRef = useRef(null);
  const chatRef = useRef(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  /* ================= AUTO-FIT HEIGHT ================= */
  // Detects available screen space dynamically and sets container height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const fit = () => {
      const rect = el.getBoundingClientRect();
      const available = window.innerHeight - rect.top;
      el.style.height = available + "px";
    };

    fit();

    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    window.addEventListener("resize", fit);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  /* ================= LOAD CONVERSATIONS ================= */
  useEffect(() => {
    async function load() {
      try {
        const data = await getConversations();
        setConversations(data);

        if (data.length > 0) {
          setActiveId(data[0].id);
        } else {
          const convo = await createConversation();
          setConversations([convo]);
          setActiveId(convo.id);
        }
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!activeId) return;

    async function loadMessages() {
      try {
        const data = await getMessages(activeId);

        const formatted = [];
        data.forEach((m) => {
          formatted.push({
            id: `${m.id}-u`,
            role: "user",
            text: m.message,
          });

          // FIX 3: Only push bot message if response is non-null/non-empty
          if (m.response) {
            formatted.push({
              id: `${m.id}-b`,
              role: "bot",
              text: m.response,
            });
          }
        });

        setMessages(formatted);
      } catch (err) {
        console.error(err);
      }
    }

    loadMessages();
  }, [activeId]);

  /* ================= SMART SCROLL ================= */
  const isUserScrollingRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  // Detect if user has manually scrolled up
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const handleScroll = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      isUserScrollingRef.current = !isNearBottom;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Only scroll when a NEW message is added, not on initial load
  useEffect(() => {
    const prevCount = lastMessageCountRef.current;
    const newCount = messages.length;
    lastMessageCountRef.current = newCount;

    // Skip on initial load (prevCount === 0 and newCount > 1 means history loaded)
    if (prevCount === 0 && newCount > 1) return;

    // Don't scroll if user has manually scrolled up
    if (isUserScrollingRef.current) return;

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= AUTO-RESIZE TEXTAREA ================= */
  // FIX 5: Auto-resize textarea as user types
  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  /* ================= NEW CHAT ================= */
  const handleNewChat = async () => {
    // FIX 7: Clear messages immediately before async call to avoid stale flash
    setMessages([]);
    const convo = await createConversation();
    setConversations((prev) => [convo, ...prev]);
    setActiveId(convo.id);
  };

  /* ================= DELETE CHAT ================= */
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      try {
        await deleteConversation(id);
        const updated = conversations.filter((c) => c.id !== id);
        setConversations(updated);
        setConfirmDeleteId(null);

        if (activeId === id) {
          if (updated.length > 0) {
            setActiveId(updated[0].id);
          } else {
            setMessages([]);
            const convo = await createConversation();
            setConversations([convo]);
            setActiveId(convo.id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  /* ================= SEND MESSAGE ================= */
  const send = async () => {
    if (!text.trim() || !activeId) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setText("");

    // FIX 5: Reset textarea height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setLoading(true);

    try {
      const res = await sendChatMessage(activeId, text);

      // FIX 3: Only push bot message if response exists
      if (res.response) {
        const botId = Date.now() + 1;
        setTypingMessageId(botId);
        setMessages((prev) => [
          ...prev,
          {
            id: botId,
            role: "bot",
            text: res.response,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ENTER TO SEND ================= */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  /* ================= USER AVATAR INITIAL ================= */
  // FIX 6: Fallback to "U" if user name is undefined
  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <>
      <style>{cursorBlinkStyle}</style>
      <div ref={containerRef} className="flex w-full overflow-hidden bg-[#f8f7ff]">

      {/* ================= SIDEBAR ================= */}
      <div className="w-72 bg-white/70 backdrop-blur-xl border-r border-white/40 p-5 flex flex-col shadow-lg">

        <button
          onClick={handleNewChat}
          className="mb-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md"
        >
          + New Chat
        </button>

        <div className="text-xs text-[#6b21a8]/60 mb-2">RECENT</div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => { setHoveredId(null); setConfirmDeleteId(null); }}
              className={`group p-3 rounded-xl cursor-pointer transition flex items-center justify-between gap-2 ${
                c.id === activeId
                  ? "bg-[#ede9fe]"
                  : "hover:bg-[#f3e8ff]"
              }`}
            >
              <div className="text-sm font-medium text-[#4b2c82] truncate flex-1">
                {c.title || "New Chat"}
              </div>

              {/* DELETE BUTTON — visible on hover */}
              {hoveredId === c.id && (
                <button
                  onClick={(e) => handleDelete(e, c.id)}
                  title={confirmDeleteId === c.id ? "Click again to confirm" : "Delete chat"}
                  className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all text-xs
                    ${confirmDeleteId === c.id
                      ? "bg-red-500 text-white scale-110"
                      : "bg-white/60 text-[#6b21a8]/50 hover:bg-red-100 hover:text-red-500"
                    }`}
                >
                  {confirmDeleteId === c.id ? "✓" : "🗑"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= CHAT ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ================= MESSAGES ================= */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-8 pt-8 pb-8 space-y-6"
          style={{ minHeight: 0 }}
        >

          {/* EMPTY STATE */}
          {/* FIX 1: Wrap empty state in a container that fills available height */}
          {messages.length === 0 && !loading && (
            <div
              style={{ flex: 1 }}
              className="flex flex-col items-center justify-center text-center"
            >

              <div className="w-14 h-14 rounded-xl bg-[#ede9fe] flex items-center justify-center mb-4 shadow-sm">
                ✨
              </div>

              <h2 className="text-xl font-semibold text-[#2d1b4e] mb-2">
                How can I help you today?
              </h2>

              <p className="text-sm text-[#6b21a8]/70 mb-6 max-w-md">
                I'm here to listen, support, and help you navigate your emotions.
                Everything shared here is a safe space.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {[
                  "I'm feeling anxious",
                  "Help me relax",
                  "I need motivation",
                  "Just want to talk",
                ].map((t) => (
                  <button
                    key={t}
                    onClick={async () => {
                      if (!activeId) return;
                      const userMessage = { id: Date.now(), role: "user", text: t };
                      setMessages([userMessage]);
                      setLoading(true);
                      try {
                        const res = await sendChatMessage(activeId, t);
                        if (res.response) {
                          setMessages((prev) => [
                            ...prev,
                            { id: Date.now() + 1, role: "bot", text: res.response, isNew: true },
                          ]);
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-white border border-[#e9d5ff] shadow-sm hover:shadow-md hover:border-[#a855f7] hover:text-[#6b21a8] transition-all duration-200"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGES */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "bot" && (
                <div className="w-10 h-10 rounded-xl bg-[#ede9fe] flex items-center justify-center shadow-sm flex-shrink-0">
                  💜
                </div>
              )}

              <div
                className={`max-w-[65%] px-5 py-3 rounded-2xl ${
                  m.role === "user"
                    ? "bg-[#6b21a8] text-white shadow-[0_8px_30px_rgba(107,33,168,0.12)]"
                    : "bg-white/80 backdrop-blur border border-white/40 text-[#46306b] shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
                }`}
              >
                {m.role === "bot" && m.id === typingMessageId ? (
                  <TypewriterText
                    text={m.text}
                    onDone={() => setTypingMessageId(null)}
                  />
                ) : (
                  m.text
                )}
              </div>

              {m.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-[#6b21a8] text-white flex items-center justify-center shadow-md flex-shrink-0">
                  {/* FIX 6: Safe user initial with fallback */}
                  {userInitial}
                </div>
              )}
            </div>
          ))}

          {/* FIX 4: Typing / loading indicator while waiting for bot response */}
          {loading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-10 h-10 rounded-xl bg-[#ede9fe] flex items-center justify-center shadow-sm flex-shrink-0">
                💜
              </div>
              <div className="bg-white/80 backdrop-blur border border-white/40 text-[#46306b] shadow-[0_8px_30px_rgba(0,0,0,0.05)] px-5 py-3 rounded-2xl flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full bg-[#6b21a8]/40 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-[#6b21a8]/40 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-[#6b21a8]/40 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ================= FIXED INPUT ================= */}
        <div className="flex-shrink-0 p-6 flex justify-center bg-gradient-to-t from-white via-white/80 to-transparent">

          <div className="w-full max-w-3xl flex items-end gap-3 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-4 py-2 border border-transparent transition-all duration-300 hover:border-[#a855f7]/40 hover:shadow-[0_0_0_4px_rgba(168,85,247,0.12),0_10px_40px_rgba(107,33,168,0.15)] focus-within:border-[#a855f7]/60 focus-within:shadow-[0_0_0_4px_rgba(168,85,247,0.18),0_10px_40px_rgba(107,33,168,0.2)]">

            {/* FIX 5: Auto-resizing textarea with ref */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="flex-1 justify-center bg-transparent outline-none resize-none text-sm py-2 pb-3 max-h-[120px] overflow-y-auto"
              placeholder="Share what's on your mind..."
              rows={1}
            />

            <button
              onClick={send}
              disabled={loading || !text.trim()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#6b21a8] text-white hover:bg-[#591c8c] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity mb-1 flex-shrink-0"
            >
              ➤
            </button>

          </div>
        </div>

      </div>
    </div>
    </>
  );
}