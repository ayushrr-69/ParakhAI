import { CalendarDay } from '@/types/app';

/**
 * Returns an array of 7 days representing the current week (Sunday to Saturday).
 */
export function getCurrentWeekDays(): CalendarDay[] {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Sunday of current week
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - currentDay);
  sunday.setHours(0, 0, 0, 0);

  const days: CalendarDay[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    
    // Key is the lower-case short name e.g. 'mon'
    const key = dayNames[i].toLowerCase();
    
    days.push({
      key,
      day: dayNames[i],
      date: date.getDate().toString(),
    });
  }

  return days;
}

/**
 * Returns the key ('sun', 'mon', etc.) for today.
 */
export function getTodayKey(): string {
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return dayNames[new Date().getDay()];
}
