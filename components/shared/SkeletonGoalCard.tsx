export function SkeletonGoalCard() {
  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 relative group animate-pulse">
      <div className="w-full h-1 absolute left-0 top-0 right-0 rounded-t-xl bg-[#2a2a2a]" />
      <div className="flex flex-col h-full mt-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-20 bg-[#2a2a2a] rounded" />
              <div className="h-5 w-16 bg-[#2a2a2a] rounded" />
            </div>
            <div className="h-5 bg-[#2a2a2a] rounded w-5/6 mb-2" />
            <div className="h-3 bg-[#2a2a2a] rounded w-4/6" />
          </div>
        </div>
        <div className="mt-6 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a]" />
            <div className="h-4 w-24 bg-[#2a2a2a] rounded" />
          </div>
          <div className="text-right w-32">
            <div className="h-2 w-full bg-[#2a2a2a] rounded-full mb-2" />
            <div className="h-3 w-16 bg-[#2a2a2a] rounded ml-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
