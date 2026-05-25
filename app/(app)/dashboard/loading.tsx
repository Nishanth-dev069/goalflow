import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 h-[400px] animate-pulse flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-neutral-600 animate-spin" />
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 h-[300px] animate-pulse" />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 h-[250px] animate-pulse" />
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 h-[250px] animate-pulse" />
      </div>
    </div>
  )
}
