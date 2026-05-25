export default function HistoryLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="h-8 w-48 bg-[#1a1a1a] animate-pulse rounded mb-2" />
      <div className="h-16 w-full bg-[#111111] border border-[#2a2a2a] rounded-xl animate-pulse mb-6" />
      
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-[#1a1a1a] animate-pulse rounded" />
          <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-[68px] border-b border-[#1a1a1a] animate-pulse bg-[#1a1a1a]/50" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
