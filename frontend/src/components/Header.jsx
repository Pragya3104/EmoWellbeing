import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlowCard from "./GlowCard";

function NavItem({ to, children }) {
  return (
    <GlowCard>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 
        ${
          isActive
            ? "bg-white/60 backdrop-blur-md text-[#6b21a8] shadow-md"
            : "text-[#6b21a8]/80 hover:text-[#6b21a8] hover:bg-white/40"
        }`
      }
    >
      {children}
    </NavLink>
    </GlowCard>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="w-full sticky top-0 z-30 backdrop-blur-xl bg-white/40 border-b border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* ✅ LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-md group-hover:scale-105 transition">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="white"
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 
                5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 
                7.78l1.06 1.06L12 21.23l7.78-7.78 
                1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold text-[#4b2c82] tracking-tight">
            EmoWell
          </span>
        </Link>

        {/* ✅ NAVIGATION */}
        {user && (
          <nav className="hidden md:flex items-center gap-3 bg-white/30 backdrop-blur-lg px-4 py-2 rounded-full shadow-inner">
            <NavItem to="/chat">Chat</NavItem>
            <NavItem to="/mood">Mood Check-in</NavItem>
            <NavItem to="/mood/trends">Mood Trends</NavItem>
            <NavItem to="/contact">Contact</NavItem>
          </nav>
        )}

        {/* ✅ AUTH / PROFILE */}
        <div className="flex items-center gap-4">

          {!user && (
            <>
              <Link className="text-sm text-[#6b21a8] font-medium hover:opacity-80 transition">
                Login
              </Link>

              <Link
                to="/register"
                className="relative px-5 py-2 rounded-full text-sm font-semibold text-white 
                bg-gradient-to-r from-purple-500 to-purple-700 
                shadow-lg hover:shadow-purple-400/40 
                transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Link>
            </>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white
                bg-gradient-to-br from-purple-500 to-purple-700 
                shadow-md hover:scale-105 transition"
              >
                {user.name?.charAt(0)?.toUpperCase()}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white/70 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl p-4 animate-fadeIn">
                  <div className="text-[#4b2c82] font-semibold">{user.name}</div>
                  <div className="text-xs text-[#8a6bbd] mb-3">{user.email}</div>

                  <div className="border-t pt-2">
                    <Link
                      to="/profile"
                      className="block py-2 hover:text-[#6b21a8]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile Settings
                    </Link>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                      navigate("/login");
                    }}
                    className="w-full text-left py-2 text-red-500"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MOBILE MENU */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="#6b21a8"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE NAV */}
      {mobileMenuOpen && user && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-3">
          <Link to="/chat">Chat</Link>
          <Link to="/mood">Mood Check-in</Link>
          <Link to="/mood/trends">Mood Trends</Link>
          <Link to="/contact">Contact</Link>
        </div>
      )}
    </header>
  );
}