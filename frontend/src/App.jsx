import React from 'react'
import { Routes, Route } from 'react-router-dom'
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
  return (
    <div className="relative min-h-screen">

      {/* 🌊 GLOBAL LIQUID BACKGROUND */}
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

      {/* 🌫️ SOFT OVERLAY (IMPORTANT for readability) */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 30%, rgba(248,243,255,0.7) 80%)",
        }}
      />

      {/* 🌐 APP CONTENT */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
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

        <Footer />
      </div>

    </div>
  )
}