import { Loader2 } from 'lucide-react'

export default function GoalsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[#1a1a1a] animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-[#1a1a1a] animate-pulse rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 h-[200px] animate-pulse flex items-center justify-center">
             <Loader2 className="w-6 h-6 text-neutral-700 animate-spin" />
          </div>
        ))}
      </div>
    </div>
  )
}
