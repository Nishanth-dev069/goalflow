import { cn } from '@/lib/utils'

export function SkeletonTaskCard() {
  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 relative group flex animate-pulse">
      <div className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-xl bg-[#2a2a2a]" />
      <div className="flex-1 ml-2">
        <div className="flex items-start gap-3">
          <div className="p-2 -m-2 z-10">
            <div className="w-5 h-5 rounded-full border-2 border-[#3a3a3a] mt-0.5" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-4" />
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-5 w-16 bg-[#2a2a2a] rounded" />
              <div className="h-4 w-20 bg-[#2a2a2a] rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
