import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? "text-[#6b21a8] font-semibold"
          : "text-[#6b21a8]/90 hover:text-[#6b21a8]"
      }
    >
      {children}
    </NavLink>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white/40 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* ✅ LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 24 24" className="text-[#6b21a8]"><path fill="none" stroke="#6b21a8" strokeWidth="1.6"strokeLinecap="round" strokeLinejoin="round" className="shrink-0" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span className="text-lg font-semibold text-[#4b2c82]">
            EmoWell
          </span>
        </Link>

        {/* ✅ NAVIGATION — Only visible when logged in */}
        {user && (
          <nav className="hidden md:flex items-center gap-8">
            <NavItem to="/chat">Chat</NavItem>
            <NavItem to="/mood">Mood Check-in</NavItem>
            <NavItem to="/mood/trends">Mood Trends</NavItem>
            <NavItem to="/contact">Contact</NavItem>
          </nav>
        )}

        {/* ✅ AUTH BUTTONS / PROFILE DROPDOWN */}
        <div className="flex items-center gap-4">

          {/* If NOT logged in → Show Login + Get Started */}
          {!user && (
            <>
              <Link to="/login" className="text-sm text-[#6b21a8] font-medium">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-[#6b21a8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a1c70]"
              >
                Get Started
              </Link>
            </>
          )}

          {/* If logged in → Show Avatar & Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 bg-[#6b21a8] text-white rounded-full flex items-center justify-center font-semibold"
              >
                {user.name?.charAt(0)?.toUpperCase()}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg p-3">
                  <div className="text-[#4b2c82] font-semibold">{user.name}</div>
                  <div className="text-xs text-[#8a6bbd] mb-2">{user.email}</div>

                  <div className="pt-2 border-t">
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
                    className="w-full text-left py-2 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ✅ MOBILE MENU (only when logged in) */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16"
                  stroke="#6b21a8"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ✅ MOBILE NAV LINKS */}
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
