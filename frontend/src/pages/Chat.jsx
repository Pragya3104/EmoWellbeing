import React, { useState, useEffect, useRef } from "react";
import {
  createConversation,
  getConversations,
  getMessages,
  sendChatMessage,
} from "../api";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

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

          formatted.push({
            id: `${m.id}-b`,
            role: "bot",
            text: m.response,
          });
        });

        setMessages(formatted);
      } catch (err) {
        console.error(err);
      }
    }

    loadMessages();
  }, [activeId]);

  /* ================= AUTO SCROLL (CHAT BOX ONLY) ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= NEW CHAT ================= */
  const handleNewChat = async () => {
    const convo = await createConversation();
    setConversations((prev) => [convo, ...prev]);
    setActiveId(convo.id);
    setMessages([]);
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
    setLoading(true);

    try {
      const res = await sendChatMessage(activeId, text);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: res.response,
        },
      ]);
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

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#f3e8ff] via-white to-[#ede9fe]">

      {/* ================= SIDEBAR ================= */}
      <div className="w-72 bg-white/60 backdrop-blur-xl border-r border-white/40 p-5 flex flex-col">

        <button
          onClick={handleNewChat}
          className="mb-6 py-2 rounded-xl bg-[#6b21a8] text-white hover:bg-[#591c8c]"
        >
          + New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`p-3 rounded-xl cursor-pointer transition ${
                c.id === activeId
                  ? "bg-[#ede9fe]"
                  : "hover:bg-[#f3e8ff]"
              }`}
            >
              <div className="text-sm font-medium text-[#4b2c82] truncate">
                {c.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="flex-1 flex flex-col">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {messages.length === 0 && (
            <div className="text-center text-[#6b21a8]/70 mt-20">
              Start a conversation 💜
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Bot Avatar */}
              {m.role === "bot" && (
                <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" className="text-[#6b21a8]"><path fill="none" stroke="#6b21a8" strokeWidth="1.6"strokeLinecap="round" strokeLinejoin="round" className="shrink-0" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </div>
              )}

              <div
                className={`max-w-[60%] px-5 py-3 rounded-2xl shadow ${
                  m.role === "user"
                    ? "bg-[#6b21a8] text-white"
                    : "bg-white text-[#46306b]"
                }`}
              >
                {m.text}
              </div>

              {/* User Avatar */}
              {m.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-[#6b21a8] text-white flex items-center justify-center">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t bg-white/50 backdrop-blur-xl flex gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-4 rounded-xl border resize-none"
            placeholder="Type your message..."
          />

          <button
            onClick={send}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-[#6b21a8] text-white hover:bg-[#591c8c]"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
