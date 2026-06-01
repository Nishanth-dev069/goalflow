import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Zap, Shield, IndianRupee, MessageSquare, Clock } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-8 border border-indigo-500/20">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          Now available for Indian Agencies
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
          The Work OS built <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">for India.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-12">
          Manage your tasks, track time, and hit your goals without the overwhelming complexity.
          Stop paying premium dollar rates for tools that don't understand your business.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 w-full sm:w-auto">
            Request Access
          </Link>
          <Link href="/pricing" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-full font-bold text-lg transition-all w-full sm:w-auto">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="w-full bg-[#0a0a0a] border-y border-white/5 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">ClickUp costs ₹1,500/user/month.<br/>We don't.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-red-400 mb-4">The Global Giants</h3>
              <ul className="space-y-4 text-neutral-300">
                <li className="flex gap-3"><XIcon /> Price in Dollars ($10-15)</li>
                <li className="flex gap-3"><XIcon /> Overwhelming 3-week onboarding</li>
                <li className="flex gap-3"><XIcon /> Slow, bloated performance</li>
                <li className="flex gap-3"><XIcon /> International servers (Latency)</li>
              </ul>
            </div>
            
            <div className="bg-indigo-500/5 border border-indigo-500/20 p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="w-32 h-32 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-indigo-400 mb-4">GoalFlow</h3>
              <ul className="space-y-4 text-neutral-300 relative z-10">
                <li className="flex gap-3"><CheckIcon /> ₹199/user/month via UPI</li>
                <li className="flex gap-3"><CheckIcon /> Simple, opinionated workflows</li>
                <li className="flex gap-3"><CheckIcon /> Lightning fast (Next.js + Supabase)</li>
                <li className="flex gap-3"><CheckIcon /> Data stored safely in India</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need.</h2>
          <p className="text-neutral-400 text-lg">Powerful features wrapped in an intuitive interface.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard icon={CheckCircle2} title="Task Management" desc="Kanban boards, list views, and subtasks to keep everything organized." />
          <FeatureCard icon={Clock} title="Built-in Time Tracking" desc="Track billable hours per task right where the work happens." />
          <FeatureCard icon={IndianRupee} title="Local Pricing" desc="Pay in rupees via Razorpay/UPI. Get GST compliant invoices automatically." />
          <FeatureCard icon={Shield} title="Data Residency" desc="Hosted on AWS Mumbai. Your data never leaves Indian borders." />
          <FeatureCard icon={Zap} title="IST Default" desc="Calendar and notifications strictly follow Indian Standard Time." />
          <FeatureCard icon={MessageSquare} title="WhatsApp Sync" desc="Get critical alerts on WhatsApp where your team actually lives." />
        </div>
      </section>
      
      {/* Testimonials Placeholder */}
      <section className="w-full bg-[#0a0a0a] border-y border-white/5 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Trusted by 100+ Indian Agencies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
              <div className="flex text-amber-400 mb-4">★★★★★</div>
              <p className="text-neutral-300 mb-4">"We saved over ₹40,000 this year by switching from ClickUp. The built-in time tracker is a lifesaver for our freelance developers."</p>
              <div className="font-bold">— Rahul K., Digital Agency Founder</div>
            </div>
            <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
              <div className="flex text-amber-400 mb-4">★★★★★</div>
              <p className="text-neutral-300 mb-4">"Finally a tool that understands IST natively and lets me pay via UPI instead of dealing with international credit card failures."</p>
              <div className="font-bold">— Sneha M., Product Manager</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-[#111] border border-[#222] p-8 rounded-2xl hover:border-indigo-500/50 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
        <Icon className="text-indigo-400 w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  )
}

function CheckIcon() {
  return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
}

function XIcon() {
  return <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 mt-0.5 text-xs font-bold">X</div>
}
