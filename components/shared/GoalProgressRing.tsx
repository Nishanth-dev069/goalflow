import React from 'react'

interface GoalProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
}

export function GoalProgressRing({
  percentage,
  size = 64,
  strokeWidth = 6,
}: GoalProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // Clamp percentage to 0-100 for dashoffset math
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference

  let color = '#ef4444' // <30%=red
  if (percentage >= 30 && percentage < 70) color = '#f59e0b' // 30-70%=amber
  else if (percentage >= 70 && percentage < 100) color = '#6366f1' // 70-99%=indigo
  else if (percentage >= 100) color = '#22c55e' // 100%=green

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#2a2a2a"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute text-xs font-bold text-white">
        {Math.round(percentage)}%
      </div>
    </div>
  )
}
