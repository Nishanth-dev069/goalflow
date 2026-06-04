import { User } from '@/types'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: Pick<User, 'id' | 'full_name'> & Partial<User> | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

const colors = [
  'bg-indigo-600',
  'bg-violet-600',
  'bg-sky-600',
  'bg-teal-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-orange-600',
  'bg-pink-600'
]

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]?.substring(0, 2).toUpperCase() || '?'
  const first = parts[0]
  const last = parts[parts.length - 1]
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?'
}

function getColorIndex(id: string | undefined | null) {
  if (!id) return 0
  return id.charCodeAt(0) % colors.length
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  if (!user) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 font-medium',
          sizeClasses[size],
          className
        )}
      >
        ?
      </div>
    )
  }

  const initials = getInitials(user.full_name)
  // user might have avatar_url in the future, if so render img tag here
  const colorClass = colors[getColorIndex(user.id)]

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full text-white font-medium',
        colorClass,
        sizeClasses[size],
        className
      )}
      title={user.full_name}
    >
      {initials}
    </div>
  )
}
