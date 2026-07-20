import React, { useState, useEffect } from 'react';
import { Task, Category, Space, AppSettings, GmailEmail, CustomFilter, StreakData } from './types';
import { initialCategories, initialSpaces, initialTasks, initialGmailEmails, defaultSettings } from './utils/initialData';
import { getAppTodayStr, formatDate, calculateRelativeTime, computeAutoPriorityScore, calculateStreak, formatMilitaryToDisplay } from './utils/taskHelpers';
import { createUserStorageKey, loadPersistedUserState, savePersistedUserState, clearPersistedUserState, subscribeToPersistenceSync, type PersistedUserState } from './lib/persistence';

// Components
import Sidebar from './components/Sidebar';
import TaskRow from './components/TaskRow';
import TaskForm from './components/TaskForm';
import CalendarView from './components/CalendarView';
import SettingsPanel from './components/SettingsPanel';
import BarfPage from './components/BarfPage';
import SignInPage from './components/SignInPage';
import StreakCalendar from './components/StreakCalendar';
import ComicInterjection, { triggerComicInterjection } from './components/ComicInterjection';

// Icons
import {
  Sparkles,
  Trophy,
  Settings as SettingsIcon,
  LayoutGrid,
  Calendar as CalendarIcon,
  ArrowUpDown,
  Smartphone,
  Laptop,
  Undo2,
  Trash2,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Smile
} from 'lucide-react';

export default function App() {
  // 1. AUTH / SIGN IN STATE
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('power_todo_user') || null;
  });

  // 2. CORE STATES
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [gmailEmails, setGmailEmails] = useState<GmailEmail[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastActiveDate: '',
    completionHistory: {}
  });

  // 3. UI VIEW & FILTER STATES
  const [viewMode, setViewMode] = useState<'list' | 'daily' | 'calendar' | 'settings' | 'barf'>('list');
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [activeSpaceIds, setActiveSpaceIds] = useState<string[]>([]);
  const [activeCustomFilterId, setActiveCustomFilterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sort / Subsort
  const [sortFactor, setSortFactor] = useState<string>('priority');
  const [subSortFactor, setSubSortFactor] = useState<string>('name');

  // Custom Detail Drawer
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Undo Notification Stack
  const [toasts, setToasts] = useState<{ id: string; description: string; undo: () => void }[]>([]);

  // Mobile overrides
  const [mobileOverride, setMobileOverride] = useState<boolean>(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Streak Calendar Popover
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);

  // Active drag helper
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Edit fields inside Mission Plan Detail Sidebar
  const [detailName, setDetailName] = useState('');
  const [detailDesc, setDetailDesc] = useState('');
  const [detailDoDate, setDetailDoDate] = useState('');
  const [detailDueDate, setDetailDueDate] = useState('');
  const [detailDuration, setDetailDuration] = useState(45);
  const [detailStartTime, setDetailStartTime] = useState('');
  const [detailRepeat, setDetailRepeat] = useState<Task['repeatInterval']>('none');

  const appTodayStr = getAppTodayStr(settings.dayChangeTime);

  // Sync window size
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
      if (isMobile) {
        setMobileOverride(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Event dispatcher for Calendar task creation
  useEffect(() => {
    const handleCalendarAddTask = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        handleAddTask(customEvent.detail);
      }
    };
    window.addEventListener('add-task-from-calendar', handleCalendarAddTask);
    return () => window.removeEventListener('add-task-from-calendar', handleCalendarAddTask);
  }, [tasks]);

  // LOAD USER DB STATE ON LOGIN
  useEffect(() => {
    if (!currentUserEmail) return;

    const loadUserData = async () => {
      const fallbackState: PersistedUserState = {
        tasks: initialTasks,
        categories: initialCategories,
        spaces: initialSpaces,
        settings: defaultSettings,
        filters: [],
        gmail: initialGmailEmails,
        streak: {
          currentStreak: 0,
          lastActiveDate: '',
          completionHistory: {},
        },
        updatedAt: 0,
      };

      const loadedState = await loadPersistedUserState(currentUserEmail, fallbackState);

      if (loadedState.streak.currentStreak === 0 && !loadedState.streak.lastActiveDate && Object.keys(loadedState.streak.completionHistory).length === 0) {
        const seededHistory: { [d: string]: number } = {};
        seededHistory[appTodayStr] = 1;
        const seededState = {
          ...loadedState,
          streak: {
            currentStreak: 1,
            lastActiveDate: appTodayStr,
            completionHistory: seededHistory,
          },
        };
        setTasks(seededState.tasks);
        setCategories(seededState.categories);
        setSpaces(seededState.spaces);
        setSettings(seededState.settings);
        setCustomFilters(seededState.filters);
        setGmailEmails(seededState.gmail);
        setStreakData(seededState.streak);
      } else {
        setTasks(loadedState.tasks);
        setCategories(loadedState.categories);
        setSpaces(loadedState.spaces);
        setSettings(loadedState.settings);
        setCustomFilters(loadedState.filters);
        setGmailEmails(loadedState.gmail);
        setStreakData(loadedState.streak);
      }
    };

    loadUserData();
  }, [currentUserEmail, appTodayStr]);

  useEffect(() => {
    if (!currentUserEmail) return;

    const unsubscribe = subscribeToPersistenceSync(currentUserEmail, () => {
      const fallbackState: PersistedUserState = {
        tasks,
        categories,
        spaces,
        settings,
        filters: customFilters,
        gmail: gmailEmails,
        streak: streakData,
        updatedAt: Date.now(),
      };

      void loadPersistedUserState(currentUserEmail, fallbackState).then((nextState) => {
        setTasks(nextState.tasks);
        setCategories(nextState.categories);
        setSpaces(nextState.spaces);
        setSettings(nextState.settings);
        setCustomFilters(nextState.filters);
        setGmailEmails(nextState.gmail);
        setStreakData(nextState.streak);
      });
    });

    return unsubscribe;
  }, [currentUserEmail, tasks, categories, spaces, settings, customFilters, gmailEmails, streakData]);

  // SAVE CORE DATABASE STATES AUTOMATICALLY
  useEffect(() => {
    if (!currentUserEmail) return;
    void savePersistedUserState(currentUserEmail, {
      tasks,
      categories,
      spaces,
      settings,
      filters: customFilters,
      gmail: gmailEmails,
      streak: streakData,
      updatedAt: Date.now(),
    });
  }, [tasks, categories, spaces, settings, customFilters, gmailEmails, streakData, currentUserEmail]);

  // PARSE & INJECT URL FILTERS (BOOKMARKING)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (!hash) return;
      const params = new URLSearchParams(hash);
      
      const urlCats = params.get('cats');
      if (urlCats) {
        setActiveCategoryIds(urlCats.split(',').filter(Boolean));
      } else if (urlCats === '') {
        setActiveCategoryIds([]);
      }
      
      const urlSpaces = params.get('spaces');
      if (urlSpaces) {
        setActiveSpaceIds(urlSpaces.split(',').filter(Boolean));
      } else if (urlSpaces === '') {
        setActiveSpaceIds([]);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when filters change
  useEffect(() => {
    if (!currentUserEmail) return;
    const params = new URLSearchParams();
    params.set('cats', activeCategoryIds.join(','));
    params.set('spaces', activeSpaceIds.join(','));
    window.location.hash = params.toString();
  }, [activeCategoryIds, activeSpaceIds, currentUserEmail]);

  // Sync selected task details to detail states
  useEffect(() => {
    if (selectedTaskDetail) {
      setDetailName(selectedTaskDetail.name);
      setDetailDesc(selectedTaskDetail.description);
      setDetailDoDate(selectedTaskDetail.doDate);
      setDetailDueDate(selectedTaskDetail.dueDate);
      setDetailDuration(selectedTaskDetail.duration);
      setDetailStartTime(selectedTaskDetail.startTime || '');
      setDetailRepeat(selectedTaskDetail.repeatInterval);
    }
  }, [selectedTaskDetail]);

  // UTILITIES & HANDLERS
  const pushUndoAction = (description: string, undoFn: () => void) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, description, undo: undoFn }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 7000);
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newId = 'task-' + Math.random().toString(36).substring(2, 9);
    const newTask: Task = {
      ...taskData,
      id: newId,
      createdAt: appTodayStr,
    };

    setTasks(prev => [...prev, newTask]);
    pushUndoAction(`Mission "${newTask.name}" initialized!`, () => {
      setTasks(prev => prev.filter(t => t.id !== newId));
    });
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldState = task.isCompleted;
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, isCompleted: !oldState } : t))
    );

    if (!oldState) {
      triggerComicInterjection();
      
      setStreakData(prev => {
        const hist = { ...prev.completionHistory };
        hist[appTodayStr] = (hist[appTodayStr] || 0) + 1;
        const currentStreak = calculateStreak(hist, appTodayStr);
        return {
          ...prev,
          completionHistory: hist,
          currentStreak,
          lastActiveDate: appTodayStr,
        };
      });
    }

    pushUndoAction(`Mission "${task.name}" ${!oldState ? 'conquered' : 'reactivated'}!`, () => {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, isCompleted: oldState } : t))
      );
      if (!oldState) {
        setStreakData(prev => {
          const hist = { ...prev.completionHistory };
          if (hist[appTodayStr] > 0) hist[appTodayStr]--;
          const currentStreak = calculateStreak(hist, appTodayStr);
          return { ...prev, completionHistory: hist, currentStreak };
        });
      }
    });
  };

  const handleIncrementProgress = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldVal = task.progressCount;
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, progressCount: oldVal + 1 } : t))
    );

    triggerComicInterjection();

    setStreakData(prev => {
      const hist = { ...prev.completionHistory };
      hist[appTodayStr] = (hist[appTodayStr] || 0) + 1;
      const currentStreak = calculateStreak(hist, appTodayStr);
      return {
        ...prev,
        completionHistory: hist,
        currentStreak,
        lastActiveDate: appTodayStr,
      };
    });

    pushUndoAction(`Incremental progress logged on "${task.name}"`, () => {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, progressCount: oldVal } : t))
      );
    });
  };

  const handleUpdateTaskDate = (taskId: string, newDo: string, newDue?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldDo = task.doDate;
    const oldDue = task.dueDate;

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, doDate: newDo, dueDate: newDue !== undefined ? newDue : t.dueDate }
          : t
      )
    );

    pushUndoAction(`Mission scheduled date set to ${newDo}`, () => {
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, doDate: oldDo, dueDate: oldDue } : t))
      );
    });
  };

  const handleUpdateTaskTime = (taskId: string, newDo: string, startTime: string, duration?: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldDo = task.doDate;
    const oldStart = task.startTime;
    const oldDur = task.duration;

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              doDate: newDo,
              startTime,
              duration: duration !== undefined ? duration : t.duration,
            }
          : t
      )
    );

    pushUndoAction(`Time block locked at ${startTime}`, () => {
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, doDate: oldDo, startTime: oldStart, duration: oldDur }
            : t
        )
      );
    });
  };

  const handleBoostPriority = (taskId: string) => {
    const maxPri = Math.max(...tasks.map(t => t.priority || 0), 0);
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, priority: maxPri + 1 } : t))
    );
    triggerComicInterjection();
    pushUndoAction('Priority boosted to TOP RANK!', () => {
      // no-op simple reset fallback
    });
  };

  const handleDropOnCategory = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    const taskId = activeDragId || JSON.parse(e.dataTransfer.getData('application/json')).taskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, category: categoryId } : t)));
    triggerComicInterjection();
  };

  const handleDropOnSpace = (e: React.DragEvent, spaceId: string) => {
    e.preventDefault();
    const taskId = activeDragId || JSON.parse(e.dataTransfer.getData('application/json')).taskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const spacesSet = new Set(t.spaces);
          spacesSet.add(spaceId);
          return { ...t, spaces: Array.from(spacesSet) };
        }
        return t;
      })
    );
    triggerComicInterjection();
  };

  const handleDropOnAutoSpace = (e: React.DragEvent, autoSpaceId: string) => {
    e.preventDefault();
    const taskId = activeDragId || JSON.parse(e.dataTransfer.getData('application/json')).taskId;
    if (!taskId) return;

    const space = spaces.find(s => s.id === autoSpaceId);
    if (!space) return;

    if (space.autoType === 'today') {
      handleUpdateTaskDate(taskId, appTodayStr);
    } else if (space.autoType === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(new Date(appTodayStr).getDate() + 1);
      handleUpdateTaskDate(taskId, formatDate(tomorrow));
    }
  };

  const handleTaskNestingChange = (childId: string, parentId: string | null) => {
    setTasks(prev => prev.map(t => (t.id === childId ? { ...t, parentId } : t)));
  };

  const handleBreakParentLink = (taskId: string) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, parentId: null } : t)));
    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail({ ...selectedTaskDetail, parentId: null });
    }
  };

  const handleAddCategory = (title: string, parentId: string | null) => {
    const newId = 'cat-' + Math.random().toString(36).substring(2, 9);
    const colors = ['#FF2D55', '#34C759', '#007AFF', '#FFCC00', '#AF52DE', '#FF9500'];
    const emojis = ['💥', '🔥', '🚀', '🎨', '💼', '🏡', '📚'];
    
    const newCat: Category = {
      id: newId,
      title,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      parentId,
    };

    setCategories(prev => [...prev, newCat]);
    return newId;
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    setTasks(prev => prev.map(t => (t.category === catId ? { ...t, category: settings.defaultCategory } : t)));
  };

  const handleAddSpace = (title: string, parentId: string | null) => {
    const newId = 'space-' + Math.random().toString(36).substring(2, 9);
    const colors = ['#5856D6', '#E54666', '#4CD964', '#5AC8FA', '#FF9500'];
    const emojis = ['⚡', '💡', '🌙', '🔌'];

    const newSpace: Space = {
      id: newId,
      title,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      parentId,
    };

    setSpaces(prev => [...prev, newSpace]);
  };

  const handleDeleteSpace = (spaceId: string) => {
    setSpaces(prev => prev.filter(s => s.id !== spaceId));
    setTasks(prev => prev.map(t => ({ ...t, spaces: t.spaces.filter(id => id !== spaceId) })));
  };

  const handleAddCustomFilter = (filter: Omit<CustomFilter, 'id'>) => {
    const newId = 'filter-' + Math.random().toString(36).substring(2, 9);
    setCustomFilters(prev => [...prev, { ...filter, id: newId }]);
  };

  const handleDeleteCustomFilter = (filterId: string) => {
    setCustomFilters(prev => prev.filter(cf => cf.id !== filterId));
    if (activeCustomFilterId === filterId) setActiveCustomFilterId(null);
  };

  const handleLinkGmailAsTask = (email: GmailEmail) => {
    const dummyTask: Omit<Task, 'id' | 'createdAt'> = {
      name: `📧 [Gmail Sync]: ${email.subject}`,
      description: `From: ${email.from}\nSnippet: ${email.snippet}`,
      category: settings.defaultCategory,
      spaces: [],
      dueDate: '',
      doDate: appTodayStr,
      isCompleted: false,
      progressCount: 0,
      repeatInterval: 'none',
      priority: tasks.length + 1,
      duration: 15,
      startTime: '',
      parentId: null,
    };

    handleAddTask(dummyTask);
    setGmailEmails(prev =>
      prev.map(e => (e.id === email.id ? { ...e, isRead: true } : e))
    );
  };

  const handleToggleEmailRead = (emailId: string) => {
    setGmailEmails(prev =>
      prev.map(e => (e.id === emailId ? { ...e, isRead: !e.isRead } : e))
    );
  };

  const handleSaveTaskDetails = () => {
    if (!selectedTaskDetail) return;
    
    const updated = {
      ...selectedTaskDetail,
      name: detailName,
      description: detailDesc,
      doDate: detailDoDate,
      dueDate: detailDueDate,
      duration: detailDuration,
      startTime: detailStartTime,
      repeatInterval: detailRepeat,
    };

    setTasks(prev => prev.map(t => (t.id === selectedTaskDetail.id ? updated : t)));
    setSelectedTaskDetail(updated);
    pushUndoAction('Mission details updated successfully!', () => {
      setTasks(prev => prev.map(t => (t.id === selectedTaskDetail.id ? selectedTaskDetail : t)));
    });
  };

  const handleDuplicateTask = (task: Task) => {
    const dup: Task = {
      ...task,
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      name: `Copy of ${task.name}`,
      priority: tasks.length + 1,
    };
    setTasks(prev => [...prev, dup]);
  };

  const handleDeleteTask = (taskId: string) => {
    const tToDelete = tasks.find(t => t.id === taskId);
    if (!tToDelete) return;

    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTaskDetail && selectedTaskDetail.id === taskId) {
      setSelectedTaskDetail(null);
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('power_todo_user');
    }
    if (currentUserEmail) {
      await clearPersistedUserState(currentUserEmail);
    }
    setCurrentUserEmail(null);
  };

  // FILTERING LOGIC
  const getFilteredTasks = () => {
    let list = [...tasks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    // Category matching (Multi-select OR logic)
    if (activeCategoryIds.length > 0) {
      const allSelectedAndDescendants = new Set<string>();
      
      const getAllDescendants = (catId: string) => {
        allSelectedAndDescendants.add(catId);
        categories.filter(c => c.parentId === catId).forEach(child => {
          getAllDescendants(child.id);
        });
      };

      activeCategoryIds.forEach(id => getAllDescendants(id));
      list = list.filter(t => allSelectedAndDescendants.has(t.category));
    }

    // Spaces filters
    if (activeSpaceIds.length > 0) {
      list = list.filter(t => {
        return activeSpaceIds.every(spaceId => {
          const space = spaces.find(s => s.id === spaceId);
          if (!space) return false;

          if (space.isAutomatic) {
            if (space.autoType === 'today') return t.doDate === appTodayStr;
            if (space.autoType === 'tomorrow') {
              const tomorrow = new Date();
              tomorrow.setDate(new Date(appTodayStr).getDate() + 1);
              return t.doDate === formatDate(tomorrow);
            }
            if (space.autoType === 'under-30-mins') return t.duration <= 30;
            if (space.autoType === 'high-priority') return t.priority <= 3;
            return false;
          }

          const getAllDescendantsSpace = (spId: string): string[] => {
            const ids = [spId];
            spaces.filter(s => s.parentId === spId).forEach(child => {
              ids.push(...getAllDescendantsSpace(child.id));
            });
            return ids;
          };
          const allowedSpaceIds = getAllDescendantsSpace(spaceId);
          return t.spaces.some(id => allowedSpaceIds.includes(id));
        });
      });
    }

    // Custom Filter Mapping
    if (activeCustomFilterId) {
      const cf = customFilters.find(f => f.id === activeCustomFilterId);
      if (cf) {
        if (cf.categoryIds.length > 0) {
          list = list.filter(t => cf.categoryIds.includes(t.category));
        }
        if (cf.minDuration !== null) {
          list = list.filter(t => t.duration >= cf.minDuration!);
        }
        if (cf.maxDuration !== null) {
          list = list.filter(t => t.duration <= cf.maxDuration!);
        }
        if (cf.hasDueDate !== null) {
          list = list.filter(t => (cf.hasDueDate ? !!t.dueDate : !t.dueDate));
        }
      }
    }

    return list;
  };

  const filteredTasksList = getFilteredTasks();

  const getSortedTasks = () => {
    const list = [...filteredTasksList];

    const compareByFactor = (a: Task, b: Task, factor: string) => {
      if (factor === 'priority') {
        return computeAutoPriorityScore(b, appTodayStr) - computeAutoPriorityScore(a, appTodayStr);
      }
      if (factor === 'doDate') {
        if (!a.doDate) return 1;
        if (!b.doDate) return -1;
        return a.doDate.localeCompare(b.doDate);
      }
      if (factor === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (factor === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (factor === 'duration') {
        return a.duration - b.duration;
      }
      return 0;
    };

    list.sort((a, b) => {
      const primaryDiff = compareByFactor(a, b, sortFactor);
      if (primaryDiff !== 0) return primaryDiff;
      return compareByFactor(a, b, subSortFactor);
    });

    return list;
  };

  const sortedAndFilteredTasks = getSortedTasks();

  const totalIncompleteActiveTasks = tasks.filter(t => !t.isCompleted).length;
  const shownIncompleteActiveTasks = sortedAndFilteredTasks.filter(t => !t.isCompleted).length;
  const hiddenTasksCount = totalIncompleteActiveTasks - shownIncompleteActiveTasks;

  const handleClearAllFilters = () => {
    setActiveCategoryIds([]);
    setActiveSpaceIds([]);
    setActiveCustomFilterId(null);
    setSearchQuery('');
  };

  // Timeline Boards
  const dayTimelineDates: string[] = [];
  const baseDay = new Date(appTodayStr + 'T12:00:00');
  for (let i = 0; i < 5; i++) {
    const d = new Date(baseDay);
    d.setDate(baseDay.getDate() + i);
    dayTimelineDates.push(formatDate(d));
  }

  // Convert number to text representation
  const formatStreakToNaturalLanguage = (streak: number) => {
    const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    if (streak <= 10) {
      return `${words[streak]} day streak!`;
    }
    return `${streak} day streak!`;
  };

  if (!currentUserEmail) {
    return (
      <SignInPage
        currentUserEmail="samdonckels@gmail.com"
        onSignIn={(email) => setCurrentUserEmail(email)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-32 text-black font-sans overflow-x-hidden relative immersive-bg">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] z-0" />

      <ComicInterjection />

      {/* RE-ARCHITECTED SMALLER, SINGLE-LINE TOP BAR */}
      <header className="bg-white border-b-4 border-black p-2 sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo with coloured '2' */}
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => setViewMode('list')}>
            <h1 className="font-comic text-xl md:text-2xl font-extrabold tracking-tight uppercase select-none">
              POWER <span className="text-[#FF007F]">2</span>DO
            </h1>
          </div>

          {/* Interactive natural language streak link */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              id="streak-text-trigger"
              onClick={() => setShowStreakCalendar(!showStreakCalendar)}
              className="font-comic font-black text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              <span>{formatStreakToNaturalLanguage(streakData.currentStreak)}</span>
            </button>

            {showStreakCalendar && (
              <div className="absolute top-10 right-1/4 z-50 animate-comic-pop min-w-[300px]">
                <StreakCalendar
                  streakData={streakData}
                  todayStr={appTodayStr}
                  onClose={() => setShowStreakCalendar(false)}
                />
              </div>
            )}
          </div>

          {/* Collapsed Search Trigger (Search button instead of massive bar) */}
          <div className="flex-1 max-w-xs relative mx-2">
            <input
              id="header-search-bar"
              type="text"
              placeholder="🔍 Filter missions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-yellow-50/20 hover:bg-white px-2 py-1 border-2 border-black font-semibold text-[10px] focus:outline-none placeholder-gray-500 rounded-xl"
            />
          </div>

          {/* Single line navigation controls */}
          <div className="flex items-center gap-1">
            <button
              id="toggle-list-view"
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 border-2 border-black font-comic text-[10px] font-bold uppercase transition-colors cursor-pointer rounded-lg ${
                viewMode === 'list' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
              }`}
            >
              List
            </button>
            
            {!isMobileScreen && !mobileOverride && (
              <button
                id="toggle-daily-view"
                onClick={() => setViewMode('daily')}
                className={`px-2 py-1 border-2 border-black font-comic text-[10px] font-bold uppercase transition-colors cursor-pointer rounded-lg ${
                  viewMode === 'daily' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                Daily
              </button>
            )}

            <button
              id="toggle-calendar-view"
              onClick={() => setViewMode('calendar')}
              className={`px-2 py-1 border-2 border-black font-comic text-[10px] font-bold uppercase transition-colors cursor-pointer rounded-lg ${
                viewMode === 'calendar' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
              }`}
            >
              Calendar
            </button>

            <button
              id="toggle-barf-view"
              onClick={() => setViewMode('barf')}
              className={`px-2 py-1 border-2 border-black font-comic text-[10px] font-bold uppercase transition-colors cursor-pointer rounded-lg ${
                viewMode === 'barf' ? 'bg-[#FFDE4D] text-black' : 'bg-white hover:bg-gray-100'
              }`}
            >
              Barf
            </button>

            <button
              id="toggle-settings-view"
              onClick={() => setViewMode('settings')}
              className="p-1 border-2 border-black bg-white hover:bg-gray-100 transition-colors cursor-pointer rounded-lg"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* SPLIT WINDOW SYSTEM */}
      <main className="max-w-7xl mx-auto px-4 mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start relative z-10">
        
        {/* COLLAPSIBLE SIDEBAR CONTAINER */}
        {(!mobileOverride || showMobileSidebar) && !isSidebarCollapsed && (
          <div className={`md:col-span-3 transition-all duration-300 ${mobileOverride ? 'fixed inset-y-0 left-0 bg-white shadow-2xl p-4 z-50 w-80 border-r-4 border-black' : 'block'}`}>
            {mobileOverride && (
              <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                <span className="font-comic text-xs font-bold tracking-wide uppercase">NAVIGATION CONSOLE</span>
                <button
                  id="close-mobile-nav"
                  onClick={() => setShowMobileSidebar(false)}
                  className="bg-red-500 text-white p-1 rounded-lg border-2 border-black font-bold text-xs"
                >
                  X
                </button>
              </div>
            )}
            
            {/* Collapse Trigger on Desktop Sidebar top */}
            {!mobileOverride && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="w-full text-left font-mono text-[9px] text-gray-500 hover:text-black mb-2 uppercase tracking-tight block"
              >
                ◀ Collapse Navigation panel
              </button>
            )}

            <Sidebar
              categories={categories}
              spaces={spaces}
              tasks={tasks}
              customFilters={customFilters}
              activeCategoryIds={activeCategoryIds}
              activeSpaceIds={activeSpaceIds}
              activeCustomFilterId={activeCustomFilterId}
              onSelectCategories={setActiveCategoryIds}
              onSelectSpaces={setActiveSpaceIds}
              onSelectCustomFilter={setActiveCustomFilterId}
              onAddCategory={(title, parentId) => handleAddCategory(title, parentId)}
              onDeleteCategory={handleDeleteCategory}
              onAddSpace={(title, parentId) => handleAddSpace(title, parentId)}
              onDeleteSpace={handleDeleteSpace}
              onAddCustomFilter={handleAddCustomFilter}
              onDeleteCustomFilter={handleDeleteCustomFilter}
              onDragOver={(e) => e.preventDefault()}
              onDropOnCategory={handleDropOnCategory}
              onDropOnSpace={handleDropOnSpace}
              onDropOnAutoSpace={handleDropOnAutoSpace}
              isMobile={mobileOverride}
              onMobileClose={() => setShowMobileSidebar(false)}
            />
          </div>
        )}

        {/* SMALL FLOATING EXPANDER STRIP IF SIDEBAR COLLAPSED */}
        {!mobileOverride && isSidebarCollapsed && (
          <div className="col-span-1 bg-white border-4 border-black p-2 flex flex-col items-center justify-start gap-3">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              title="Expand Sidebar"
              className="p-1 bg-yellow-300 hover:bg-yellow-400 border-2 border-black font-bold text-xs cursor-pointer"
            >
              ▶
            </button>
            <span className="text-[9px] font-bold font-mono vertical-text text-gray-400 py-4 uppercase">NAV</span>
          </div>
        )}

        {/* MAIN BODY BOARD COLUMN */}
        <div className={`
          ${(!mobileOverride || showMobileSidebar) && !isSidebarCollapsed ? 'md:col-span-9' : isSidebarCollapsed ? 'md:col-span-11' : 'col-span-12'} 
          space-y-4 w-full
        `}>
          
          {mobileOverride && (
            <button
              id="open-mobile-sidebar-btn"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="w-full py-2 bg-[#FFDE4D] border-2 border-black font-comic text-xs uppercase font-bold text-black cursor-pointer"
            >
              📖 {showMobileSidebar ? 'Close filters deck' : 'Open category & spaces filter deck'}
            </button>
          )}

          {/* VIEW MODE 1: LIST VIEW */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              
              {/* Sort Bar */}
              <div className="bg-white p-2 border-4 border-black flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap font-bold">
                  <span className="text-gray-500 uppercase font-mono text-[9px]">Filters:</span>
                  <span className="bg-red-50 text-red-800 border-2 border-black px-1 py-0.2 text-[10px]">
                    Cat: {activeCategoryIds.length > 0 ? `${activeCategoryIds.length} Active` : 'All'}
                  </span>
                  {activeSpaceIds.map(spaceId => (
                    <span key={spaceId} className="bg-blue-50 text-blue-800 border-2 border-black px-1 py-0.2 text-[10px]">
                      {spaces.find(s => s.id === spaceId)?.title}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="font-extrabold text-[11px]">Sort:</span>
                    <select
                      id="sort-factor-select"
                      value={sortFactor}
                      onChange={e => setSortFactor(e.target.value)}
                      className="bg-white p-1 border-2 border-black text-[10px] font-bold focus:outline-none"
                    >
                      <option value="priority">🔥 Auto priority score</option>
                      <option value="doDate">🎯 Scheduled date</option>
                      <option value="dueDate">🏁 Due date limit</option>
                      <option value="name">🔤 Alphabetic title</option>
                      <option value="duration">⏱️ Duration range</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span>subsort:</span>
                    <select
                      id="subsort-factor-select"
                      value={subSortFactor}
                      onChange={e => setSubSortFactor(e.target.value)}
                      className="bg-white p-1 border border-gray-400 text-[10px] focus:outline-none"
                    >
                      <option value="priority">🔥 Auto score</option>
                      <option value="doDate">🎯 Scheduled date</option>
                      <option value="dueDate">🏁 Due date limit</option>
                      <option value="name">🔤 Alphabetic title</option>
                      <option value="duration">⏱️ Duration</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Column Headings for compactness */}
              {sortedAndFilteredTasks.filter(t => !t.isCompleted).length > 0 && (
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-yellow-100 border-4 border-black font-comic text-[10px] font-black uppercase select-none rounded-t-xl mb-[-16px] relative z-10">
                  {/* Done/Grip spacing placeholder matching TaskRow left padding/elements */}
                  <div className="w-[110px] shrink-0 flex items-center gap-1">
                    <span>Missions</span>
                  </div>
                  {/* Content columns */}
                  <div className="flex-1 grid grid-cols-12 gap-2">
                    {settings.listColumns.map(colKey => {
                      const getColSpan = (key: string, activeColumns: string[]) => {
                        if (key !== 'name') {
                          if (key === 'startTime' || key === 'duration') return 1;
                          return 2;
                        }
                        const otherActiveCols = activeColumns.filter(c => c !== 'name');
                        const otherSpansSum = otherActiveCols.reduce((sum, k) => {
                          if (k === 'startTime' || k === 'duration') return sum + 1;
                          return sum + 2;
                        }, 0);
                        return Math.max(3, 12 - otherSpansSum);
                      };

                      const colSpan = getColSpan(colKey, settings.listColumns);
                      const label = {
                        name: 'Name',
                        category: 'Category',
                        doDate: 'Do',
                        dueDate: 'Due',
                        startTime: 'Start Time',
                        duration: 'Duration'
                      }[colKey] || colKey;

                      return (
                        <div key={colKey} className={`md:col-span-${colSpan} truncate`}>
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tasks List */}
              <div id="tasks-list" className="space-y-3">
                {sortedAndFilteredTasks.filter(t => !t.isCompleted).length === 0 ? (
                  <div className="bg-white border-4 border-dashed border-gray-400 p-8 text-center text-gray-500 font-bold italic">
                    🎉 Excellent! All missions resolved. Clear filters or add new missions below!
                  </div>
                ) : (
                  <>
                    {sortedAndFilteredTasks
                      .filter(t => !t.isCompleted)
                      .map((task, idx) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          allTasks={tasks}
                          categories={categories}
                          spaces={spaces}
                          todayStr={appTodayStr}
                          calculatedPriority={idx + 1}
                          settings={settings}
                          onToggleComplete={handleToggleComplete}
                          onIncrementProgress={handleIncrementProgress}
                          onTaskClick={(t: Task) => setSelectedTaskDetail(t)}
                          onTaskEditTrigger={(taskObj: Task, option: string) => setSelectedTaskDetail(taskObj)}
                          onNestingChange={handleTaskNestingChange}
                          onBoostPriority={handleBoostPriority}
                          activeDragId={activeDragId}
                          onActiveDragIdChange={setActiveDragId}
                        />
                      ))}
                    
                    {hiddenTasksCount > 0 && (
                      <div className="text-center pt-2 pb-1 select-none">
                        <button
                          id="reminder-show-all-btn-subtle"
                          onClick={handleClearAllFilters}
                          className="text-[11px] text-gray-500 hover:text-black hover:underline font-bold transition-all bg-transparent border-0 p-0 cursor-pointer"
                        >
                          💡 {hiddenTasksCount} more active missions exist outside current view. Click here to Show All
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Completed Archives */}
                {sortedAndFilteredTasks.filter(t => t.isCompleted).length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-comic text-xs text-gray-500 tracking-wide uppercase mb-2">RESOLVED ARCHIVE DECK</h3>
                    <div className="opacity-80">
                      {sortedAndFilteredTasks
                        .filter(t => t.isCompleted)
                        .map((task, idx) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            allTasks={tasks}
                            categories={categories}
                            spaces={spaces}
                            todayStr={appTodayStr}
                            calculatedPriority={idx + 1}
                            settings={settings}
                            onToggleComplete={handleToggleComplete}
                            onIncrementProgress={handleIncrementProgress}
                            onTaskClick={(t: Task) => setSelectedTaskDetail(t)}
                            onTaskEditTrigger={(taskObj: Task, option: string) => setSelectedTaskDetail(taskObj)}
                            onNestingChange={handleTaskNestingChange}
                            onBoostPriority={handleBoostPriority}
                            activeDragId={activeDragId}
                            onActiveDragIdChange={setActiveDragId}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW MODE 2: DAILY PANEL TIMELINE */}
          {viewMode === 'daily' && !mobileOverride && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-[900px] items-start">
                {dayTimelineDates.map(dateStr => {
                  const dayTasks = tasks.filter(t => t.doDate === dateStr && !t.isCompleted);
                  const isToday = dateStr === appTodayStr;
                  const dayObj = new Date(dateStr + 'T12:00:00');

                  return (
                    <div
                      key={dateStr}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const taskId = activeDragId || JSON.parse(e.dataTransfer.getData('application/json')).taskId;
                        if (taskId) handleUpdateTaskDate(taskId, dateStr);
                      }}
                      className={`flex-1 min-w-[180px] bg-white border-4 border-black p-3 rounded-2xl ${
                        isToday ? 'bg-red-50/50 border-red-500 shadow-[4px_4px_0px_#000]' : 'shadow-[4px_4px_0px_#000]'
                      }`}
                    >
                      <div className={`text-center font-comic border-b-2 border-black pb-1.5 mb-2 ${isToday ? 'text-red-600 font-extrabold' : 'text-black'}`}>
                        <div className="text-sm uppercase font-black">{dayObj.toLocaleDateString('en', { weekday: 'long' })}</div>
                        <div className="text-[10px] font-mono">{dateStr} {isToday ? '(TODAY)' : ''}</div>
                      </div>

                      <div className="space-y-2 min-h-[250px]">
                        {dayTasks.map(task => {
                          const catObj = categories.find(c => c.id === task.category);
                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTaskDetail(task)}
                              style={{ backgroundColor: catObj?.color + '15', borderLeft: `6px solid ${catObj?.color || '#000'}` }}
                              className="border-2 border-black p-2 text-[11px] text-black cursor-pointer hover:scale-102 transition-all relative rounded-xl"
                            >
                              <div className="flex flex-col gap-1 min-h-[35px]">
                                <span className="font-extrabold truncate text-black">{task.name}</span>
                                <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                                  <span>⏱️ {task.duration}m</span>
                                  <span>{task.startTime ? formatMilitaryToDisplay(task.startTime) : '-'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {dayTasks.length === 0 && (
                          <div className="text-center text-gray-400 font-bold italic text-[10px] py-10">
                            Clear space!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <CalendarView
              tasks={tasks}
              categories={categories}
              todayStr={appTodayStr}
              settings={settings}
              onUpdateTaskDate={handleUpdateTaskDate}
              onUpdateTaskTime={handleUpdateTaskTime}
              onTaskClick={(t: Task) => setSelectedTaskDetail(t)}
            />
          )}

          {/* VIEW MODE 4: SETTINGS PANEL */}
          {viewMode === 'settings' && (
            <SettingsPanel
              settings={settings}
              categories={categories}
              availableSpaces={spaces}
              currentUserEmail={currentUserEmail}
              onUpdateSettings={setSettings}
              onToggleAuthPage={handleSignOut}
            />
          )}

          {/* VIEW MODE 5: MISSION BARF CHAMBER (Brain Dump) */}
          {viewMode === 'barf' && (
            <BarfPage
              tasks={tasks}
              categories={categories}
              gmailEmails={gmailEmails}
              todayStr={appTodayStr}
              onAddTask={handleAddTask}
              onToggleEmailRead={handleToggleEmailRead}
              onLinkGmailAsTask={handleLinkGmailAsTask}
              onTaskClick={(task) => setSelectedTaskDetail(task)}
            />
          )}

        </div>
      </main>

      {/* QUICK FLOATING CREATION DECK (Minimized form bar) */}
      {viewMode !== 'settings' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#2B95FF] border-t-4 border-black select-none">
          <TaskForm
            categories={categories}
            spaces={spaces}
            tasks={tasks}
            defaultCategory={settings.defaultCategory}
            todayStr={appTodayStr}
            settings={settings}
            onAddTask={handleAddTask}
            onAddCategory={(catData) => {
              const catId = handleAddCategory(catData.title, catData.parentId);
              return catId;
            }}
          />
        </div>
      )}

      {/* RETAIL MISSION PLAN DRAWER */}
      {selectedTaskDetail && (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white border-l-4 border-black md:rounded-l-3xl shadow-2xl flex flex-col justify-between animate-comic-pop overflow-hidden" id="task-detail-sidebar">
          
          {/* Header */}
          <div className="p-3 border-b-4 border-black bg-yellow-100 flex justify-between items-center select-none">
            <div>
              <span className="text-[9px] bg-black text-white px-1.5 py-0.5 font-mono font-bold uppercase">
                Mission Parameters
              </span>
              <h3 className="font-comic text-xl text-black truncate uppercase tracking-tight mt-0.5">
                MISSION PLAN
              </h3>
            </div>
            <button
              id="close-detail-drawer"
              onClick={() => setSelectedTaskDetail(null)}
              className="p-1 border-2 border-black bg-white hover:bg-red-400 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Inputs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-0.5">Mission Name</label>
              <input
                id="detail-name-input"
                type="text"
                value={detailName}
                onChange={e => setDetailName(e.target.value)}
                className="w-full bg-white border-2 border-black p-1.5 font-extrabold focus:outline-none focus:bg-yellow-50/20"
              />
            </div>

            {/* Description Notes with auto-parsed clickable anchors */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-0.5">Details / Checklist notes</label>
              <textarea
                id="detail-desc-input"
                rows={4}
                value={detailDesc}
                onChange={e => setDetailDesc(e.target.value)}
                placeholder="Insert details, checkable subtasks or reference URLs (https://...)"
                className="w-full bg-white border-2 border-black p-1.5 font-sans text-xs focus:outline-none"
              />
            </div>

            {/* Compute Hierarchy list for display */}
            {(() => {
              const parents: Task[] = [];
              let currParent = tasks.find(t => t.id === selectedTaskDetail.parentId);
              while (currParent) {
                parents.unshift(currParent);
                currParent = currParent.parentId ? tasks.find(t => t.id === currParent!.parentId) : undefined;
              }

              interface HierarchyItem {
                task: Task;
                level: number;
                isCurrent: boolean;
              }

              const getDescendants = (parentId: string, currentLevel: number): HierarchyItem[] => {
                const list: HierarchyItem[] = [];
                const directChildren = tasks.filter(t => t.parentId === parentId);
                directChildren.forEach(child => {
                  list.push({
                    task: child,
                    level: currentLevel,
                    isCurrent: false,
                  });
                  list.push(...getDescendants(child.id, currentLevel + 1));
                });
                return list;
              };

              const hierarchyList: HierarchyItem[] = [];
              parents.forEach((p, idx) => {
                hierarchyList.push({
                  task: p,
                  level: idx,
                  isCurrent: false,
                });
              });

              hierarchyList.push({
                task: selectedTaskDetail,
                level: parents.length,
                isCurrent: true,
              });

              hierarchyList.push(...getDescendants(selectedTaskDetail.id, parents.length + 1));

              return (
                <div className="bg-yellow-50/70 border-2 border-black p-3 rounded-none space-y-2 mt-2">
                  <span className="block font-comic font-black text-[9px] text-yellow-900 uppercase tracking-wider">
                    Mission Family Tree (Hierarchy)
                  </span>
                  <p className="text-[9px] text-gray-600 leading-relaxed font-semibold">
                    Click any bullet to inspect and edit that mission! (Showing parent and nested child hierarchy)
                  </p>
                  
                  <div className="space-y-1 bg-white border-2 border-black p-2 rounded-none max-h-48 overflow-y-auto font-mono text-[11px]">
                    {hierarchyList.map(item => {
                      return (
                        <div
                          key={item.task.id}
                          onClick={() => setSelectedTaskDetail(item.task)}
                          style={{ paddingLeft: `${item.level * 12}px` }}
                          className={`py-1 px-1.5 rounded-none cursor-pointer transition-colors flex items-center gap-1.5 ${
                            item.isCurrent
                              ? 'bg-black text-yellow-300 font-extrabold border-l-4 border-yellow-300'
                              : 'text-gray-800 hover:bg-gray-100 hover:text-black'
                          }`}
                        >
                          <span className="shrink-0">{item.isCurrent ? '★' : '•'}</span>
                          <span className={`${item.isCurrent ? 'font-black underline' : 'font-semibold'} truncate flex-1`}>
                            {item.task.name} {item.task.isCompleted && ' (Resolved ✓)'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Grid layout for Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">Do Target Date</label>
                <input
                  id="detail-do-date"
                  type="date"
                  value={detailDoDate}
                  onChange={e => setDetailDoDate(e.target.value)}
                  className="w-full bg-white border-2 border-black p-1 text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">Strict Deadline</label>
                <input
                  id="detail-due-date"
                  type="date"
                  value={detailDueDate}
                  onChange={e => setDetailDueDate(e.target.value)}
                  className="w-full bg-white border-2 border-black p-1 text-[11px]"
                />
              </div>
            </div>

            {/* Grid layout for Start & duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">Start Time Slot</label>
                <input
                  id="detail-start-time"
                  type="time"
                  value={detailStartTime}
                  onChange={e => setDetailStartTime(e.target.value)}
                  className="w-full bg-white border-2 border-black p-1 text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5">Duration: {detailDuration}m</label>
                <input
                  id="detail-duration-range"
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={detailDuration}
                  onChange={e => setDetailDuration(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>
            </div>

            {/* Parent hierarchy links */}
            {selectedTaskDetail.parentId && (
              <div className="bg-orange-50 border-2 border-black p-2 space-y-1">
                <span className="block font-bold text-[9px] text-orange-800 uppercase">NESTED SUBTASK GROUP RELATION</span>
                <button
                  id="detail-break-parent"
                  onClick={() => handleBreakParentLink(selectedTaskDetail.id)}
                  className="w-full py-1 bg-white border-2 border-black text-black hover:bg-red-50 text-[10px] font-bold cursor-pointer"
                >
                  💔 Break from Parent (Make Main Top-Level)
                </button>
              </div>
            )}

            {/* Repeat selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-0.5">Mission Recursion Rule</label>
              <select
                id="detail-repeat-select"
                value={detailRepeat}
                onChange={e => setDetailRepeat(e.target.value as Task['repeatInterval'])}
                className="w-full bg-white border-2 border-black p-1.5 focus:outline-none"
              >
                <option value="none">Does Not Repeat</option>
                <option value="daily">Every Day</option>
                <option value="weekly">Every Week</option>
                <option value="monthly">Every Month</option>
              </select>
            </div>

          </div>

          {/* Drawer Actions */}
          <div className="p-3 border-t-4 border-black bg-gray-50 flex gap-1.5 select-none">
            <button
              id="detail-duplicate-btn"
              onClick={() => handleDuplicateTask(selectedTaskDetail)}
              className="px-2 py-2 bg-yellow-200 hover:bg-yellow-300 border-2 border-black font-extrabold text-[10px]"
            >
              CLONE
            </button>
            <button
              id="detail-delete-btn"
              onClick={() => handleDeleteTask(selectedTaskDetail.id)}
              className="px-2 py-2 bg-red-400 hover:bg-red-500 border-2 border-black font-extrabold text-[10px] flex-1"
            >
              DELETE
            </button>
            <button
              id="detail-save-btn"
              onClick={handleSaveTaskDetails}
              className="px-2 py-2 bg-pink-500 hover:bg-pink-600 text-white border-2 border-black font-extrabold text-[10px] flex-1"
            >
              SAVE PLAN
            </button>
          </div>
        </div>
      )}

      {/* UNDO BANNER */}
      <div className="fixed bottom-20 right-4 z-50 space-y-2 max-w-xs pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="p-2.5 bg-black text-white border-2 border-white shadow-lg flex items-center justify-between gap-2 pointer-events-auto"
          >
            <span className="text-[10px] font-bold font-sans">{t.description}</span>
            <button
              id={`undo-toast-btn-${t.id}`}
              onClick={t.undo}
              className="bg-yellow-300 text-black text-[9px] px-2 py-0.5 border border-black font-bold hover:bg-yellow-400 cursor-pointer flex items-center gap-0.5 shrink-0"
            >
              <Undo2 className="w-2.5 h-2.5" />
              <span>UNDO</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
