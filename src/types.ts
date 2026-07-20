export interface Category {
  id: string;
  title: string;
  color: string;
  emoji: string;
  parentId: string | null; // Supports categories within categories
}

export interface Space {
  id: string;
  title: string;
  color: string;
  emoji: string;
  parentId: string | null; // Supports spaces within spaces
  isAutomatic?: boolean;
  autoType?: 'today' | 'tomorrow' | 'no-internet' | 'under-30-mins' | 'high-priority';
}

export interface Task {
  id: string;
  name: string;
  description: string;
  category: string; // Category ID
  spaces: string[]; // Space IDs
  dueDate: string; // Optional: YYYY-MM-DD
  doDate: string;  // Required: YYYY-MM-DD, empty string indicates incomplete info marker
  isCompleted: boolean;
  progressCount: number; // 0 = not started, >0 means progress was made
  repeatInterval: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  priority: number; // 1-based order rank
  duration: number; // Estimated minutes, default 45
  startTime: string; // Optional, format: "HH:MM" (e.g., "16:30")
  parentId: string | null; // Parent task ID for nested subtasks
  createdAt: string; // YYYY-MM-DD
}

export interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD when app was last used/task completed
  completionHistory: { [date: string]: number }; // Date YYYY-MM-DD -> number of completed or progress actions
}

export interface CustomFilter {
  id: string;
  name: string;
  categoryIds: string[];
  spaceIds: string[];
  minDuration: number | null;
  maxDuration: number | null;
  hasDueDate: boolean | null;
  isOverdue: boolean | null;
}

export interface AppSettings {
  dayChangeTime: string; // "00:00" to "23:59", default "04:00" (4 AM)
  defaultCategory: string; // ID of default category
  defaultDuration: number; // default duration in minutes (e.g. 45)
  defaultStartTime: string; // default start time format "HH:MM" or empty
  defaultRepeat: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  automaticSpaces: string[]; // Enabled automatic space keys
  creatorCompactness: 'normal' | 'compact' | 'tiny';
  creatorFontSize: 'xs' | 'sm' | 'base';
  minFontSize: number; // minimum font size for long category names
  timeblindMultiplier: number; // default 2.5
  taskShadowColorMode: 'category' | 'space' | 'urgency' | 'duration' | 'none' | 'custom';
  taskShadowColorCustom: string; // hex color for custom shadow
  listColumns: string[]; // e.g. ['name', 'do', 'due', 'start', 'duration']
  theme: {
    primaryColor: string; // hex
    accentColor: string;  // hex
    cardColor: string;    // hex
    halftoneEnabled: boolean;
    colorMappings: {
      categoryColorEnabled: boolean;
      spaceColorEnabled: boolean;
      progressColorEnabled: boolean;
    };
  };
}

export interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isRead: boolean;
}

export interface UndoAction {
  id: string;
  description: string;
  undo: () => void;
}
