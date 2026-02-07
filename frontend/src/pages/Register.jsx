import React, { useState } from "react";
import { registerUser } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await registerUser(form);
      localStorage.setItem("token", res.access_token);
      navigate("/chat");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">

      <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-semibold text-center mb-6 text-[#4b2c82]">
          Create Account
        </h2>

        <input
          className="border p-3 rounded-lg w-full mb-3 focus:outline-[#6b21a8]"
          placeholder="Name"
          required
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="border p-3 rounded-lg w-full mb-3 focus:outline-[#6b21a8]"
          placeholder="Email"
          type="email"
          required
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="border p-3 rounded-lg w-full mb-4 focus:outline-[#6b21a8]"
          type="password"
          placeholder="Password"
          required
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6b21a8] text-white py-3 rounded-lg hover:bg-[#5a1c70] transition font-medium"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        {/* ✅ Added Login Redirect Line */}
        <p className="text-center text-sm mt-4 text-gray-600">
          Already registered?{" "}
          <Link
            to="/login"
            className="text-[#6b21a8] font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

      </form>
    </div>
  );
}
