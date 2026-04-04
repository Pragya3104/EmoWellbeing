import React from 'react'
import { Link } from 'react-router-dom'
import GlowCard from '../components/GlowCard';
import Reveal from "@/components/reveal"
import GradientHeading from "@/components/Gradient"
import { ChatIcon, MoodIcon, SupportIcon } from '../components/icons';

function FeatureCard({ icon, title, children }) {
  return (
    <div className="relative group">

      {/* CARD */}
      <GlowCard>
        <div className="card flex flex-col gap-4 relative z-10">
          <div className="w-12 h-12 bg-[#faf4ff] rounded-full flex items-center justify-center">
            {icon}
          </div>

          <h4 className="text-xl font-semibold text-[#4b2c82]">
            {title}
          </h4>

          <p className="text-sm text-[#6b21a8]/90">
            {children}
          </p>
        </div>
      </GlowCard>
    </div>
  );
}

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-12">

      <section className="text-center py-20">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f6e8ff] to-[#f2e6ff] flex items-center justify-center shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" className="text-[#6b21a8]">
              <path fill="none" stroke="#6b21a8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        </div>

        <h1 className="huge-hero text-6xl md:text-[96px] mb-8 leading-tight pb-4">
          <GradientHeading>
          Your Emotional Well-Being Companion
          </GradientHeading>
        </h1>

        <Reveal delay={100}>
        <p className="max-w-3xl mx-auto text-[#6b21a8]/80 mb-8">
          A safe, compassionate space where you can share your feelings, track your mood, and receive emotional support whenever you need it.
        </p>
        </Reveal>
        
        <Reveal delay={200}>
        <div className="flex items-center justify-center gap-6">
          <Link to="/register" className="btn-primary">Get Started Free</Link>
          <Link to="/contact" className="btn-outline">Learn More</Link>
        </div>
        </Reveal>
      </section>
      <Reveal delay={300}>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <FeatureCard icon={<ChatIcon />} title="AI-Powered Chat">
          Talk to our compassionate AI chatbot that understands your emotions and provides supportive, non-judgmental responses.
        </FeatureCard>
        <FeatureCard icon={<MoodIcon />} title="Mood Tracking">
          Daily mood check-ins and visual trends help you understand your emotional patterns and identify what impacts your well-being.
        </FeatureCard>
        <FeatureCard icon={<SupportIcon />} title="Crisis Support">
          Immediate access to crisis helplines and resources when you need urgent support. Your safety is our priority.
        </FeatureCard>
      </section>
      </Reveal>
      
      <Reveal delay={400}>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
        <div className="px-6">
          <h3 className="text-3xl font-semibold text-[#4b2c82] mb-4">
            A Safe Space for Your Emotions
          </h3>
          <p className="text-[#6b21a8]/90 mb-6">
            We understand that reaching out for support can be difficult. That's why we've created a judgment-free environment where you can express yourself freely and receive the emotional support you deserve.
          </p>
        </div>

        <GlowCard>
        <div className="card flex flex-col items-center justify-center text-center">
          <h4 className="text-2xl font-semibold text-[#4b2c82] mb-2">
            Ready to Begin?
          </h4>
          <Link to="/mood" className="btn-primary">
            Start Your Journey
          </Link>
        </div>
        </GlowCard>
      </section>
      </Reveal>

    </div>
  )
}