'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors mb-6 bg-[#1a1a1a] hover:bg-[#2a2a2a] w-fit px-3 py-1.5 rounded-lg border border-[#2a2a2a]"
    >
      <ArrowLeft size={14} /> Back
    </button>
  )
}
