import React, { useState, useEffect, useRef } from 'react';
import { Task, Category, Space, AppSettings } from '../types';
import { parseTextToDate, parseTypedTime, formatDate, calculateRelativeTime } from '../utils/taskHelpers';
import { Calendar, Tag, Clock, FolderPlus } from 'lucide-react';

interface TaskFormProps {
  categories: Category[];
  spaces: Space[];
  tasks: Task[];
  defaultCategory: string;
  todayStr: string;
  settings: AppSettings;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => string;
}

export default function TaskForm({
  categories,
  spaces,
  tasks,
  defaultCategory,
  todayStr,
  settings,
  onAddTask,
  onAddCategory,
}: TaskFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Dynamic defaults based on settings
  const [selectedCategory, setSelectedCategory] = useState(settings.defaultCategory || defaultCategory);
  const [doDateInput, setDoDateInput] = useState('today');
  const [doDateVal, setDoDateVal] = useState(todayStr);
  const [doDateLabel, setDoDateLabel] = useState('Today');
  
  const [dueDateInput, setDueDateInput] = useState('');
  const [dueDateVal, setDueDateVal] = useState('');
  const [dueDateLabel, setDueDateLabel] = useState('');

  const [timeInput, setTimeInput] = useState(settings.defaultStartTime || '');
  const [startTimeVal, setStartTimeVal] = useState('');
  const [timeLabel, setTimeLabel] = useState('');

  const [duration, setDuration] = useState(settings.defaultDuration || 45);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [repeatInterval, setRepeatInterval] = useState<Task['repeatInterval']>(settings.defaultRepeat || 'none');

  // Category search in creator
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Popups
  const [showDoCalendar, setShowDoCalendar] = useState(false);
  const [showDueCalendar, setShowDueCalendar] = useState(false);
  const [showQuickTimePicker, setShowQuickTimePicker] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keep state in sync with customizable defaults
  useEffect(() => {
    setSelectedCategory(settings.defaultCategory || defaultCategory);
  }, [settings.defaultCategory, defaultCategory]);

  useEffect(() => {
    setDuration(settings.defaultDuration || 45);
  }, [settings.defaultDuration]);

  useEffect(() => {
    setRepeatInterval(settings.defaultRepeat || 'none');
  }, [settings.defaultRepeat]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setShowCategoryDropdown(false);
        setShowDoCalendar(false);
        setShowDueCalendar(false);
        setShowQuickTimePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update Do Date
  useEffect(() => {
    if (!doDateInput) {
      setDoDateVal('');
      setDoDateLabel('Incomplete Info');
      return;
    }
    const resolved = parseTextToDate(doDateInput, todayStr);
    if (resolved) {
      setDoDateVal(resolved.date);
      setDoDateLabel(resolved.label);
    } else {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (regex.test(doDateInput)) {
        setDoDateVal(doDateInput);
        setDoDateLabel(doDateInput);
      }
    }
  }, [doDateInput, todayStr]);

  // Update Due Date
  useEffect(() => {
    if (!dueDateInput) {
      setDueDateVal('');
      setDueDateLabel('');
      return;
    }
    const resolved = parseTextToDate(dueDateInput, todayStr);
    if (resolved) {
      setDueDateVal(resolved.date);
      setDueDateLabel(resolved.label);
    } else {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (regex.test(dueDateInput)) {
        setDueDateVal(dueDateInput);
        setDueDateLabel(dueDateInput);
      }
    }
  }, [dueDateInput, todayStr]);

  // Handle Time input
  const handleTimeChange = (val: string) => {
    setTimeInput(val);
    const parsed = parseTypedTime(val);
    if (parsed.valid) {
      setStartTimeVal(parsed.raw);
      setTimeLabel(parsed.display);
    } else {
      setStartTimeVal('');
      setTimeLabel('');
    }
  };

  const handleCreateTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    onAddTask({
      name: name.trim(),
      description: description.trim(),
      category: selectedCategory,
      spaces: selectedSpaces,
      dueDate: dueDateVal,
      doDate: doDateVal,
      isCompleted: false,
      progressCount: 0,
      repeatInterval,
      priority: tasks.length + 1,
      duration,
      startTime: startTimeVal,
      parentId: selectedParentId,
    });

    // Reset Form to customized defaults
    setName('');
    setDescription('');
    setSelectedCategory(settings.defaultCategory || defaultCategory);
    setDoDateInput('today');
    setDoDateVal(todayStr);
    setDoDateLabel('Today');
    setDueDateInput('');
    setDueDateVal('');
    setDueDateLabel('');
    setTimeInput(settings.defaultStartTime || '');
    setStartTimeVal('');
    setTimeLabel('');
    setDuration(settings.defaultDuration || 45);
    setSelectedSpaces([]);
    setSelectedParentId(null);
    setRepeatInterval(settings.defaultRepeat || 'none');
    setIsFocused(false);
  };

  // Quick dates
  const selectDoToday = () => { setDoDateInput('today'); setShowDoCalendar(false); };
  const selectDoTomorrow = () => { setDoDateInput('tomorrow'); setShowDoCalendar(false); };
  const selectDoOvermorrow = () => { setDoDateInput('overmorrow'); setShowDoCalendar(false); };

  const filteredCategories = categories.filter(c =>
    c.title.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleAddNewCategoryInline = () => {
    if (!categorySearch.trim()) return;
    const colors = ['#FF2D55', '#34C759', '#007AFF', '#FFCC00', '#AF52DE', '#FF9500'];
    const emojis = ['🛠️', '🎈', '🪐', '🎨', '🚀', '🔮', '🧸', '🍔', '🐾'];
    
    const newCatId = onAddCategory({
      title: categorySearch.trim(),
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      parentId: null,
    });

    setSelectedCategory(newCatId);
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const toggleSpace = (spaceId: string) => {
    setSelectedSpaces(prev =>
      prev.includes(spaceId) ? prev.filter(id => id !== spaceId) : [...prev, spaceId]
    );
  };

  // Dynamic styling based on App Settings
  const compactness = settings.creatorCompactness || 'normal';
  const fontSizeClass = settings.creatorFontSize === 'xs' ? 'text-xs' : settings.creatorFontSize === 'base' ? 'text-base' : 'text-sm';
  const paddingClass = compactness === 'tiny' ? 'p-2 gap-2' : compactness === 'compact' ? 'p-3 gap-3' : 'p-4 gap-4';
  const labelClass = `block ${settings.creatorFontSize === 'xs' ? 'text-[10px]' : 'text-xs'} font-bold text-black uppercase tracking-wider mb-1`;
  const inputClass = `w-full bg-white comic-border ${compactness === 'tiny' ? 'p-1.5 text-xs' : 'p-2 text-sm'} rounded-xl focus:outline-none focus:ring-1 focus:ring-black font-sans`;

  // Quick Time Picker presets
  const timePresets = [
    { label: '8am', raw: '08:00', val: '800a' },
    { label: '9:30am', raw: '09:30', val: '930a' },
    { label: '12pm', raw: '12:00', val: '1200p' },
    { label: '2pm', raw: '14:00', val: '200p' },
    { label: '5:30pm', raw: '17:30', val: '530p' },
    { label: '8pm', raw: '20:00', val: '800p' },
  ];

  return (
    <div
      ref={containerRef}
      id="bottom-task-form"
      className="bg-transparent p-4 md:px-8 transition-all z-40 relative comic-halftone-dense"
    >
      {/* Mobile mode takes full screen overlay if focused */}
      <form 
        onSubmit={handleCreateTask} 
        className={`max-w-6xl mx-auto flex flex-col gap-3 ${
          isFocused ? 'md:relative fixed inset-0 md:inset-auto bg-[#2B95FF] md:bg-transparent p-4 md:p-0 z-50 overflow-y-auto' : ''
        }`}
      >
        {/* Mobile Header indicator if focused full screen */}
        {isFocused && (
          <div className="flex md:hidden items-center justify-between border-b-4 border-black pb-2 mb-2">
            <span className="font-comic text-xl text-white uppercase tracking-wider">Plan New Mission</span>
            <button 
              type="button" 
              onClick={() => setIsFocused(false)}
              className="bg-white text-black font-bold px-3 py-1 comic-border text-xs uppercase"
            >
              Close
            </button>
          </div>
        )}

        {/* Expanded menu above input when focused */}
        {isFocused && (
          <div className={`bg-amber-50 comic-border ${paddingClass} rounded-3xl comic-shadow grid grid-cols-1 md:grid-cols-3 gap-4 animate-comic-pop mb-1 relative`}>
            
            {/* Left Column: Description & subtasking */}
            <div className="space-y-2">
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  id="task-desc-input"
                  placeholder="Written details..."
                  rows={compactness === 'tiny' ? 1 : 2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Sub-mission of Parent */}
              <div>
                <label className={labelClass}>Sub-mission Of</label>
                <select
                  id="parent-select"
                  value={selectedParentId || ''}
                  onChange={e => setSelectedParentId(e.target.value ? e.target.value : null)}
                  className={inputClass}
                >
                  <option value="">No Parent (Top-level)</option>
                  {tasks
                    .filter(t => !t.isCompleted && !t.parentId)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Repeat */}
              <div>
                <label className={labelClass}>Repeat?</label>
                <select
                  id="repeat-select"
                  value={repeatInterval}
                  onChange={e => setRepeatInterval(e.target.value as Task['repeatInterval'])}
                  className={inputClass}
                >
                  <option value="none">No</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Middle Column: Dates, Times, Duration */}
            <div className="space-y-2">
              {/* Do Date */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className={labelClass}>Plan Date</label>
                  <span className="text-[11px] text-blue-600 font-bold font-mono">
                    {doDateLabel ? `🕒 ${doDateLabel}` : 'Incomplete'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <input
                    id="do-date-text-input"
                    type="text"
                    placeholder="Type 'tod', 'tom', 'o', 'wed'..."
                    value={doDateInput}
                    onChange={e => setDoDateInput(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => { setShowDoCalendar(!showDoCalendar); setShowDueCalendar(false); setShowQuickTimePicker(false); }}
                    className="bg-yellow-200 hover:bg-yellow-300 comic-border p-1.5 rounded-lg cursor-pointer shrink-0"
                  >
                    📅
                  </button>
                </div>

                {showDoCalendar && (
                  <div className="absolute top-12 left-0 right-0 bg-white comic-border p-2 rounded-xl comic-shadow z-50 text-xs">
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      <button type="button" onClick={selectDoToday} className="bg-red-100 p-1 font-bold text-[10px] rounded-md">Today</button>
                      <button type="button" onClick={selectDoTomorrow} className="bg-orange-100 p-1 font-bold text-[10px] rounded-md">Tom</button>
                      <button type="button" onClick={selectDoOvermorrow} className="bg-yellow-100 p-1 font-bold text-[10px] rounded-md">Overmor</button>
                    </div>
                    <input
                      type="date"
                      value={doDateVal}
                      onChange={e => {
                        setDoDateInput(e.target.value);
                        setShowDoCalendar(false);
                      }}
                      className="w-full bg-gray-50 p-1 border rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className={labelClass}>Due Date</label>
                  {dueDateVal && (
                    <span className="text-[11px] text-red-600 font-bold font-mono">
                      ⏳ {calculateRelativeTime(dueDateVal, todayStr)}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <input
                    id="due-date-text-input"
                    type="text"
                    placeholder="Shorthand / YYYY-MM-DD"
                    value={dueDateInput}
                    onChange={e => setDueDateInput(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => { setShowDueCalendar(!showDueCalendar); setShowDoCalendar(false); setShowQuickTimePicker(false); }}
                    className="bg-red-200 hover:bg-red-300 comic-border p-1.5 rounded-lg cursor-pointer shrink-0"
                  >
                    📅
                  </button>
                </div>

                {showDueCalendar && (
                  <div className="absolute top-12 left-0 right-0 bg-white comic-border p-2 rounded-xl comic-shadow z-50 text-xs">
                    <input
                      type="date"
                      value={dueDateVal}
                      onChange={e => {
                        setDueDateInput(e.target.value);
                        setShowDueCalendar(false);
                      }}
                      className="w-full bg-gray-50 p-1 border rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Start Time & Duration */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Start Time</label>
                  </div>
                  <div className="flex gap-1">
                    <input
                      id="start-time-text-input"
                      type="text"
                      placeholder="e.g. 430a"
                      value={timeInput}
                      onChange={e => handleTimeChange(e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => { setShowQuickTimePicker(!showQuickTimePicker); setShowDoCalendar(false); setShowDueCalendar(false); }}
                      className="bg-purple-200 hover:bg-purple-300 comic-border p-1.5 rounded-lg cursor-pointer shrink-0 text-xs font-bold"
                    >
                      🕒
                    </button>
                  </div>

                  {showQuickTimePicker && (
                    <div className="absolute bottom-12 left-0 right-0 bg-white comic-border p-2 rounded-xl comic-shadow z-50 text-xs max-h-48 overflow-y-auto">
                      <p className="font-bold text-[10px] text-gray-500 mb-1">QUICK TIME:</p>
                      <div className="grid grid-cols-2 gap-1">
                        {timePresets.map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              handleTimeChange(preset.val);
                              setShowQuickTimePicker(false);
                            }}
                            className="bg-purple-50 hover:bg-purple-100 p-1 text-[11px] font-bold text-center rounded-md"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Duration (m)</label>
                  <input
                    id="duration-input"
                    type="number"
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

                      <div className="space-y-2">
              {/* Category */}
              <div className="relative">
                <label className={labelClass}>Category</label>
                <div className="flex gap-1">
                  <button
                    id="creator-cat-trigger"
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full bg-white comic-border p-1.5 rounded-xl text-xs text-left flex justify-between items-center cursor-pointer font-bold"
                  >
                    {(() => {
                      const cat = categories.find(c => c.id === selectedCategory);
                      return cat ? (
                        <span className="flex items-center gap-1">
                          <span>{cat.emoji}</span>
                          <span className="truncate">{cat.title}</span>
                        </span>
                      ) : (
                        <span>Choose...</span>
                      );
                    })()}
                    <span>🏷️</span>
                  </button>
                </div>

                {showCategoryDropdown && (
                  <div className="absolute bottom-12 left-0 right-0 bg-white comic-border p-2 rounded-xl comic-shadow z-50 text-xs space-y-1 max-h-48 overflow-y-auto">
                    <input
                      id="creator-cat-search"
                      type="text"
                      placeholder="Search or Create..."
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      className="w-full p-1 border-2 border-black rounded-lg text-xs"
                    />
                    <div className="space-y-0.5">
                      {filteredCategories.map(cat => (
                        <button
                          id={`cat-select-btn-${cat.id}`}
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left p-1 rounded-lg flex items-center gap-1 hover:bg-gray-100 font-bold ${selectedCategory === cat.id ? 'bg-amber-100' : ''}`}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.title}</span>
                        </button>
                      ))}
                      {filteredCategories.length === 0 && categorySearch.trim() && (
                        <button
                          id="inline-add-cat-btn"
                          type="button"
                          onClick={handleAddNewCategoryInline}
                          className="w-full text-left p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-dashed border-emerald-400 text-xs rounded-md"
                        >
                          + Create: "{categorySearch}"
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Spaces */}
              <div>
                <label className={labelClass}>Spaces</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto bg-white border-2 border-black p-1 rounded-xl">
                  {spaces
                    .filter(s => !s.isAutomatic)
                    .map(s => {
                      const isSelected = selectedSpaces.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSpace(s.id)}
                          className={`text-[10px] px-1.5 py-0.5 border font-bold flex items-center gap-0.5 cursor-pointer rounded-md ${
                            isSelected ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          <span>{s.emoji}</span>
                          <span>{s.title}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-stretch gap-2 relative z-10">
          <input
            id="task-name-input"
            type="text"
            placeholder="Type new mission..."
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (!isFocused) setIsFocused(true);
            }}
            onFocus={() => setIsFocused(true)}
            className="flex-1 font-comic text-xl md:text-2xl bg-white text-black comic-border rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:outline-none placeholder-gray-400 uppercase tracking-wide"
          />

          <button
            id="add-task-submit-btn"
            type="submit"
            disabled={!name.trim()}
            className={`font-comic text-xl md:text-2xl py-3 md:py-4 px-6 md:px-8 comic-border rounded-2xl comic-shadow-sm transition-all font-bold cursor-pointer select-none flex items-center gap-1.5 ${
              name.trim()
                ? 'bg-[#FF4B2B] text-white hover:bg-[#ff3b1a] hover:scale-102 active:scale-95'
                : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            ADD!
          </button>
        </div>
      </form>
    </div>
  );
}
