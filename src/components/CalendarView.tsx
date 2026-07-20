import React, { useState, useEffect } from 'react';
import { Task, Category, AppSettings } from '../types';
import { formatDate, formatMilitaryToDisplay } from '../utils/taskHelpers';
import { ChevronLeft, ChevronRight, Calendar, Layers, Clock, AlertTriangle, ListPlus } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  categories: Category[];
  todayStr: string;
  settings: AppSettings;
  onUpdateTaskDate: (taskId: string, newDoDate: string, newDueDate?: string) => void;
  onUpdateTaskTime: (taskId: string, newDoDate: string, startTime: string, duration?: number) => void;
  onTaskClick: (task: Task) => void;
}

type TabType = 'monthly' | 'weekly' | 'gantt';

export default function CalendarView({
  tasks,
  categories,
  todayStr,
  settings,
  onUpdateTaskDate,
  onUpdateTaskTime,
  onTaskClick,
}: CalendarViewProps) {
  // Default to weekly schedule as requested!
  const [activeTab, setActiveTab] = useState<TabType>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date(todayStr + 'T12:00:00'));
  
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingMoveData, setPendingMoveData] = useState<{ taskId: string; targetDoDate: string; currentDueDate: string } | null>(null);
  const [customNewDueDate, setCustomNewDueDate] = useState('');

  // Fixed Google Calendar External Events overlay
  const calendarEvents = [
    { id: 'evt-1', title: 'Product Review (Halftone Graphics)', time: '11:00', duration: 60, doDate: todayStr },
    { id: 'evt-2', title: 'Design Team Lunch & Comic Boarding', time: '13:00', duration: 45, doDate: todayStr },
    { id: 'evt-3', title: 'Sprint Retrospective Retrospective', time: '16:00', duration: 90, doDate: todayStr }
  ];

  // 1. MONTHLY CALENDAR CALCULATIONS
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    const startOffset = firstDay.getDay();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    const totalSlots = 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  const monthDays = getDaysInMonth(currentDate);

  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(d);
  };

  // 2. WEEKLY CALENDAR CALCULATIONS
  const getDaysInWeek = (date: Date) => {
    const currentWeekDays: Date[] = [];
    const dayOfWeek = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      currentWeekDays.push(d);
    }
    return currentWeekDays;
  };

  const weekDays = getDaysInWeek(currentDate);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + 7);
    setCurrentDate(d);
  };

  // 3. GANTT TIMELINE
  const getGanttTimeline = () => {
    const timeline: Date[] = [];
    const start = new Date(todayStr + 'T12:00:00');
    start.setDate(start.getDate() - 3);
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      timeline.push(d);
    }
    return timeline;
  };

  const ganttTimeline = getGanttTimeline();

  // Drag and drop
  const handleCalendarDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCalendarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCalendarDropOnDay = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.dueDate && targetDateStr > task.dueDate) {
      setPendingMoveData({
        taskId,
        targetDoDate: targetDateStr,
        currentDueDate: task.dueDate,
      });
      setCustomNewDueDate(targetDateStr);
      setShowWarningModal(true);
    } else {
      onUpdateTaskDate(taskId, targetDateStr);
    }
    setDraggedTaskId(null);
  };

  const handleConfirmMoveAndChangeDue = () => {
    if (!pendingMoveData) return;
    onUpdateTaskDate(pendingMoveData.taskId, pendingMoveData.targetDoDate, customNewDueDate || pendingMoveData.targetDoDate);
    setShowWarningModal(false);
    setPendingMoveData(null);
  };

  // 5. HOURS range: bounded between 6 AM and 10 PM (inclusive) as requested!
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6, 7, 8, ... 22 (10 PM)

  const handleWeeklyGridCellClick = (dateStr: string, hourNum: number) => {
    const formattedHour = String(hourNum).padStart(2, '0') + ':00';
    const tempTaskName = prompt("Enter Name for new Scheduled Mission:", "Scheduled Mission");
    if (tempTaskName) {
      const dummyTaskData = {
        name: tempTaskName,
        description: 'Created via Calendar Scheduler.',
        category: categories[0]?.id || '',
        spaces: [],
        dueDate: '',
        doDate: dateStr,
        isCompleted: false,
        progressCount: 0,
        repeatInterval: 'none' as const,
        priority: tasks.length + 1,
        duration: 45, // default duration
        startTime: formattedHour,
        parentId: null,
      };
      
      const customEvent = new CustomEvent('add-task-from-calendar', { detail: dummyTaskData });
      window.dispatchEvent(customEvent);
    }
  };

  const handleWeeklyDrop = (e: React.DragEvent, targetDateStr: string, hourNum: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTimeStr = `${String(hourNum).padStart(2, '0')}:00`;

    if (task.dueDate && targetDateStr > task.dueDate) {
      setPendingMoveData({
        taskId,
        targetDoDate: targetDateStr,
        currentDueDate: task.dueDate,
      });
      setCustomNewDueDate(targetDateStr);
      setShowWarningModal(true);
    } else {
      onUpdateTaskTime(taskId, targetDateStr, newTimeStr, task.duration || 45);
    }
    setDraggedTaskId(null);
  };

  // Unscheduled tasks for right-side checklist
  const unscheduledTasks = tasks.filter(t => !t.isCompleted && (!t.startTime || !t.doDate));

  return (
    <div id="calendar-view-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative">
      
      {/* LEFT AREA: CALENDAR BOARD */}
      <div className={`${activeTab === 'weekly' ? 'lg:col-span-9' : 'lg:col-span-12'} bg-white comic-border p-4 rounded-3xl comic-shadow flex flex-col gap-4 relative`}>
        
        {/* Tab Selectors */}
        <div className="flex flex-wrap justify-between items-center border-b-4 border-black pb-3 gap-3">
          <h2 className="font-comic text-xl text-black tracking-wide uppercase">
            Calendar Radar
          </h2>
          
          <div className="flex bg-gray-100 border-2 border-black p-0.5 rounded-xl">
            {(['monthly', 'weekly', 'gantt'] as TabType[]).map(tab => (
              <button
                id={`calendar-tab-btn-${tab}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 font-comic text-xs rounded-lg font-bold uppercase transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-black text-[#FFDE4D]'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {tab === 'monthly' && 'Month'}
                {tab === 'weekly' && 'Weekly Grid'}
                {tab === 'gantt' && 'Gantt Chart'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Navigation Bar */}
        <div className="flex justify-between items-center bg-yellow-50/50 p-2 border-2 border-black rounded-xl">
          <button
            id="calendar-prev-btn"
            onClick={activeTab === 'weekly' ? handlePrevWeek : handlePrevMonth}
            className="p-1 border border-black bg-white hover:bg-yellow-100 rounded-md cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-comic text-sm text-black tracking-wider uppercase font-black">
            {activeTab === 'monthly' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {activeTab === 'weekly' && `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {activeTab === 'gantt' && '14-Day Gantt View'}
          </span>

          <button
            id="calendar-next-btn"
            onClick={activeTab === 'weekly' ? handleNextWeek : handleNextMonth}
            className="p-1 border border-black bg-white hover:bg-yellow-100 rounded-md cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ======================= TAB 1: MONTHLY CALENDAR ======================= */}
        {activeTab === 'monthly' && (
          <div className="grid grid-cols-7 gap-1 bg-black border-4 border-black rounded-2xl overflow-hidden text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={i} className="bg-yellow-300 py-1 text-center font-bold text-black border-b border-r border-black font-mono">
                {day}
              </div>
            ))}

            {monthDays.map((day, idx) => {
              const formattedDateStr = formatDate(day);
              const isToday = formattedDateStr === todayStr;
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const dayTasks = tasks.filter(t => t.doDate === formattedDateStr && !t.isCompleted);

              return (
                <div
                  key={idx}
                  onDragOver={handleCalendarDragOver}
                  onDrop={(e) => handleCalendarDropOnDay(e, formattedDateStr)}
                  className={`bg-white min-h-[75px] p-1 flex flex-col transition-colors border-r border-b border-black ${
                    !isCurrentMonth ? 'bg-gray-100 text-gray-400 opacity-30' : ''
                  } ${isToday ? 'bg-red-50' : ''}`}
                >
                  <span className={`text-[10px] font-bold self-start ${isToday ? 'bg-red-500 text-white px-1' : 'text-black'}`}>
                    {day.getDate()}
                  </span>

                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[55px] mt-1">
                    {dayTasks.map(task => {
                      const catObj = categories.find(c => c.id === task.category);
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleCalendarDragStart(e, task.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                          className="text-[9px] font-bold font-sans p-0.5 border border-black cursor-grab shadow-sm truncate hover:scale-102"
                          style={{ backgroundColor: catObj?.color || '#ECECEC' }}
                        >
                          {task.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================= TAB 2: WEEKLY SCHEDULE CALENDAR ======================= */}
        {activeTab === 'weekly' && (
          <div className="overflow-x-auto">
            <div className="min-w-[650px] border-4 border-black bg-black grid grid-cols-8 gap-0.5 text-xs">
              
              <div className="bg-yellow-300 p-1.5 text-center font-bold font-mono text-black border-r border-b border-black">
                TIME
              </div>
              
              {weekDays.map((day, i) => {
                const fDateStr = formatDate(day);
                const isToday = fDateStr === todayStr;
                return (
                  <div
                    key={i}
                    className={`bg-yellow-300 p-1.5 text-center font-bold font-mono text-black border-r border-b border-black flex flex-col items-center ${
                      isToday ? 'bg-red-400' : ''
                    }`}
                  >
                    <span>{day.toLocaleDateString('en', { weekday: 'short' })}</span>
                    <span className="text-[10px] opacity-70">{day.getDate()}</span>
                  </div>
                );
              })}

              {/* Hourly Grid Rows (6 AM to 10 PM) */}
              {hours.map(hour => {
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour === 12 ? 12 : hour % 12;
                
                return (
                  <React.Fragment key={hour}>
                    <div className="bg-gray-100 p-1.5 text-center font-bold border-r border-b border-black font-mono flex items-center justify-center text-[10px]">
                      {displayHour}:00 {ampm}
                    </div>

                    {weekDays.map((day, dIdx) => {
                      const fDateStr = formatDate(day);
                      
                      const matchedTasks = tasks.filter(t => {
                        if (t.isCompleted || !t.startTime || t.doDate !== fDateStr) return false;
                        const [tH] = t.startTime.split(':').map(Number);
                        return tH === hour;
                      });

                      const matchedEvents = calendarEvents.filter(evt => {
                        if (evt.doDate !== fDateStr) return false;
                        const [evH] = evt.time.split(':').map(Number);
                        return evH === hour;
                      });

                      return (
                        <div
                          key={dIdx}
                          onClick={() => handleWeeklyGridCellClick(fDateStr, hour)}
                          onDragOver={handleCalendarDragOver}
                          onDrop={(e) => handleWeeklyDrop(e, fDateStr, hour)}
                          className="bg-white min-h-[50px] p-0.5 border-r border-b border-black hover:bg-yellow-50/50 transition-colors relative cursor-crosshair flex flex-col gap-1 overflow-visible"
                        >
                          {/* Calendar Events Overlay (Distinct style) */}
                          {matchedEvents.map(evt => (
                            <div
                              key={evt.id}
                              style={{
                                height: `${evt.duration * (settings.timeblindMultiplier || 1.1)}px`,
                              }}
                              className="text-[9px] leading-tight font-extrabold border-2 border-black p-1 shadow-sm rounded-lg bg-[repeating-linear-gradient(45deg,#E5E7EB,#E5E7EB_4px,#F3F4F6_4px,#F3F4F6_8px)] text-purple-800 flex flex-col justify-between shrink-0"
                              title={`${evt.title} (${evt.duration}m)`}
                              onClick={e => e.stopPropagation()}
                            >
                              <span className="truncate">📅 EVENT: {evt.title}</span>
                              <span className="text-[8px] font-mono text-gray-500">{evt.time}</span>
                            </div>
                          ))}

                          {/* Task Block Rendering with 2.5x duration display scale */}
                          {matchedTasks.map(task => {
                            const catObj = categories.find(c => c.id === task.category);
                            
                            // Height based on duration * settings multiplier
                            const mult = settings.timeblindMultiplier || 2.5;
                            const elementHeight = Math.max(35, task.duration * (mult * 0.4));

                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleCalendarDragStart(e, task.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTaskClick(task); // Click opens plan drawer
                                }}
                                style={{ 
                                  backgroundColor: catObj?.color || '#FFDE4D',
                                  height: `${elementHeight}px`
                                }}
                                className="text-[9px] leading-snug font-extrabold border-2 border-black rounded-xl p-1 cursor-grab shadow-sm transition-all hover:scale-102 z-10 w-full flex flex-col justify-between overflow-hidden"
                                title={`${task.name} (${task.duration}m)`}
                              >
                                <span className="line-clamp-2">{task.name}</span>
                                <div className="border-t border-black/20 pt-0.5 flex justify-between font-mono text-[8px] opacity-80 mt-1">
                                  <span>{formatMilitaryToDisplay(task.startTime)}</span>
                                  <span>{task.duration}m</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: GANTT CHART ======================= */}
        {activeTab === 'gantt' && (
          <div className="overflow-x-auto text-xs">
            <div className="min-w-[700px] border-4 border-black bg-black p-0.5 space-y-0.5">
              <div className="grid grid-cols-12 gap-0.5">
                <div className="col-span-3 bg-yellow-300 p-1.5 font-bold font-mono text-black">
                  CATEGORY
                </div>
                <div className="col-span-9 bg-yellow-300 p-1.5 grid grid-cols-14 gap-0.5 text-center font-bold font-mono text-black">
                  {ganttTimeline.map((day, i) => {
                    const isToday = formatDate(day) === todayStr;
                    return (
                      <div key={i} className={`rounded ${isToday ? 'bg-red-400 text-white font-extrabold px-1' : ''}`}>
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {categories.map(cat => {
                const catTasks = tasks.filter(t => t.category === cat.id && !t.isCompleted && t.doDate);
                
                return (
                  <div key={cat.id} className="grid grid-cols-12 gap-0.5 bg-white">
                    <div className="col-span-3 p-2 flex items-center gap-1 border-r border-black" style={{ backgroundColor: cat.color + '15' }}>
                      <span className="text-sm">{cat.emoji}</span>
                      <span className="font-comic text-xs font-bold uppercase truncate text-black">{cat.title}</span>
                    </div>

                    <div className="col-span-9 p-1.5 relative bg-gray-50 flex flex-col gap-1.5 justify-center">
                      {catTasks.map(task => {
                        const doIndex = ganttTimeline.findIndex(d => formatDate(d) === task.doDate);
                        const dueIndex = task.dueDate ? ganttTimeline.findIndex(d => formatDate(d) === task.dueDate) : doIndex;

                        if (doIndex === -1 && dueIndex === -1) return null;

                        const startIndex = doIndex === -1 ? 0 : doIndex;
                        const endIndex = dueIndex === -1 ? 13 : dueIndex;
                        
                        const span = Math.max(1, endIndex - startIndex + 1);
                        const leftPercent = (startIndex / 14) * 100;
                        const widthPercent = (span / 14) * 100;

                        return (
                          <div
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            style={{
                              marginLeft: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: cat.color,
                            }}
                            className="border-2 border-black rounded-xl p-1 text-[9px] font-bold text-black comic-shadow-sm flex items-center justify-between truncate min-h-[25px] cursor-pointer"
                          >
                            <span className="truncate">{task.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ======================= RIGHT SIDEBAR: UNSCHEDULED MISSIONS ======================= */}
      {activeTab === 'weekly' && (
        <div className="lg:col-span-3 bg-white comic-border p-4 rounded-3xl comic-shadow flex flex-col gap-3">
          <h3 className="font-comic text-xs uppercase text-gray-700 tracking-wide border-b-2 border-black pb-2 flex items-center gap-1.5">
            <ListPlus className="w-4 h-4 text-purple-600" />
            Unscheduled Backlog
          </h3>

          <div className="space-y-2 overflow-y-auto max-h-[500px]">
            {unscheduledTasks.map(task => {
              const catObj = categories.find(c => c.id === task.category);
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleCalendarDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                  style={{ borderLeftColor: catObj?.color || '#FFDE4D' }}
                  className="bg-yellow-50/40 hover:bg-yellow-50 border-2 border-black border-l-8 p-2 rounded-xl transition-all cursor-grab flex flex-col gap-1 text-[11px]"
                >
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-500">
                    <span>{catObj ? catObj.title : 'Unassigned'}</span>
                    <span>{task.duration}m</span>
                  </div>
                  <h4 className="font-extrabold text-gray-900 leading-snug line-clamp-2">{task.name}</h4>
                  <p className="text-[10px] text-gray-500 italic">Drag onto weekly timeslot to schedule!</p>
                </div>
              );
            })}

            {unscheduledTasks.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-4 font-bold">
                No unscheduled missions in queue. Everything is planned! ⚡
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warning popup for deadline moves */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black p-5 rounded-3xl max-w-sm w-full space-y-4 animate-comic-pop comic-shadow">
            <div className="flex items-center gap-2.5 text-red-500 font-comic text-lg font-bold">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <span>DEADLINE INTRUSION WARNING!</span>
            </div>
            
            <p className="text-xs text-gray-600 font-sans font-medium">
              You are scheduling this mission past its official final due date (<strong>{pendingMoveData?.currentDueDate}</strong>).
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase block text-gray-700">Update Final Due Date to:</label>
              <input
                type="date"
                value={customNewDueDate}
                onChange={e => setCustomNewDueDate(e.target.value)}
                className="w-full bg-white border-2 border-black p-2 rounded-lg text-xs"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowWarningModal(false);
                  setPendingMoveData(null);
                }}
                className="bg-gray-100 hover:bg-gray-200 border-2 border-black font-bold px-3 py-1.5 text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveAndChangeDue}
                className="bg-red-500 hover:bg-red-600 text-white border-2 border-black font-bold px-4 py-1.5 text-xs rounded-lg"
              >
                Proceed & Push Due Date
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
