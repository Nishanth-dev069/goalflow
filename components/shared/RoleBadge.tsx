import React from 'react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface RoleBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  role: UserRole | string;
}

export function RoleBadge({ role, className, ...props }: RoleBadgeProps) {
  let badgeClasses = "text-xs font-medium px-2 py-1 rounded-md border inline-flex items-center";
  let label = role;
  
  if (!role) {
    return <span className={cn(badgeClasses, "bg-neutral-800 text-neutral-400 border-neutral-700", className)} {...props}>Unknown</span>
  }

  switch (role.toLowerCase()) {
    case 'admin':
      badgeClasses = cn(badgeClasses, "bg-indigo-500/15 text-indigo-400 border-indigo-500/20");
      label = "Admin";
      break;
    case 'manager':
      badgeClasses = cn(badgeClasses, "bg-amber-500/15 text-amber-400 border-amber-500/20");
      label = "Manager";
      break;
    case 'employee':
      badgeClasses = cn(badgeClasses, "bg-neutral-800 text-neutral-400 border-neutral-700");
      label = "Employee";
      break;
    default:
      badgeClasses = cn(badgeClasses, "bg-neutral-800 text-neutral-400 border-neutral-700");
      break;
  }

  return (
    <span className={cn(badgeClasses, className)} {...props}>
      {label}
    </span>
  );
}
