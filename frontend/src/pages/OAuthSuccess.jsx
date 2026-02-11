import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    async function finishLogin() {
      try {
        // ✅ Save token first
        localStorage.setItem("emowell_token", token);

        // ✅ Fetch real user from backend
        const user = await apiRequest("/api/auth/me");

        // ✅ Now login properly
        login(token, user);

      } catch (err) {
        console.error("OAuth failed:", err);
        navigate("/login");
      }
    }

    finishLogin();
  }, []);

  return <p className="text-center mt-10">Signing you in...</p>;
}
