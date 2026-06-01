import { isPast, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const IST = 'Asia/Kolkata';

export function formatDateIST(date: string | Date | null | undefined, fmt = 'MMM d, yyyy'): string {
  if (!date) return 'N/A';
  return formatInTimeZone(new Date(date), IST, fmt);
}

export function relativeTimeIST(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string | Date | null | undefined, formatStr = 'MMM d, yyyy') {
  return formatDateIST(date, formatStr);
}

export function formatRelative(date: string | Date | null | undefined) {
  return relativeTimeIST(date);
}

export function getHumanDate(date: string | Date | null | undefined) {
  if (!date) return 'N/A';
  const d = new Date(date);
  
  const todayStr = formatInTimeZone(new Date(), IST, 'yyyy-MM-dd');
  const dateStr = formatInTimeZone(d, IST, 'yyyy-MM-dd');
  
  if (dateStr === todayStr) return 'Today';
  
  return formatInTimeZone(d, IST, 'MMM d');
}

export function isOverdue(date: string | Date | null | undefined) {
  if (!date) return false;
  const todayStr = formatInTimeZone(new Date(), IST, 'yyyy-MM-dd');
  const dateStr = formatInTimeZone(new Date(date), IST, 'yyyy-MM-dd');
  if (dateStr === todayStr) return false;
  return isPast(new Date(date));
}
