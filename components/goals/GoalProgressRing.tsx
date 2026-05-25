'use client'

import React, { useEffect, useState } from 'react'

export function GoalProgressRing({ progress, unit = '%' }: { progress: number, unit?: string }) {
  const [fill, setFill] = useState(0)

  useEffect(() => {
    // Animate on mount
    const timer = setTimeout(() => setFill(progress), 100)
    return () => clearTimeout(timer)
  }, [progress])

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (fill / 100) * circumference
  
  const progColor = fill < 30 ? '#ef4444' : fill < 70 ? '#f59e0b' : fill < 100 ? '#6366f1' : '#22c55e'

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-[160px] h-[160px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            className="text-[#1a1a1a] stroke-current"
            strokeWidth="8"
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
          />
          <circle
            className="transition-all duration-1000 ease-out"
            stroke={progColor}
            strokeWidth="8"
            strokeLinecap="round"
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{fill}%</span>
          <span className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">{unit}</span>
        </div>
      </div>
    </div>
  )
}
