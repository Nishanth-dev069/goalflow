const quotes = {
  hustle: [
    "It works on my machine.",
    "A bug is just an undocumented feature.",
    "There are only 10 types of people in the world: those who understand binary, and those who don't.",
    "Coffee.map(cup => code(cup)).",
    "Don't comment bad code - rewrite it.",
  ],
  focus: [
    "Talk is cheap. Show me the code.",
    "First, solve the problem. Then, write the code.",
    "Experience is the name everyone gives to their mistakes.",
    "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
  ],
  chill: [
    "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.",
    "Walking on water and developing software from a specification are easy if both are frozen.",
    "Measuring programming progress by lines of code is like measuring airplane building progress by weight.",
  ],
  celebration: [
    "It compiled on the first try!",
    "No merge conflicts today!",
    "0 errors, 0 warnings. Take a screenshot.",
    "Production deploy successful. Go grab a coffee.",
  ],
};

export function getQuoteForUser(stats: { completed_today_count: number; completion_rate_week: number }): string {
  if (stats.completed_today_count > 3 && stats.completion_rate_week > 80) {
    return quotes.celebration[Math.floor(Math.random() * quotes.celebration.length)] as string;
  }
  if (stats.completed_today_count === 0 && new Date().getHours() > 14) {
    return quotes.hustle[Math.floor(Math.random() * quotes.hustle.length)] as string;
  }
  if (stats.completed_today_count > 5) {
    return quotes.chill[Math.floor(Math.random() * quotes.chill.length)] as string;
  }
  return quotes.focus[Math.floor(Math.random() * quotes.focus.length)] as string;
}
