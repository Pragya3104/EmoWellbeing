import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, changePassword, deleteAccount, getWellnessTip } from "../api";

const styles = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.85); opacity: 0; }
    60%  { transform: scale(1.05); }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .field-input {
    width: 100%;
    background: #faf8ff;
    border: 1.5px solid #ede9fe;
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 14px;
    color: #2d1b4e;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field-input:focus {
    border-color: #a855f7;
    box-shadow: 0 0 0 3px rgba(168,85,247,0.12);
  }
  .field-input:disabled {
    background: #f5f3ff;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const THEMES = [
  { id: "purple", label: "Lavender", color: "#7c3aed" },
  { id: "rose",   label: "Rose",     color: "#e11d48" },
  { id: "sky",    label: "Sky",      color: "#0284c7" },
  { id: "teal",   label: "Teal",     color: "#0d9488" },
  { id: "amber",  label: "Amber",    color: "#d97706" },
];

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{label}</label>
        {hint && <span className="text-[10px] text-[#c4b5fd]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, icon, delay = 0, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#f3e8ff] p-6 space-y-5"
      style={{ animation: `fadeSlideUp 0.45s ${delay}s ease both`, opacity: 0, boxShadow: "0 4px 24px rgba(139,92,246,0.06)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-bold text-[#2d1b4e] uppercase tracking-wide">{title}</h3>
      </div>
      <div className="h-px bg-gradient-to-r from-[#ede9fe] to-transparent" />
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: value ? "#7c3aed" : "#e5e7eb" }}>
      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
        style={{ left: value ? "22px" : "2px" }} />
    </button>
  );
}

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,7,30,0.55)", animation: "overlayIn 0.2s ease both", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#f3e8ff] p-6 space-y-5"
        style={{ animation: "modalIn 0.25s ease both", boxShadow: "0 24px 60px rgba(107,33,168,0.18)" }}>
        {children}
      </div>
    </div>
  );
}

function Banner({ type, msg }) {
  const cls = type === "success"
    ? "bg-green-50 border-green-200 text-green-700"
    : "bg-red-50 border-red-200 text-red-500";
  return (
    <div className={`flex items-center gap-3 border rounded-2xl px-5 py-3.5 text-sm ${cls}`}
      style={{ animation: "successPop 0.35s ease both" }}>
      <span>{type === "success" ? "✅" : "⚠️"}</span>
      <span dangerouslySetInnerHTML={{ __html: msg }} />
    </div>
  );
}

/* ── Change Password Modal ── */
function ChangePasswordModal({ onClose }) {
  const [oldPw, setOldPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [confPw, setConfPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const [done, setDone]     = useState(false);
  const [show, setShow]     = useState({ old: false, new: false, conf: false });

  const strength = (() => {
    if (!newPw) return 0;
    return [newPw.length >= 8, /[A-Z]/.test(newPw), /[0-9]/.test(newPw), /[^A-Za-z0-9]/.test(newPw)].filter(Boolean).length;
  })();
  const strengthColor = ["", "#f87171", "#fb923c", "#facc15", "#4ade80"][strength];
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];

  const submit = async () => {
    if (!oldPw || !newPw || !confPw) { setError("All fields are required."); return; }
    if (newPw !== confPw)            { setError("New passwords do not match."); return; }
    setSaving(true); setError(null);
    try {
      await changePassword({ old_password: oldPw, new_password: newPw, confirm_password: confPw });
      setDone(true);
      setTimeout(onClose, 2200);
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally { setSaving(false); }
  };

  const PwInput = ({ id, label, value, onChange }) => (
    <Field label={label}>
      <div className="relative">
        <input type={show[id] ? "text" : "password"} className="field-input pr-16"
          value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" />
        <button type="button" onClick={() => setShow(s => ({ ...s, [id]: !s[id] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#a855f7] hover:text-[#6b21a8]">
          {show[id] ? "HIDE" : "SHOW"}
        </button>
      </div>
    </Field>
  );

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-lg">🔑</span><h2 className="text-base font-bold text-[#2d1b4e]">Change Password</h2></div>
        <button onClick={onClose} className="text-[#c4b5fd] hover:text-[#7c3aed] text-2xl leading-none">×</button>
      </div>
      <div className="h-px bg-[#f3e8ff]" />
      {done ? <Banner type="success" msg="<strong>Password updated!</strong> Other devices have been signed out." /> : <>
        {error && <Banner type="error" msg={error} />}
        <PwInput id="old"  label="Current Password"     value={oldPw}  onChange={setOldPw}  />
        <PwInput id="new"  label="New Password"          value={newPw}  onChange={setNewPw}  />
        {newPw && (
          <div className="space-y-1 -mt-2">
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ background: i <= strength ? strengthColor : "#f3e8ff" }} />
              ))}
            </div>
            <p className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
          </div>
        )}
        <PwInput id="conf" label="Confirm New Password"  value={confPw} onChange={setConfPw} />
        <button onClick={submit} disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#7c3aed,#6b21a8)", boxShadow: "0 6px 20px rgba(107,33,168,0.25)", opacity: saving ? 0.7 : 1 }}>
          {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</span> : "Update Password"}
        </button>
      </>}
    </Modal>
  );
}

/* ── Delete Account Modal ── */
function DeleteAccountModal({ onClose, onDeleted }) {
  const [confirm, setConfirm]   = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState(null);
  const canDelete = confirm === "DELETE";

  const submit = async () => {
    if (!canDelete) return;
    setDeleting(true); setError(null);
    try {
      await deleteAccount();
      onDeleted();
    } catch (err) {
      setError(err.message || "Failed to delete account.");
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-lg">⚠️</span><h2 className="text-base font-bold text-red-500">Delete Account</h2></div>
        <button onClick={onClose} className="text-[#c4b5fd] hover:text-[#7c3aed] text-2xl leading-none">×</button>
      </div>
      <div className="h-px bg-red-100" />
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 space-y-1">
        <p className="font-semibold">This is permanent and cannot be undone.</p>
        <p>All conversations, mood entries and account data will be erased forever.</p>
      </div>
      {error && <Banner type="error" msg={error} />}
      <Field label='Type "DELETE" to confirm'>
        <input className="field-input" value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="DELETE" style={{ borderColor: canDelete ? "#f87171" : undefined }} />
      </Field>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#6b7280] border border-[#e5e7eb] hover:border-[#c4b5fd] transition-all">
          Cancel
        </button>
        <button onClick={submit} disabled={!canDelete || deleting}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: canDelete ? "#ef4444" : "#fca5a5", cursor: canDelete ? "pointer" : "not-allowed" }}>
          {deleting
            ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Deleting…</span>
            : "Delete My Account"}
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function Profile() {
  const { user, updateUser, clearSession } = useAuth();

  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [bio,       setBio]       = useState("");
  const [theme,     setTheme]     = useState("purple");
  const [notifChat, setNotifChat] = useState(true);
  const [notifMood, setNotifMood] = useState(true);
  const [tipsOn,    setTipsOn]    = useState(false);

  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState(null);
  const [avatarHover, setAvatarHover] = useState(false);
  const [showPwModal,  setShowPwModal]  = useState(false);
  const [showDelModal, setShowDelModal] = useState(false);
  const [tip,         setTip]         = useState(null);
  const [tipLoading,  setTipLoading]  = useState(false);

  const containerRef = useRef(null);
  const bioRef       = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fit = () => { el.style.height = (window.innerHeight - el.getBoundingClientRect().top) + "px"; };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name          || "");
      setEmail(user.email        || "");
      setBio(user.bio            || "");
      setTheme(user.theme        || "purple");
      setNotifChat(user.notif_chat  ?? true);
      setNotifMood(user.notif_mood  ?? true);
      setTipsOn(user.tips_enabled   ?? false);
    }
  }, [user]);

  const handleBio = (e) => {
    setBio(e.target.value);
    const ta = bioRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; }
  };

  const fetchTip = async () => {
    setTipLoading(true);
    try {
      const res = await getWellnessTip();
      setTip(res.tip);
    } catch {
      setTip("Take a moment to breathe. You're doing better than you think. 💜");
    } finally { setTipLoading(false); }
  };

  const handleTipsToggle = (val) => {
    setTipsOn(val);
    if (val && !tip) fetchTip();
  };

  const handleSave = async () => {
    if (!name.trim()) { setSaveError("Name can't be empty."); return; }
    setSaving(true); setSaveError(null);
    try {
      const updated = await updateProfile({ name, bio, theme, tips_enabled: tipsOn, notif_chat: notifChat, notif_mood: notifMood });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to save changes.");
    } finally { setSaving(false); }
  };

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-[#f8f7ff]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#a855f7] border-t-transparent animate-spin" />
        <p className="text-sm text-[#c4b5fd]">Loading…</p>
      </div>
    </div>
  );

  const initials      = name.split(" ").map(w => w[0]).filter(Boolean).slice(0,2).join("").toUpperCase() || "?";
  const avatarUrl     = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6b21a8&color=fff&rounded=true&size=128&bold=true`;
  const selectedTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <>
      <style>{styles}</style>
      {showPwModal  && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      {showDelModal && <DeleteAccountModal  onClose={() => setShowDelModal(false)} onDeleted={clearSession} />}

      <div ref={containerRef} className="w-full bg-[#f8f7ff] overflow-y-auto">
        <div className="px-6 py-10 flex flex-col items-center">
          <div className="w-full max-w-2xl space-y-5">

            <div style={{ animation: "fadeSlideUp 0.4s ease both", opacity: 0 }}>
              <h1 className="text-2xl font-bold text-[#2d1b4e]">Profile Settings</h1>
              <p className="text-sm text-[#9ca3af] mt-0.5">Manage your account and preferences</p>
            </div>

            {saved     && <Banner type="success" msg="<strong>Saved!</strong> Your profile has been updated." />}
            {saveError && <Banner type="error"   msg={saveError} />}

            {/* Avatar card */}
            <div className="bg-white rounded-2xl border border-[#f3e8ff] p-6 flex items-center gap-5"
              style={{ animation: "fadeSlideUp 0.4s 0.05s ease both", opacity: 0, boxShadow: "0 4px 24px rgba(139,92,246,0.06)" }}>
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
                onMouseEnter={() => setAvatarHover(true)} onMouseLeave={() => setAvatarHover(false)}
                style={{ boxShadow: "0 4px 20px rgba(107,33,168,0.2)" }}>
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                {avatarHover && (
                  <div className="absolute inset-0 bg-[#6b21a8]/60 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">Change</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-[#2d1b4e] truncate">{name || "—"}</p>
                <p className="text-sm text-[#9ca3af] truncate">{email}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: selectedTheme.color+"18", color: selectedTheme.color, border: `1px solid ${selectedTheme.color}30` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: selectedTheme.color }} />
                  {selectedTheme.label} theme
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                {initials}
              </div>
            </div>

            {/* Personal Info */}
            <Section title="Personal Info" icon="👤" delay={0.1}>
              <Field label="Full Name">
                <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" maxLength={60} />
              </Field>
              <Field label="Email Address" hint="Cannot be changed">
                <input className="field-input" value={email} disabled />
              </Field>
              <Field label="Bio" hint={`${bio.length}/200`}>
                <textarea ref={bioRef} className="field-input resize-none" value={bio} onChange={handleBio}
                  placeholder="Tell us a little about yourself…" maxLength={200} rows={2} />
              </Field>
            </Section>

            {/* Appearance */}
            <Section title="Appearance" icon="🎨" delay={0.15}>
              <div className="flex flex-wrap gap-3">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all duration-200"
                    style={{ borderColor: theme===t.id ? t.color:"#ede9fe", background: theme===t.id ? t.color+"12":"transparent", boxShadow: theme===t.id ? `0 0 0 3px ${t.color}25`:"none" }}>
                    <span className="w-6 h-6 rounded-full shadow-sm" style={{ background: t.color, boxShadow: theme===t.id ? `0 0 8px ${t.color}80`:"none" }} />
                    <span className="text-xs font-medium" style={{ color: theme===t.id ? t.color:"#9ca3af" }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Notifications */}
            <Section title="Notifications" icon="🔔" delay={0.2}>
              {[
                { label: "Chat reminders",  sub: "Get reminded to check in with Emo",         val: notifChat, set: setNotifChat },
                { label: "Mood check-in",   sub: "Daily nudge to log how you're feeling",     val: notifMood, set: setNotifMood },
                { label: "Wellness tips",   sub: "Personalised tips powered by your moods",   val: tipsOn,    set: handleTipsToggle },
              ].map(({ label, sub, val, set }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-1">
                  <div>
                    <p className="text-sm font-medium text-[#2d1b4e]">{label}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">{sub}</p>
                  </div>
                  <Toggle value={val} onChange={set} />
                </div>
              ))}

              {tipsOn && (
                <div className="rounded-2xl border border-[#ede9fe] p-4 space-y-3"
                  style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.06),rgba(168,85,247,0.03))", animation: "fadeSlideUp 0.3s ease both" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#7c3aed] uppercase tracking-wide">💜 Your tip</p>
                    <button onClick={fetchTip} disabled={tipLoading}
                      className="text-xs text-[#a855f7] hover:text-[#7c3aed] transition-colors disabled:opacity-50">
                      {tipLoading ? "…" : "↻ Refresh"}
                    </button>
                  </div>
                  {tipLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#c4b5fd] border-t-[#7c3aed] rounded-full animate-spin" />
                      <span className="text-xs text-[#c4b5fd]">Generating your tip…</span>
                    </div>
                  ) : tip ? (
                    <p className="text-sm text-[#4b2c82] leading-relaxed">{tip}</p>
                  ) : (
                    <p className="text-xs text-[#c4b5fd]">Save your preferences to generate a tip.</p>
                  )}
                </div>
              )}
            </Section>

            {/* Account */}
            <Section title="Account" icon="🔐" delay={0.25}>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[#2d1b4e]">Change Password</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {user.provider === "google" ? "Managed by Google — change via Google account" : "Update your login password"}
                  </p>
                </div>
                <button onClick={() => setShowPwModal(true)} disabled={user.provider === "google"}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200"
                  style={{ color: user.provider==="google" ? "#c4b5fd":"#7c3aed", borderColor: user.provider==="google" ? "#f3e8ff":"#ede9fe", cursor: user.provider==="google" ? "not-allowed":"pointer" }}>
                  {user.provider === "google" ? "Google Account" : "Change →"}
                </button>
              </div>
              <div className="h-px bg-[#f5f3ff]" />
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-red-400">Delete Account</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">Permanently remove all your data</p>
                </div>
                <button onClick={() => setShowDelModal(true)}
                  className="text-xs font-semibold text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-300 transition-all duration-200">
                  Delete
                </button>
              </div>
            </Section>

            {/* Save */}
            <div style={{ animation: "fadeSlideUp 0.4s 0.3s ease both", opacity: 0 }}>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6b21a8)", boxShadow: saving?"none":"0 8px 28px rgba(107,33,168,0.28)", opacity: saving?0.7:1 }}>
                {saving
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</span>
                  : "Save Changes"}
              </button>
            </div>

            <p className="text-center text-[10px] text-[#d8b4fe] pb-6"
              style={{ animation: "fadeSlideUp 0.4s 0.35s ease both", opacity: 0 }}>
              EmoWell v1.0 · Made with 💜
            </p>

          </div>
        </div>
      </div>
    </>
  );
}