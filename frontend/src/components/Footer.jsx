import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer(){
  return (
    <footer className="mt-12 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-semibold text-[#4b2c82]">WellBeing Companion</h3>
          <p className="mt-3 text-sm text-[#6b21a8]/80">Your trusted companion for emotional well-being and mental health support. We're here to listen, understand, and support you.</p>
        </div>

        <div>
          <h4 className="font-semibold text-[#4b2c82]">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/mood">Crisis Resources</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-[#4b2c82]">Emergency Resources</h4>
          <div className="mt-3 text-sm space-y-2 text-[#6b21a8]">
            <div>📞 Crisis Hotline — 14416</div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f0e6ff]">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-[#6b21a8]">
          © 2025 WellBeing Companion. All rights reserved. — This chatbot provides emotional support only and is not a substitute for professional medical advice.
        </div>
      </div>
    </footer>
  )
}
