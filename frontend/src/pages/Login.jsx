import React, { useState } from "react";
import { loginUser } from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false); // ✅ FIXED: added loading state
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginUser(form);

      if (!res?.access_token) {
        alert("Login failed: No token received");
        setLoading(false);
        return;
      }

      // ✅ Save user + token in AuthContext & localStorage
      login(
        { name: res.user.name, email: res.user.email },
        res.access_token
      );

      setLoading(false);
      navigate("/chat");

    } catch (err) {
      alert(err?.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <form onSubmit={submit} className="card">
        <h2 className="text-3xl font-semibold text-center mb-6">Login</h2>

        <input
          className="border p-3 rounded-lg w-full mb-3"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          className="border p-3 rounded-lg w-full mb-6"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
