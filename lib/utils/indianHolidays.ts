export const INDIAN_HOLIDAYS = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-03-03', name: 'Holi' }, // Approximate for 2026
  { date: '2026-11-08', name: 'Diwali' }, // Approximate for 2026
  { date: '2026-12-25', name: 'Christmas Day' },
  // Adding current dates for easier testing if needed
  { date: new Date().toISOString().split('T')[0], name: 'Demo Holiday' }
]

export function getHolidayByDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // expects YYYY-MM-DD
  const match = INDIAN_HOLIDAYS.find(h => h.date === dateStr);
  return match ? match.name : null;
}
