import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import MoodCheckIn from './pages/MoodCheckIn'
import Chat from './pages/Chat'
import Contact from './pages/Contact'
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import MoodTrends from "./pages/MoodTrends"
import OAuthSuccess from "./pages/OAuthSuccess"
import LiquidEther from "@/components/LiquidEther"

export default function App(){
  const location = useLocation()
  const isChatPage = location.pathname === "/chat"

  return (
    <div className="min-h-screen flex flex-col">

      {/* 🌊 BACKGROUND (ONLY NON-CHAT) */}
      {!isChatPage && (
        <>
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <LiquidEther
              mouseForce={20}
              cursorSize={100}
              isViscous
              viscous={30}
              colors={["#9e27ff","#FF9FFC","#bda9ff"]}
              autoDemo
              autoSpeed={0.5}
              autoIntensity={2.2}
              isBounce={false}
              resolution={0.5}
            />
          </div>

          <div
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at center, transparent 30%, rgba(248,243,255,0.7) 80%)",
            }}
          />
        </>
      )}

      {/* 🌐 APP CONTENT */}
      <div className="relative z-10 flex flex-col flex-1">
        <Header />

        {/* ✅ IMPORTANT: allow normal scroll */}
        <main className="flex-1 flex">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mood" element={<MoodCheckIn />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/mood/trends" element={<MoodTrends />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
          </Routes>
        </main>

        {/*FOOTER ONLY ON HOME PAGE */}
        {location.pathname === "/" && <Footer />}
      </div>

    </div>
  )
}