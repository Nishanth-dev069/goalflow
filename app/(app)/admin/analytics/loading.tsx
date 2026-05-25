export default function AnalyticsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="h-8 w-48 bg-[#1a1a1a] animate-pulse rounded mb-2" />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111111] border border-[#2a2a2a] rounded-xl h-[120px] animate-pulse" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2 bg-[#111111] border border-[#2a2a2a] rounded-xl h-[280px] animate-pulse" />
        <div className="col-span-1 bg-[#111111] border border-[#2a2a2a] rounded-xl h-[280px] animate-pulse" />
      </div>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl h-[300px] animate-pulse" />
    </div>
  )
}
