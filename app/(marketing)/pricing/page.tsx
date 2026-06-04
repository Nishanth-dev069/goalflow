'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const session = user ? { user } : null;
      if (session?.user) {
        supabase.from('users').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setUser(data))
      }
    })
  }, [supabase])

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleUpgrade = async (plan: string, price: number) => {
    if (!user) {
      toast.error('Please log in first to upgrade.')
      router.push('/login')
      return
    }

    const res = await loadRazorpay()
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?')
      return
    }

    const amountInPaise = price * 100

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
      amount: amountInPaise,
      currency: 'INR',
      name: 'GoalFlow',
      description: `${plan} Plan Upgrade`,
      prefill: { 
        name: user.full_name || 'GoalFlow User', 
        email: user.email, 
        contact: '9999999999' 
      },
      theme: { color: '#4f46e5' },
      handler: function (response: any) {
        toast.success(`Payment successful! Reference ID: ${response.razorpay_payment_id}`)
        // In a real app, verify response on backend here
      },
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <section className="w-full max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Simple, transparent pricing.</h1>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-12">
          Stop paying per-user in dollars. We've priced GoalFlow specifically for Indian teams with no hidden fees and full GST compliance.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-neutral-500'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-8 rounded-full bg-indigo-600 p-1 transition-colors relative focus:outline-none"
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-200 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-neutral-500'}`}>
            Annually <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          
          {/* FREE */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-neutral-500 text-sm mb-6">Perfect for small teams getting started.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold">₹0</span>
            </div>
            <button className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#3a3a3a] py-3 rounded-xl font-semibold transition-colors mb-8">
              Get Started
            </button>
            <ul className="space-y-4 text-sm text-neutral-300">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Up to 5 users</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Unlimited tasks & goals</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Basic analytics</li>
            </ul>
          </div>

          {/* GROWTH */}
          <div className="bg-[#111] border-2 border-indigo-500 rounded-2xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-500/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Most Popular
            </div>
            <h3 className="text-xl font-bold mb-2">Growth</h3>
            <p className="text-neutral-500 text-sm mb-6">For agencies scaling operations.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold">₹{isAnnual ? '159' : '199'}</span>
              <span className="text-neutral-500 text-sm">/user/mo</span>
            </div>
            <button 
              onClick={() => handleUpgrade('Growth', isAnnual ? 159 : 199)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors mb-8"
            >
              Upgrade with UPI
            </button>
            <ul className="space-y-4 text-sm text-neutral-300">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Everything in Free</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Built-in Time Tracking</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> File Attachments</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> WhatsApp Notifications</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Recurring Tasks</li>
            </ul>
          </div>

          {/* BUSINESS */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col">
            <h3 className="text-xl font-bold mb-2">Business</h3>
            <p className="text-neutral-500 text-sm mb-6">For large enterprises needing control.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold">₹{isAnnual ? '399' : '499'}</span>
              <span className="text-neutral-500 text-sm">/user/mo</span>
            </div>
            <button 
              onClick={() => handleUpgrade('Business', isAnnual ? 399 : 499)}
              className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#3a3a3a] py-3 rounded-xl font-semibold transition-colors mb-8"
            >
              Upgrade with UPI
            </button>
            <ul className="space-y-4 text-sm text-neutral-300">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Everything in Growth</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Advanced Analytics</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Sprint Boards</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Client Portal</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Priority Support</li>
            </ul>
          </div>
          
        </div>
      </section>

      {/* Comparison Section */}
      <section className="w-full bg-[#0a0a0a] border-y border-white/5 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">GoalFlow vs The Alternatives</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b border-[#2a2a2a] text-neutral-400 font-medium">Feature</th>
                  <th className="p-4 border-b border-[#2a2a2a] text-white font-bold text-lg bg-indigo-500/5 rounded-t-xl">GoalFlow</th>
                  <th className="p-4 border-b border-[#2a2a2a] text-neutral-400 font-medium">ClickUp</th>
                  <th className="p-4 border-b border-[#2a2a2a] text-neutral-400 font-medium">Asana</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#1a1a1a]">
                  <td className="p-4 text-sm text-neutral-300">Price per user (Annual)</td>
                  <td className="p-4 text-sm font-bold text-indigo-400 bg-indigo-500/5">₹1,908</td>
                  <td className="p-4 text-sm text-neutral-500">~$84 (₹7,000+)</td>
                  <td className="p-4 text-sm text-neutral-500">~$131 (₹10,900+)</td>
                </tr>
                <tr className="border-b border-[#1a1a1a]">
                  <td className="p-4 text-sm text-neutral-300">Data Residency</td>
                  <td className="p-4 text-sm font-bold text-indigo-400 bg-indigo-500/5">India (Mumbai)</td>
                  <td className="p-4 text-sm text-neutral-500">US / EU</td>
                  <td className="p-4 text-sm text-neutral-500">US / EU</td>
                </tr>
                <tr className="border-b border-[#1a1a1a]">
                  <td className="p-4 text-sm text-neutral-300">Payment Methods</td>
                  <td className="p-4 text-sm font-bold text-indigo-400 bg-indigo-500/5">UPI, NetBanking, RuPay</td>
                  <td className="p-4 text-sm text-neutral-500">Credit Card Only</td>
                  <td className="p-4 text-sm text-neutral-500">Credit Card Only</td>
                </tr>
                <tr>
                  <td className="p-4 text-sm text-neutral-300 rounded-bl-xl">Timezone Native</td>
                  <td className="p-4 text-sm font-bold text-indigo-400 bg-indigo-500/5 rounded-br-xl">IST Default</td>
                  <td className="p-4 text-sm text-neutral-500">User setting dependent</td>
                  <td className="p-4 text-sm text-neutral-500">User setting dependent</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  )
}
