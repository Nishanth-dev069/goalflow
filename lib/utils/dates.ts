import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isYesterday } from 'date-fns';

export function formatDate(date: string | Date | null | undefined, formatStr = 'MMM d, yyyy') {
  if (!date) return 'N/A';
  return format(new Date(date), formatStr);
}

export function formatRelative(date: string | Date | null | undefined) {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getHumanDate(date: string | Date | null | undefined) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function isOverdue(date: string | Date | null | undefined) {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}
