import React, { useState } from 'react';
import { Task, Category, Space, AppSettings } from '../types';
import { calculateRelativeTime, formatMilitaryToDisplay } from '../utils/taskHelpers';
import { Check, GripVertical, CornerDownRight, Sparkles, Star } from 'lucide-react';

export function isColorDark(hex: string): boolean {
  if (!hex) return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 130;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 130;
  }
  return false;
}

interface TaskRowProps {
  key?: any;
  task: Task;
  allTasks: Task[];
  categories: Category[];
  spaces: Space[];
  todayStr: string;
  calculatedPriority: number;
  settings: AppSettings;
  onToggleComplete: (id: string) => void;
  onIncrementProgress: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onTaskEditTrigger: (task: Task, option: string) => void;
  onNestingChange: (childId: string, parentId: string | null) => void;
  onBoostPriority: (id: string) => void; // override auto-priority button
  activeDragId: string | null;
  onActiveDragIdChange: (id: string | null) => void;
}

export default function TaskRow({
  task,
  allTasks,
  categories,
  spaces,
  todayStr,
  calculatedPriority,
  settings,
  onToggleComplete,
  onIncrementProgress,
  onTaskClick,
  onTaskEditTrigger,
  onNestingChange,
  onBoostPriority,
  activeDragId,
  onActiveDragIdChange,
}: TaskRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const categoryObj = categories.find(c => c.id === task.category);

  // Parent hierarchy resolved
  const getParentTrail = (currentId: string | null): string[] => {
    if (!currentId) return [];
    const trail: string[] = [];
    let curr = allTasks.find(t => t.id === currentId);
    while (curr) {
      trail.unshift(curr.name);
      curr = curr.parentId ? allTasks.find(t => t.id === curr!.parentId) : undefined;
    }
    return trail;
  };

  const parentTrail = getParentTrail(task.parentId);

  // Background color based on progress count
  const getProgressBgStyle = () => {
    if (task.isCompleted) return 'bg-[#F2F2F7] opacity-60';
    if (task.progressCount === 0) return 'bg-white';
    if (task.progressCount === 1) return 'bg-amber-50/70';
    if (task.progressCount === 2) return 'bg-orange-50/70';
    return 'bg-pink-50/70';
  };

  // Custom Shadow Style based on Settings Panel configuration
  const getShadowStyle = () => {
    if (task.isCompleted) {
      return { boxShadow: '2px 2px 0px 0px #8E8E93' };
    }
    const mode = settings?.taskShadowColorMode || 'category';
    if (mode === 'none') {
      return { boxShadow: 'none' };
    }
    let color = '#000000';
    if (mode === 'category' && categoryObj) {
      color = categoryObj.color;
    } else if (mode === 'custom' && settings?.taskShadowColorCustom) {
      color = settings.taskShadowColorCustom;
    } else if (mode === 'duration') {
      color = task.duration > 60 ? '#FF007F' : task.duration > 30 ? '#FF9500' : '#34C759';
    } else if (mode === 'urgency') {
      color = task.dueDate ? '#FF3B30' : '#8E8E93';
    }
    return { boxShadow: `4px 4px 0px 0px ${color}` };
  };

  const handleDragStart = (e: React.DragEvent) => {
    onActiveDragIdChange(task.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id }));
    e.dataTransfer.effectAllowed = 'move';
    
    const catLabel = categoryObj ? categoryObj.title : 'Unassigned';
    e.dataTransfer.setData('text/plain', `⚡ Mission: ${task.name} (${catLabel})`);
  };

  const handleDragEnd = () => {
    onActiveDragIdChange(null);
    setIsDragOver(false);
  };

  const getCompactnessClasses = () => {
    const comp = settings?.creatorCompactness || 'normal';
    if (comp === 'tiny') return 'p-1.5 mb-1.5 gap-1.5';
    if (comp === 'compact') return 'p-2 mb-2 gap-2';
    return 'p-3 mb-3 gap-3';
  };

  const getFontSizeClasses = () => {
    const size = settings?.creatorFontSize || 'sm';
    if (size === 'xs') return 'text-[11px]';
    if (size === 'base') return 'text-sm md:text-base';
    return 'text-xs md:text-sm';
  };

  const getColSpan = (colKey: string, activeColumns: string[]) => {
    if (colKey !== 'name') {
      if (colKey === 'startTime' || colKey === 'duration') return 1;
      return 2;
    }
    const otherActiveCols = activeColumns.filter(c => c !== 'name');
    const otherSpansSum = otherActiveCols.reduce((sum, key) => {
      if (key === 'startTime' || key === 'duration') return sum + 1;
      return sum + 2;
    }, 0);
    return Math.max(3, 12 - otherSpansSum);
  };

  return (
    <div
      id={`task-row-${task.id}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={e => {
        e.preventDefault();
        if (activeDragId && activeDragId !== task.id) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setIsDragOver(false);
        if (activeDragId && activeDragId !== task.id) {
          onNestingChange(activeDragId, task.id);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={getShadowStyle()}
      className={`border-4 border-black transition-all relative select-none rounded-2xl cursor-pointer ${getProgressBgStyle()} ${getCompactnessClasses()} ${
        isDragOver ? 'ring-4 ring-purple-400 bg-yellow-100 scale-102 border-dashed' : ''
      } flex items-center`}
      onClick={() => onTaskClick(task)} // Clicking any blank part opens details/edit
    >
      {/* 1. CHECKBOX GROUP (Leftmost position) */}
      <div className="flex items-center gap-1.5 shrink-0 z-10" onClick={e => e.stopPropagation()}>
        {/* Toggle Complete */}
        <button
          id={`checkbox-complete-${task.id}`}
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`w-6 h-6 border-2 border-black rounded-md flex items-center justify-center cursor-pointer select-none transition-all ${
            task.isCompleted ? 'bg-pink-500 text-white shadow-none' : 'bg-white hover:bg-pink-100'
          }`}
        >
          {task.isCompleted && <Check className="w-4 h-4 stroke-[4]" />}
        </button>

        {/* Increment progress */}
        {!task.isCompleted && (
          <button
            id={`checkbox-progress-${task.id}`}
            type="button"
            onClick={() => onIncrementProgress(task.id)}
            title="Log progress increments"
            className={`w-6 h-6 border-2 border-black rounded-md flex items-center justify-center cursor-pointer select-none transition-all bg-white hover:bg-yellow-100 ${
              task.progressCount > 0 ? 'bg-yellow-200' : ''
            }`}
          >
            <span className="text-[10px] font-bold font-mono">
              {task.progressCount > 0 ? `+${task.progressCount}` : '⚡'}
            </span>
          </button>
        )}
      </div>

      {/* 2. DRAG HANDLE & RANK */}
      <div 
        className="flex items-center gap-1 cursor-grab shrink-0 z-10"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-gray-500 hover:text-black shrink-0" />
        <span className="font-mono text-[10px] bg-black text-white px-1.5 py-0.5 rounded-md font-bold shrink-0">
          #{calculatedPriority}
        </span>
      </div>

      {/* 3. CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-center min-w-0 z-10">
        {settings.listColumns.map(colKey => {
          const colSpan = getColSpan(colKey, settings.listColumns);
          const spanClass = `md:col-span-${colSpan}`;
          
          if (colKey === 'category') {
            return (
              <div className={spanClass} key="category">
                {categoryObj ? (
                  <div
                    id={`cat-badge-${task.id}`}
                    className="border-2 border-black px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 uppercase tracking-wide cursor-pointer"
                    style={{
                      backgroundColor: categoryObj.color,
                      color: isColorDark(categoryObj.color) ? '#FFFFFF' : '#000000',
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      onTaskEditTrigger(task, 'category');
                    }}
                  >
                    <span>{categoryObj.emoji}</span>
                    <span className="truncate max-w-[100px]">{categoryObj.title}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 font-bold text-[10px]">No Cat</span>
                )}
              </div>
            );
          }
          
          if (colKey === 'name') {
            return (
              <div className={`${spanClass} min-w-0`} key="name">
                {parentTrail.map((parentName, idx) => (
                  <div
                    key={idx}
                    style={{ paddingLeft: `${idx * 8}px` }}
                    className="text-[10px] text-gray-500 font-bold flex items-center gap-0.5 truncate"
                  >
                    <CornerDownRight className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    <span>{parentName}</span>
                  </div>
                ))}

                <h4
                  style={{ paddingLeft: `${parentTrail.length * 8}px` }}
                  className={`font-sans font-extrabold break-words leading-snug ${
                    task.isCompleted ? 'line-through text-gray-400' : 'text-black hover:text-blue-600'
                  } ${getFontSizeClasses()}`}
                >
                  {task.name}
                </h4>
              </div>
            );
          }
          
          if (colKey === 'doDate') {
            return (
              <div className={spanClass} onClick={e => e.stopPropagation()} key="doDate">
                {task.doDate ? (
                  <button
                    id={`do-date-btn-${task.id}`}
                    type="button"
                    onClick={() => onTaskEditTrigger(task, 'doDate')}
                    className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 border-2 border-black rounded-md ${
                      task.doDate < todayStr && !task.isCompleted
                        ? 'bg-red-500 text-white border-black animate-pulse'
                        : 'bg-white text-black'
                    }`}
                  >
                    🎯 {task.doDate}
                    {task.doDate < todayStr && !task.isCompleted && ' (Rolled!)'}
                  </button>
                ) : (
                  <button
                    id={`do-date-empty-${task.id}`}
                    type="button"
                    onClick={() => onTaskEditTrigger(task, 'doDate')}
                    className="bg-amber-100 border-2 border-amber-400 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md cursor-pointer animate-pulse inline-flex items-center gap-0.5 hover:bg-amber-200"
                  >
                    ⚠️ Add Date
                  </button>
                )}
              </div>
            );
          }
          
          if (colKey === 'dueDate') {
            return (
              <div className={`${spanClass} flex flex-col items-start gap-0.5`} onClick={e => e.stopPropagation()} key="dueDate">
                {task.dueDate ? (
                  <>
                    <button
                      id={`due-date-btn-${task.id}`}
                      type="button"
                      onClick={() => onTaskEditTrigger(task, 'dueDate')}
                      className="font-mono text-[10px] font-bold hover:underline"
                    >
                      🏁 {task.dueDate}
                    </button>
                    <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 border-2 border-black rounded-md font-extrabold uppercase font-mono">
                      ⌛ {calculateRelativeTime(task.dueDate, todayStr)}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 text-[10px]">-</span>
                )}
              </div>
            );
          }
          
          if (colKey === 'startTime') {
            return (
              <div className={spanClass} onClick={e => e.stopPropagation()} key="startTime">
                {task.startTime ? (
                  <button
                    id={`start-time-btn-${task.id}`}
                    type="button"
                    onClick={() => onTaskEditTrigger(task, 'time')}
                    className="font-mono text-[10px] font-bold bg-purple-100 text-purple-800 border-2 border-black px-1 py-0.2 hover:scale-105"
                  >
                    {formatMilitaryToDisplay(task.startTime)}
                  </button>
                ) : (
                  <span className="text-gray-400 text-[10px]">-</span>
                )}
              </div>
            );
          }
          
          if (colKey === 'duration') {
            return (
              <div className={spanClass} onClick={e => e.stopPropagation()} key="duration">
                <button
                  id={`duration-btn-${task.id}`}
                  type="button"
                  onClick={() => onTaskEditTrigger(task, 'duration')}
                  className="font-mono text-[10px] font-bold text-gray-700"
                >
                  ⏱️ {task.duration}m
                </button>
              </div>
            );
          }
          
          return null;
        })}
      </div>

      {/* 4. HOVER BOOST BUTTONS & ACTIONS (Merged edit & info) */}
      <div 
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20"
        onClick={e => e.stopPropagation()}
      >
        {isHovered && !task.isCompleted && (
          <button
            id={`boost-priority-${task.id}`}
            onClick={() => onBoostPriority(task.id)}
            title="Set top priority instantly!"
            className="p-1 bg-yellow-300 hover:bg-yellow-400 border-2 border-black font-bold text-xs cursor-pointer rounded-md hover:scale-110 transition-transform"
          >
            <Star className="w-3.5 h-3.5 text-black fill-black" />
          </button>
        )}

        {isHovered && (
          <button
            id={`edit-all-icon-btn-${task.id}`}
            onClick={() => onTaskClick(task)} // Click to view details/edit plan
            className="p-1 bg-black text-white hover:bg-pink-600 border-2 border-black font-bold text-[9px] cursor-pointer rounded-md uppercase tracking-wider"
          >
            Plan
          </button>
        )}
      </div>

    </div>
  );
}
