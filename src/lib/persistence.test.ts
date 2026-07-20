import { describe, expect, it } from 'vitest';
import { resolvePersistedUserState } from './persistence';

describe('resolvePersistedUserState', () => {
  it('prefers the newest snapshot between remote, local, and fallback state', () => {
    const fallback = {
      tasks: [],
      categories: [],
      spaces: [],
      settings: {
        dayChangeTime: '04:00',
        defaultCategory: '',
        defaultDuration: 45,
        defaultStartTime: '',
        defaultRepeat: 'none' as const,
        automaticSpaces: [],
        creatorCompactness: 'normal' as const,
        creatorFontSize: 'sm' as const,
        minFontSize: 10,
        timeblindMultiplier: 2.5,
        taskShadowColorMode: 'none' as const,
        taskShadowColorCustom: '#000000',
        listColumns: [],
        theme: {
          primaryColor: '#000000',
          accentColor: '#000000',
          cardColor: '#FFFFFF',
          halftoneEnabled: false,
          colorMappings: {
            categoryColorEnabled: false,
            spaceColorEnabled: false,
            progressColorEnabled: false,
          },
        },
      },
      filters: [],
      gmail: [],
      streak: {
        currentStreak: 0,
        lastActiveDate: '',
        completionHistory: {},
      },
      updatedAt: 0,
    };

    const remote = {
      ...fallback,
      tasks: [{ id: 'task-1', name: 'Remote task', description: '', category: '', spaces: [], dueDate: '', doDate: '', isCompleted: false, progressCount: 0, repeatInterval: 'none' as const, priority: 1, duration: 45, startTime: '', parentId: null, createdAt: '' }],
      updatedAt: 300,
    };

    const local = {
      ...fallback,
      tasks: [{ id: 'task-2', name: 'Local task', description: '', category: '', spaces: [], dueDate: '', doDate: '', isCompleted: false, progressCount: 0, repeatInterval: 'none' as const, priority: 1, duration: 45, startTime: '', parentId: null, createdAt: '' }],
      updatedAt: 200,
    };

    const result = resolvePersistedUserState(remote, local, fallback);

    expect(result.tasks[0].name).toBe('Remote task');
    expect(result.updatedAt).toBe(300);
  });
});
