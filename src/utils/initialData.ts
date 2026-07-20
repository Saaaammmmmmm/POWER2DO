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

export const initialCategories: Category[] = [];

export const initialSpaces: Space[] = [];

export const initialTasks: Task[] = [];

export const initialGmailEmails: GmailEmail[] = [];

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
