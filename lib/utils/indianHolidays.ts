export const INDIAN_HOLIDAYS = [
  { date: '2026-01-01', name: 'New Year' },
  { date: '2026-01-13', name: 'Bhogi' },
  { date: '2026-01-14', name: 'Sankranti' },
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-02-15', name: 'Maha Shivaratri' },
  { date: '2026-03-03', name: 'Holi' },
  { date: '2026-03-20', name: 'Ugadi / Ramzan' },
  { date: '2026-03-28', name: 'Sri Rama Navami' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-14', name: 'Dr BR Ambedkar Birthday' },
  { date: '2026-05-27', name: 'Bakrid' },
  { date: '2026-07-27', name: 'Bonalu' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-09-04', name: 'Sri Krishna Astami' },
  { date: '2026-09-14', name: 'Vinayaka Chavithi' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-10-15', name: 'Bathukamma Starting Day' },
  { date: '2026-10-20', name: 'Vijaya Dasami / Dussehra' },
  { date: '2026-11-08', name: 'Deepavali / Diwali' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-26', name: 'Boxing Day' },
  // Adding current dates for easier testing if needed
  { date: new Date().toISOString().split('T')[0], name: 'Demo Holiday' }
]

export function getHolidayByDate(dateStr: string): string | null {
  if (!dateStr) return null;
  // expects YYYY-MM-DD
  const match = INDIAN_HOLIDAYS.find(h => h.date === dateStr);
  return match ? match.name : null;
}
