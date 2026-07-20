import { Category, Space, Task, AppSettings, GmailEmail } from '../types';
import { formatDate } from './taskHelpers';

const today = new Date();
const todayStr = formatDate(today);

const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
const tomorrowStr = formatDate(tomorrow);

const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const yesterdayStr = formatDate(yesterday);

const threeDaysAgo = new Date();
threeDaysAgo.setDate(today.getDate() - 3);
const threeDaysAgoStr = formatDate(threeDaysAgo);

export const initialCategories: Category[] = [
  { id: 'cat-personal', title: 'Personal', color: '#FF3B30', emoji: '🏠', parentId: null },
  { id: 'cat-home-projects', title: 'Home DIY', color: '#FF9500', emoji: '🔨', parentId: 'cat-personal' }, // subcategory!
  { id: 'cat-work', title: 'Work Stuff', color: '#007AFF', emoji: '💼', parentId: null },
  { id: 'cat-work-marketing', title: 'Marketing Campaign', color: '#5856D6', emoji: '📢', parentId: 'cat-work' }, // subcategory!
  { id: 'cat-fitness', title: 'Fitness', color: '#4CD964', emoji: '⚡', parentId: null },
  { id: 'cat-learning', title: 'Super Learning', color: '#FFCC00', emoji: '📚', parentId: null },
];

export const initialSpaces: Space[] = [
  { id: 'space-home', title: 'At Home', color: '#FF2D55', emoji: '🏡', parentId: null },
  { id: 'space-garden', title: 'In the Garden', color: '#34C759', emoji: '🌿', parentId: 'space-home' }, // sub-space!
  { id: 'space-night', title: 'Night Owl', color: '#5856D6', emoji: '🌙', parentId: null },
  { id: 'space-no-internet', title: 'No Web Needed', color: '#8E8E93', emoji: '🔌', parentId: null },
  
  // Automatic spaces
  { id: 'space-auto-today', title: 'Today\'s Power Tasks', color: '#4CD964', emoji: '📅', parentId: null, isAutomatic: true, autoType: 'today' },
  { id: 'space-auto-under-30', title: 'Quick (<30m)', color: '#5AC8FA', emoji: '⚡', parentId: null, isAutomatic: true, autoType: 'under-30-mins' },
  { id: 'space-auto-high-priority', title: 'High Priority', color: '#FF9500', emoji: '🔥', parentId: null, isAutomatic: true, autoType: 'high-priority' },
];

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    name: 'Assemble the Mega Bookshelf',
    description: 'Build the new double-wide wooden bookshelf in the study. Heavy lifting!',
    category: 'cat-home-projects',
    spaces: ['space-home'],
    dueDate: tomorrowStr,
    doDate: todayStr,
    isCompleted: false,
    progressCount: 0,
    repeatInterval: 'none',
    priority: 1,
    duration: 90,
    startTime: '10:00',
    parentId: null,
    createdAt: yesterdayStr,
  },
  {
    id: 'task-1-sub1',
    name: 'Unbox wooden panels and count screws',
    description: 'Ensure we have all 48 structural metal dowels first.',
    category: 'cat-home-projects',
    spaces: ['space-home'],
    dueDate: tomorrowStr,
    doDate: todayStr,
    isCompleted: false,
    progressCount: 1, // Progress has been made!
    repeatInterval: 'none',
    priority: 2,
    duration: 20,
    startTime: '10:15',
    parentId: 'task-1', // Subtask of Assemble the Mega Bookshelf
    createdAt: yesterdayStr,
  },
  {
    id: 'task-1-sub1-sub1',
    name: 'Polish the veneer outer finish',
    description: 'Use custom wax to make it match the wooden desk.',
    category: 'cat-home-projects',
    spaces: ['space-home'],
    dueDate: tomorrowStr,
    doDate: todayStr,
    isCompleted: false,
    progressCount: 0,
    repeatInterval: 'none',
    priority: 3,
    duration: 15,
    startTime: '10:20',
    parentId: 'task-1-sub1', // Sub-subtask (grandchild)!
    createdAt: yesterdayStr,
  },
  {
    id: 'task-2',
    name: 'Design Comic-Book Landing Banner',
    description: 'Create the primary advertising graphic with retro halftone dots.',
    category: 'cat-work-marketing',
    spaces: ['space-night'],
    dueDate: '',
    doDate: todayStr,
    isCompleted: false,
    progressCount: 0,
    repeatInterval: 'none',
    priority: 4,
    duration: 45,
    startTime: '20:30',
    parentId: null,
    createdAt: yesterdayStr,
  },
  {
    id: 'task-3',
    name: 'Rolled Over Task Example',
    description: 'This task was supposed to be done yesterday but rolled over to today. It automatically gets top priority score!',
    category: 'cat-personal',
    spaces: ['space-home'],
    dueDate: tomorrowStr,
    doDate: yesterdayStr, // Rolled over!
    isCompleted: false,
    progressCount: 2, // Progress made on multiple occasions
    repeatInterval: 'none',
    priority: 5,
    duration: 30,
    startTime: '',
    parentId: null,
    createdAt: threeDaysAgoStr,
  },
  {
    id: 'task-4',
    name: 'Stretch and Meditate',
    description: 'Daily zen session to clear the workspace clutter.',
    category: 'cat-fitness',
    spaces: ['space-home', 'space-no-internet'],
    dueDate: '',
    doDate: todayStr,
    isCompleted: true, // Already completed to demonstrate checkmarks and completed logs
    progressCount: 0,
    repeatInterval: 'daily',
    priority: 6,
    duration: 15,
    startTime: '08:00',
    parentId: null,
    createdAt: yesterdayStr,
  },
  {
    id: 'task-5',
    name: 'Read Comic Book History Chapter 3',
    description: 'Study the golden age of halftone printing and pop art coloring.',
    category: 'cat-learning',
    spaces: ['space-no-internet', 'space-night'],
    dueDate: '',
    doDate: '', // Empty do date = triggers "incomplete marker"
    isCompleted: false,
    progressCount: 0,
    repeatInterval: 'none',
    priority: 7,
    duration: 40,
    startTime: '',
    parentId: null,
    createdAt: todayStr,
  }
];

export const initialGmailEmails: GmailEmail[] = [
  {
    id: 'gmail-1',
    subject: 'Urgent: Review Marketing Graphics Drafts',
    from: 'marketing-team@powercompany.com',
    snippet: 'Hey Sam, please look at the attached comic banner designs. We need to finalize the halftone parameters before Monday!',
    date: '10:42 AM',
    isRead: false,
  },
  {
    id: 'gmail-2',
    subject: 'Google Calendar Schedule Sync Update',
    from: 'noreply@google-calendar.com',
    snippet: 'Your calendar import link is active. Use this feed URL in your settings menu to overlay event blocks.',
    date: 'Yesterday',
    isRead: false,
  },
  {
    id: 'gmail-3',
    subject: 'Weekly Comic Art Guild Newsletter',
    from: 'newsletter@comicartguild.org',
    snippet: 'Discover the latest releases in pop-art, bento layout boards, and physical ink textures.',
    date: 'July 18, 2026',
    isRead: true,
  }
];

export const defaultSettings: AppSettings = {
  dayChangeTime: '04:00', // 4 AM daily reset
  defaultCategory: 'cat-personal',
  defaultDuration: 45,
  defaultStartTime: '',
  defaultRepeat: 'none',
  automaticSpaces: ['space-auto-today', 'space-auto-under-30', 'space-auto-high-priority'],
  creatorCompactness: 'normal',
  creatorFontSize: 'sm',
  minFontSize: 10,
  timeblindMultiplier: 2.5,
  taskShadowColorMode: 'category',
  taskShadowColorCustom: '#000000',
  listColumns: ['name', 'doDate', 'dueDate', 'startTime', 'duration'],
  theme: {
    primaryColor: '#FFDE4D', // Pop Yellow
    accentColor: '#FF007F',  // Pop Pink
    cardColor: '#FFFFFF',
    halftoneEnabled: true,
    colorMappings: {
      categoryColorEnabled: true,
      spaceColorEnabled: true,
      progressColorEnabled: true,
    }
  }
};
