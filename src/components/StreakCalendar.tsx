import React from 'react';
import { StreakData } from '../types';
import { formatDate } from '../utils/taskHelpers';

interface StreakCalendarProps {
  streakData: StreakData;
  todayStr: string;
  onClose: () => void;
}

export default function StreakCalendar({ streakData, todayStr, onClose }: StreakCalendarProps) {
  // Create past 28 days for grid
  const pastDays: { dateStr: string; dayNum: number; dayName: string; completedCount: number; isGrace: boolean }[] = [];
  const today = new Date(todayStr + 'T12:00:00');

  // Let's check completed count history and find consecutive missed days
  const activeCompletions = { ...streakData.completionHistory };
  
  // Sort dates to analyze gap
  const activeDates = Object.keys(activeCompletions)
    .filter(d => activeCompletions[d] > 0)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    const completedCount = activeCompletions[dateStr] || 0;

    // Check if this missed day is covered by the 3-day grace period
    let isGrace = false;
    if (completedCount === 0 && activeDates.length > 0) {
      const dayTime = d.getTime();
      // Find the nearest active date after this day or before it
      const nearestActive = activeDates.find(activeDateStr => {
        const ad = new Date(activeDateStr + 'T12:00:00');
        return ad.getTime() > dayTime; // An active day in the future relative to this day
      });
      
      if (nearestActive) {
        const naTime = new Date(nearestActive + 'T12:00:00').getTime();
        const gapDays = Math.floor((naTime - dayTime) / (1000 * 60 * 60 * 24));
        if (gapDays <= 3) {
          isGrace = true; // Saved by the 3-day grace period!
        }
      } else {
        // Check gap to today if it's the current period
        const newestActiveTime = new Date(activeDates[0] + 'T12:00:00').getTime();
        if (dayTime > newestActiveTime) {
          const gapDays = Math.floor((dayTime - newestActiveTime) / (1000 * 60 * 60 * 24));
          if (gapDays <= 3) {
            isGrace = true; // Still within 3-day grace period
          }
        }
      }
    }

    pastDays.push({
      dateStr,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completedCount,
      isGrace,
    });
  }

  // Choose colors based on completion count
  const getDayStyle = (item: typeof pastDays[0]) => {
    if (item.completedCount > 0) {
      if (item.completedCount >= 4) return 'bg-[#FF007F] text-white border-black hover:scale-105'; // Flame Hot Pink
      if (item.completedCount >= 2) return 'bg-[#FF9500] text-black border-black hover:scale-105'; // Bright Orange
      return 'bg-[#FFDE4D] text-black border-black hover:scale-105'; // Sun Yellow
    }
    if (item.isGrace) {
      return 'bg-gray-300 text-gray-700 border-dashed border-gray-600'; // Light grey grace period
    }
    return 'bg-gray-700 text-gray-400 border-black opacity-40'; // Broken streak dark grey
  };

  return (
    <div className="bg-white comic-border comic-shadow p-5 max-w-sm rounded-xl relative overflow-hidden" id="streak-calendar-popover">
      {/* Background Dot Halftone */}
      <div className="absolute inset-0 comic-halftone opacity-10 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
          <h3 className="font-comic text-2xl text-black tracking-wide uppercase">STREAK LOG</h3>
          <button 
            id="close-streak-btn"
            onClick={onClose} 
            className="comic-border bg-red-400 text-black px-2 py-0.5 rounded font-bold hover:bg-red-500 cursor-pointer text-sm"
          >
            X
          </button>
        </div>

        <p className="text-sm mb-4 leading-snug">
          Complete tasks or make progress to build your streak. Miss up to <strong className="text-red-500">3 days</strong> without losing your active count!
        </p>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="font-bold text-xs text-black uppercase font-mono">{day}</div>
          ))}
          {pastDays.map((item, idx) => (
            <div
              key={idx}
              title={`${item.dateStr}: ${item.completedCount} actions. ${item.isGrace ? 'Streak saved by grace period!' : ''}`}
              className={`comic-border border-2 rounded aspect-square flex flex-col justify-center items-center font-bold text-sm cursor-help transition-all ${getDayStyle(item)}`}
            >
              <span>{item.dayNum}</span>
              {item.completedCount > 0 && (
                <span className="text-[9px] font-mono mt-0.5 font-bold">+{item.completedCount}</span>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="border-t border-black pt-3 text-xs flex flex-wrap gap-x-4 gap-y-2 justify-center">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#FF007F] comic-border border inline-block" />
            <span>Overachiever (4+)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#FF9500] comic-border border inline-block" />
            <span>Productive (2-3)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#FFDE4D] comic-border border inline-block" />
            <span>Active (1)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-300 border-dashed border border-gray-600 inline-block" />
            <span>Grace (Up to 3d missed)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
