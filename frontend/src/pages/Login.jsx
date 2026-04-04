import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import GlowCard from "../components/GlowCard";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const googleLogin = () => {
  window.location.href = "http://localhost:8000/api/auth/google/login";
};

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔥 OAuth2 requires form-encoded data
      const formData = new URLSearchParams();
      formData.append("username", email); // OAuth2 uses "username"
      formData.append("password", password);

      const res = await axios.post(
        "http://localhost:8000/api/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!res.data?.access_token) {
        throw new Error("No token received");
      }

      // ✅ Save user + token
      login(res.data.access_token, res.data.user);



      navigate("/");
    } catch (err) {
      alert(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <GlowCard>
      <form onSubmit={submit} className="card">
        <h2 className="text-3xl font-semibold text-center mb-6">Login</h2>

        <input
          className="border p-3 rounded-lg w-full mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="border p-3 rounded-lg w-full mb-6"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <button
          onClick={googleLogin}
          className="btn-primary w-full mt-4"
        >
          Continue with Google
        </button>
      </form>
      </GlowCard>
    </div>
    
  );
}
