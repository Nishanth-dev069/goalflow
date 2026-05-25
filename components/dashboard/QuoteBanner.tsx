'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'
import { getQuoteForUser } from '@/lib/utils/quotes'

interface QuoteBannerProps {
  stats: {
    completed_today_count: number
    completion_rate_week: number
  }
}

export function QuoteBanner({ stats }: QuoteBannerProps) {
  const quote = getQuoteForUser(stats)

  return (
    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 relative overflow-hidden group">
      {/* Animated background sheen */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg]" />
      
      <div className="flex items-center gap-3 relative z-10">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-indigo-100">{quote}</p>
        </div>
      </div>
    </div>
  )
}
