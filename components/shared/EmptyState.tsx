import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[#2a2a2a] rounded-2xl bg-[#111111]/50 backdrop-blur-xl relative overflow-hidden group">
      
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-6 shadow-2xl shadow-black/50 relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Icon className="w-8 h-8 text-neutral-400 group-hover:text-indigo-400 transition-colors duration-500 relative z-10" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{title}</h3>
      {description && <p className="text-sm text-neutral-400 mb-8 max-w-sm leading-relaxed">{description}</p>}
      
      {action && (
        <button
          onClick={action.onClick}
          className="bg-white text-black hover:bg-neutral-200 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
