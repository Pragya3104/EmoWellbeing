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
import Profile from "./pages/Profile";
import MoodTrends from "./pages/MoodTrends";





export default function App(){
  return (
    <div className="min-h-screen flex flex-col">
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
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
