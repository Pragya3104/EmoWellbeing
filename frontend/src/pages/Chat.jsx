import React, { useState, useEffect, useRef } from "react";
import { sendChatMessage } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);      // overall request in-flight
  const [botTyping, setBotTyping] = useState(false);  // show animated dots while backend is working
  const inputRef = useRef();

  // default greeting once user loads
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          role: "bot",
          text: `Hello ${user.name}, how are you doing today? 😊`,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // typewriter simulator for bot final message
  const simulateTyping = (fullText) => {
    return new Promise((resolve) => {
      let index = 0;
      const typingInterval = 18; // ms per char
      // add final bot message as empty text (we will fill it char-by-char)
      setMessages((prev) => {
        const msg = { id: Date.now() + Math.random(), role: "bot", text: "" };
        return [...prev, msg];
      });

      const interval = setInterval(() => {
        index++;
        setMessages((prev) => {
          // update last bot message text
          const copy = [...prev];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === "bot") {
              copy[i] = { ...copy[i], text: fullText.slice(0, index) };
              break;
            }
          }
          return copy;
        });

        if (index >= fullText.length) {
          clearInterval(interval);
          resolve();
        }
      }, typingInterval);
    });
  };

  async function send() {
    if (!text.trim()) return;
    // add user message immediately
    const userMsg = { id: Date.now(), role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setText("");
    inputRef.current?.focus();

    setLoading(true);
    setBotTyping(true);

    try {
      // while waiting: show bot typing animation (we set botTyping true)
      const res = await sendChatMessage(text);
      // backend responded, stop bot dots
      setBotTyping(false);

      // now show final bot reply with typewriter animation
      const replyText = (res && (res.response || res.reply || res.data?.response)) || "I'm here with you.";
      await simulateTyping(replyText);
    } catch (err) {
      setBotTyping(false);
      // show an error bot message
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "bot", text: "Sorry — I couldn't send that. Please try again." },
      ]);
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setBotTyping(false);
    }
  }

  // handle Enter to send, Shift+Enter for newline
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) send();
    }
  }

  return (
    <div className="w-full flex justify-center py-12 px-4">
      <div className="w-full max-w-2xl card flex flex-col gap-4 min-h-[60vh]">

        {/* Inline styles for typing dots animation */}
        <style>{`
          .typing-dots {
            display:inline-flex;
            align-items:center;
            gap:4px;
            height:18px;
          }
          .typing-dots span {
            display:inline-block;
            width:6px;
            height:6px;
            border-radius:9999px;
            background:#9f7aea; /* purple tone */
            opacity:0.2;
            transform:translateY(0);
            animation: blink 1s infinite;
          }
          .typing-dots span:nth-child(1){ animation-delay:0s; }
          .typing-dots span:nth-child(2){ animation-delay:0.15s; }
          .typing-dots span:nth-child(3){ animation-delay:0.3s; }

          @keyframes blink {
            0% { opacity:0.2; transform:translateY(0); }
            30% { opacity:1; transform:translateY(-3px); }
            60% { opacity:0.4; transform:translateY(0); }
            100% { opacity:0.2; transform:translateY(0); }
          }
        `}</style>

        {/* CHAT WINDOW */}
        <div className="flex-1 overflow-auto p-4 space-y-5">

          {messages.length === 0 && (
            <div className="text-center text-[#6b21a8]/80 py-12">Start the conversation — I'm here to listen.</div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* ❤️ Bot Avatar (Custom SVG) */}
              {m.role === "bot" && (
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f3e8ff] shadow">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    className="text-[#6b21a8]"
                  >
                  <path
                    fill="none"
                    stroke="#6b21a8"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                  </svg>
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`max-w-[75%] px-4 py-3 text-[15px] rounded-2xl shadow-sm ${
                  m.role === "user"
                    ? "bg-[#ece1ff] text-[#4b2c82] rounded-br-none"
                    : "bg-white text-[#46306b] rounded-bl-none"
                }`}
              >
                {/* if this is a bot message and empty but botTyping true -> show typing dots */}
                {m.role === "bot" && m.text === "" && botTyping ? (
                  <div className="typing-dots" aria-hidden>
                    <span></span><span></span><span></span>
                  </div>
                ) : (
                  m.text
                )}
              </div>

              {/* User avatar */}
              {m.role === "user" && (
                <img
                  src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=6b21a8&color=fff&rounded=true`}
                  className="w-9 h-9 rounded-full"
                  alt="You"
                />
              )}
            </div>
          ))}

          {/* Show a live bot-dots bubble while backend is processing even if we haven't added the empty bot message in messages list */}
          {botTyping && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    stroke="#6b21a8" strokeWidth="1.2" fill="none" />
                </svg>
              </div>

              <div className="max-w-[75%] px-4 py-3 text-[15px] rounded-2xl shadow-sm bg-white text-[#46306b] rounded-bl-none">
                <div className="typing-dots" aria-hidden>
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT BAR */}
        <div className="flex gap-3 items-center p-1">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Write a message..."
            className="flex-1 p-3 border border-[#e8dfff] rounded-xl resize-none bg-white focus:outline-purple-500"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading}
            className="btn-primary px-5 py-2 rounded-xl bg-[#6b21a8] text-white hover:bg-[#591c8c]"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>

      </div>
    </div>
  );
}

