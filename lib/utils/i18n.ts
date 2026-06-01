type Translations = Record<string, Record<string, string>>

export const translations: Translations = {
  en: {
    dashboard: 'Dashboard',
    goals: 'Goals',
    tasks: 'Tasks',
    history: 'History',
    todays_tasks: 'Today\'s Tasks',
    company_goals: 'Company Goals',
    activity: 'Activity Feed',
    overview: 'Overview',
    team: 'Team',
    departments: 'Departments',
    analytics: 'Analytics',
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    active: 'Active',
    completed: 'Completed',
    overdue: 'Overdue'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    goals: 'लक्ष्य',
    tasks: 'कार्य',
    history: 'इतिहास',
    todays_tasks: 'आज के कार्य',
    company_goals: 'कंपनी के लक्ष्य',
    activity: 'गतिविधि फ़ीड',
    overview: 'अवलोकन',
    team: 'टीम',
    departments: 'विभाग',
    analytics: 'एनालिटिक्स',
    todo: 'करने के लिए',
    in_progress: 'प्रगति पर',
    done: 'पूरा हुआ',
    urgent: 'अति आवश्यक',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'निम्न',
    active: 'सक्रिय',
    completed: 'पूरा हुआ',
    overdue: 'समय सीमा पार'
  }
}

export function useTranslation(lang: 'en' | 'hi' = 'en') {
  return function t(key: string): string {
    return (translations[lang] && translations[lang][key]) || (translations['en'] && translations['en'][key]) || key
  }
}
