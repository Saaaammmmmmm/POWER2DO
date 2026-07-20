import { Task, Category, Space } from '../types';

// Helper to format Date objects as YYYY-MM-DD
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Calculate Today's Date relative to the user's custom day change reset time (e.g. 4 AM)
export function getAppTodayStr(dayChangeTime: string): string {
  const now = new Date();
  const [h, m] = dayChangeTime.split(':').map(Number);
  const threshold = new Date(now);
  threshold.setHours(h, m, 0, 0);
  
  if (now.getTime() < threshold.getTime()) {
    // If before the rollover hour, we are still on the "previous" calendar day
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return formatDate(yesterday);
  }
  return formatDate(now);
}

// Calculate relative time: months, days, years (additive integers)
export function calculateRelativeTime(targetDateStr: string, currentDateStr: string): string {
  if (!targetDateStr) return '';
  
  const target = new Date(targetDateStr + 'T12:00:00');
  const current = new Date(currentDateStr + 'T12:00:00');
  
  // If target is in the past
  if (target.getTime() < current.getTime()) {
    const diffTime = current.getTime() - target.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`;
  }
  
  let years = target.getFullYear() - current.getFullYear();
  let months = target.getMonth() - current.getMonth();
  let days = target.getDate() - current.getDate();
  
  if (days < 0) {
    months--;
    // Get total days in the previous month of target
    const prevMonthDate = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonthDate.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} year${years > 1 ? 's' : ''}`);
  }
  if (months > 0) {
    parts.push(`${months} month${months > 1 ? 's' : ''}`);
  }
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  
  if (parts.length === 0) return 'today';
  return parts.join(' ');
}

// Parse text input for date autocompletion with user guidelines:
// tod -> today
// tom -> tomorrow
// o -> overmorrow
// mon/tue/wed/thu/fri/sat/sun -> next day of week
export function parseTextToDate(input: string, todayStr: string): { date: string; label: string } | null {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  const today = new Date(todayStr + 'T12:00:00');

  // Prefix matching today, tomorrow, overmorrow
  if ('today'.startsWith(clean) && clean.length >= 3) {
    return { date: todayStr, label: 'Today' };
  }
  if ('tomorrow'.startsWith(clean) && clean.length >= 3) {
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);
    return { date: formatDate(tom), label: 'Tomorrow' };
  }
  if ('overmorrow'.startsWith(clean) && clean.length >= 1) {
    const over = new Date(today);
    over.setDate(today.getDate() + 2);
    return { date: formatDate(over), label: 'Overmorrow' };
  }

  // Weekday abbreviations
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const fullDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  let matchedDayIndex = -1;
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (daysOfWeek[i].startsWith(clean) || fullDays[i].startsWith(clean)) {
      matchedDayIndex = i;
      break;
    }
  }

  if (matchedDayIndex !== -1) {
    // Find next day of the week
    const resultDate = new Date(today);
    const currentDayIndex = today.getDay();
    let daysToAdd = matchedDayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Must be in the future (next occurrence)
    }
    resultDate.setDate(today.getDate() + daysToAdd);
    const dayLabel = fullDays[matchedDayIndex].charAt(0).toUpperCase() + fullDays[matchedDayIndex].slice(1);
    return { date: formatDate(resultDate), label: `Next ${dayLabel}` };
  }

  // Fallback to standard date string parsing (e.g., 2027-02-02 or 2/2/27)
  const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
  const match = clean.match(dateRegex);
  if (match) {
    let m = parseInt(match[1]) - 1;
    let d = parseInt(match[2]);
    let y = parseInt(match[3]);
    if (y < 100) {
      y += 2000; // assume 20xx
    }
    const customDate = new Date(y, m, d, 12, 0, 0);
    if (!isNaN(customDate.getTime())) {
      return { date: formatDate(customDate), label: customDate.toLocaleDateString() };
    }
  }

  return null;
}

// Format typed time: e.g. "430" or "430a" -> "04:30" (internal HH:MM)
// and displays formatted string like "4:30 AM" or "4:30 PM"
export function parseTypedTime(input: string): { valid: boolean; raw: string; display: string } {
  const clean = input.trim().toLowerCase().replace(/:/g, '');
  if (!clean) return { valid: false, raw: '', display: '' };

  // Check if am/pm is specified
  const isAm = clean.includes('a');
  const isPm = clean.includes('p') || (!isAm && clean.endsWith('pm'));
  const digits = clean.replace(/[a-z]/g, '');

  if (!digits || isNaN(Number(digits))) {
    return { valid: false, raw: '', display: '' };
  }

  let hour = 12;
  let minute = 0;

  if (digits.length <= 2) {
    hour = parseInt(digits);
    minute = 0;
  } else if (digits.length === 3) {
    hour = parseInt(digits.substring(0, 1));
    minute = parseInt(digits.substring(1));
  } else if (digits.length === 4) {
    hour = parseInt(digits.substring(0, 2));
    minute = parseInt(digits.substring(2));
  } else {
    return { valid: false, raw: '', display: '' };
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { valid: false, raw: '', display: '' };
  }

  // Handle AM/PM adjustments
  let internalHour = hour;
  let ampmLabel = 'PM'; // default to PM for shorthand afternoon tasks

  if (isAm) {
    ampmLabel = 'AM';
    if (hour === 12) internalHour = 0;
  } else if (isPm) {
    ampmLabel = 'PM';
    if (hour < 12) internalHour += 12;
  } else {
    // If not specified, infer AM/PM based on typical office hours
    // (e.g. 1-7 implies PM, 8-12 is AM or PM, let's default 1-7 to PM, 8-11 to AM or PM)
    if (hour >= 1 && hour <= 7) {
      internalHour += 12;
      ampmLabel = 'PM';
    } else if (hour === 12) {
      internalHour = 12;
      ampmLabel = 'PM';
    } else {
      ampmLabel = hour >= 12 ? 'PM' : 'AM';
    }
  }

  const raw = `${String(internalHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const displayHour = hour === 0 || hour === 12 ? 12 : hour % 12;
  const display = `${displayHour}:${String(minute).padStart(2, '0')} ${ampmLabel}`;

  return { valid: true, raw, display };
}

// Convert "HH:MM" (military time) to "H:MM AM/PM"
export function formatMilitaryToDisplay(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Algorithm-based priority scoring
export function computeAutoPriorityScore(task: Task, todayStr: string): number {
  if (task.isCompleted) return -99999; // Completed tasks go to the bottom

  let score = 0;

  // 1. Rollover Check (Highest priority!)
  // If "doDate" is strictly before today and task is not completed, it has rolled over!
  if (task.doDate && task.doDate < todayStr) {
    const overdueDays = Math.max(1, Math.floor((new Date(todayStr).getTime() - new Date(task.doDate).getTime()) / (1000 * 60 * 60 * 24)));
    score += 10000 + overdueDays * 500; // Large rollover bonus
  }

  // 2. Due Date Approach
  if (task.dueDate) {
    if (task.dueDate <= todayStr) {
      score += 8000; // Overdue or due today
    } else {
      const diffTime = new Date(task.dueDate).getTime() - new Date(todayStr).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        score += 5000; // Due tomorrow
      } else if (diffDays <= 3) {
        score += 3000; // Due in 3 days
      } else if (diffDays <= 7) {
        score += 1000; // Due this week
      }
    }
  }

  // 3. Do Date is today
  if (task.doDate === todayStr) {
    score += 4000;
  }

  // 4. Progress made
  // Progress tasks are slightly higher priority to encourage finishing
  if (task.progressCount > 0) {
    score += 500;
  }

  // 5. Inherent user-assigned rank
  // Subtly factor in manual priority ordering so that tasks can be ordered amongst each other.
  // Lower task.priority (closer to 1) means higher manual importance.
  // We subtract priority to maintain proper rank ordering.
  score += (1000 - task.priority);

  return score;
}

// Calculate the active streak using 3-day grace period
export function calculateStreak(completionHistory: { [date: string]: number }, todayStr: string): number {
  const dates = Object.keys(completionHistory)
    .filter(d => completionHistory[d] > 0)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort newest to oldest

  if (dates.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date(todayStr + 'T12:00:00');
  
  // Track consecutive days. If a gap is more than 3 days, streak resets.
  // First, verify if the user has been active within the last 3 days (otherwise streak is currently 0)
  const newestDate = new Date(dates[0] + 'T12:00:00');
  const gapToToday = Math.floor((currentDate.getTime() - newestDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (gapToToday > 3) {
    return 0; // Missed more than 3 days
  }

  // Count streak backwards
  let index = 0;
  let activeCheckDate = new Date(dates[0] + 'T12:00:00');
  streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevActiveDate = new Date(dates[i] + 'T12:00:00');
    const gap = Math.floor((activeCheckDate.getTime() - prevActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (gap <= 3) {
      streak++;
      activeCheckDate = prevActiveDate;
    } else {
      break; // Gap exceeds 3 days, streak stops counting back
    }
  }

  return streak;
}

// Check if category is a descendant of another category (prevents cyclic category nests)
export function isCategoryDescendant(categories: Category[], childId: string, parentId: string): boolean {
  let curr = categories.find(c => c.id === parentId);
  while (curr) {
    if (curr.id === childId) return true;
    if (!curr.parentId) break;
    curr = categories.find(c => c.id === curr!.parentId);
  }
  return false;
}

// Check if space is a descendant of another space (prevents cyclic space nests)
export function isSpaceDescendant(spaces: Space[], childId: string, parentId: string): boolean {
  let curr = spaces.find(s => s.id === parentId);
  while (curr) {
    if (curr.id === childId) return true;
    if (!curr.parentId) break;
    curr = spaces.find(s => s.id === curr!.parentId);
  }
  return false;
}
