import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from "framer-motion"


function FeatureCard({icon, title, children}) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="w-12 h-12 bg-[#faf4ff] rounded-full flex items-center justify-center">{icon}</div>
      <h4 className="text-xl font-semibold text-[#4b2c82]">{title}</h4>
      <p className="text-sm text-[#6b21a8]/90">{children}</p>
    </div>
  )
}

export default function Home(){
  return (
    <div className="max-w-7xl mx-auto px-6 pt-12">
      <section className="text-center py-20">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f6e8ff] to-[#f2e6ff] flex items-center justify-center shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" className="text-[#6b21a8]"><path fill="none" stroke="#6b21a8" strokeWidth="1.6"strokeLinecap="round" strokeLinejoin="round" className="shrink-0" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="huge-hero text-6xl md:text-[96px] mb-6"
        >
          Your Emotional Well-Being Companion
        </motion.h1>

        <p className="max-w-3xl mx-auto text-[#6b21a8]/80 mb-8">
          A safe, compassionate space where you can share your feelings, track your mood, and receive emotional support whenever you need it.
        </p>

        <div className="flex items-center justify-center gap-6">
          <Link to="/register" className="btn-primary">Get Started Free</Link>
          <Link to="/contact" className="btn-outline">Learn More</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
          <FeatureCard icon={<svg width="28" height="28" viewBox="0 0 24 24" className="text-[#6b21a8]"><path fill="none" stroke="#6b21a8" strokeWidth="1.6"strokeLinecap="round" strokeLinejoin="round" className="shrink-0" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>} title="AI-Powered Chat">
            Talk to our compassionate AI chatbot that understands your emotions and provides supportive, non-judgmental responses.
          </FeatureCard>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
          <FeatureCard icon={<svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 20l16-16" stroke="#6b21a8" strokeWidth="1.6" fill="none"/></svg>} title="Mood Tracking">
              Daily mood check-ins and visual trends help you understand your emotional patterns and identify what impacts your well-being.
            </FeatureCard>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
          <FeatureCard icon={<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2l7 4v6c0 5-7 10-7 10s-7-5-7-10V6z" stroke="#6b21a8" strokeWidth="1.6" fill="none"/></svg>} title="Crisis Support">
            Immediate access to crisis helplines and resources when you need urgent support. Your safety is our priority.
          </FeatureCard>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
        <div className="px-6">
          <h3 className="text-3xl font-semibold text-[#4b2c82] mb-4">A Safe Space for Your Emotions</h3>
          <p className="text-[#6b21a8]/90 mb-6">We understand that reaching out for support can be difficult. That's why we've created a judgment-free environment where you can express yourself freely and receive the emotional support you deserve.</p>

          <ul className="space-y-6 text-[#6b21a8]">
            <li className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-[#faf4ff] flex items-center justify-center">🕒</div>
              <div>
                <div className="font-semibold">Available 24/7</div>
                <div className="text-sm">Access support whenever you need it, day or night</div>
              </div>
            </li>

            <li className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-[#faf4ff] flex items-center justify-center">🫶</div>
              <div>
                <div className="font-semibold">Compassionate Understanding</div>
                <div className="text-sm">Receive empathetic support without judgment or criticism</div>
              </div>
            </li>
          </ul>
        </div>

        <div className="card flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#f5e7ff] to-[#f3e8ff] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" className="text-[#6b21a8]"><path fill="none" stroke="#6b21a8" strokeWidth="1.6"strokeLinecap="round" strokeLinejoin="round" className="shrink-0" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <h4 className="text-2xl font-semibold text-[#4b2c82] mb-2">Ready to Begin?</h4>
          <p className="text-[#6b21a8]/80 mb-6">Join thousands who have found comfort and support through our platform</p>
          <Link to="/mood" className="btn-primary">Start Your Journey</Link>
        </div>
      </section>
    </div>
  )
}
