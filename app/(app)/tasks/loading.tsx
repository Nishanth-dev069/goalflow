export default function TasksLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-48 bg-[#1a1a1a] animate-pulse rounded mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#111111] border border-[#2a2a2a] rounded-xl h-[120px] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
