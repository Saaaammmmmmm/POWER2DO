import React, { useState } from 'react';
import { GmailEmail, Task, Category } from '../types';
import { Mail, Calendar, Sparkles, Send, Eye, EyeOff, Zap, Plus, Check } from 'lucide-react';
import { triggerComicInterjection } from './ComicInterjection';

interface BarfPageProps {
  tasks: Task[];
  categories: Category[];
  gmailEmails: GmailEmail[];
  todayStr: string;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  onToggleEmailRead: (id: string) => void;
  onLinkGmailAsTask: (email: GmailEmail) => void;
  onTaskClick: (task: Task) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
  linkedTaskId: string | null;
}

export default function BarfPage({
  tasks,
  categories,
  gmailEmails,
  todayStr,
  onAddTask,
  onToggleEmailRead,
  onLinkGmailAsTask,
  onTaskClick,
}: BarfPageProps) {
  const [inputText, setInputText] = useState('');
  const [showSidePanel, setShowSidePanel] = useState(true);

  // Quick Mocked Calendar Events for full-stack integration
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: 'evt-1', title: 'Product Sync & Halftone Design Review', time: '11:00 AM', date: todayStr, linkedTaskId: null },
    { id: 'evt-2', title: 'Power Team Lunch & Brainstorming', time: '1:00 PM', date: todayStr, linkedTaskId: null },
    { id: 'evt-3', title: 'Weekly Sprint Retrospective', time: '4:30 PM', date: todayStr, linkedTaskId: null },
  ]);

  const defaultCategory = categories[0]?.id || 'cat-personal';
  const defaultWorkCategory = categories.find(c => c.id.includes('work'))?.id || defaultCategory;

  const handleBarfOut = () => {
    const lines = inputText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return;

    lines.forEach(line => {
      onAddTask({
        name: line,
        description: 'Barfed from Brain Dump!',
        category: defaultCategory,
        spaces: [],
        dueDate: '',
        doDate: todayStr,
        isCompleted: false,
        progressCount: 0,
        repeatInterval: 'none',
        priority: tasks.length + 5,
        duration: 30,
        startTime: '',
        parentId: null,
      });
    });

    triggerComicInterjection('BARFED OUT!');
    setInputText('');
  };

  const handleAddCalendarTask = (event: CalendarEvent) => {
    onAddTask({
      name: `Review: ${event.title}`,
      description: `Linked to calendar event scheduled at ${event.time}`,
      category: defaultWorkCategory,
      spaces: [],
      dueDate: '',
      doDate: event.date,
      isCompleted: false,
      progressCount: 0,
      repeatInterval: 'none',
      priority: tasks.length + 1,
      duration: 45,
      startTime: event.time.replace(' AM', '').replace(' PM', ''),
      parentId: null,
    });

    setCalendarEvents(prev =>
      prev.map(evt => (evt.id === event.id ? { ...evt, linkedTaskId: 'linked' } : evt))
    );
    triggerComicInterjection('MISSION LINKED!');
  };

  const handleQuickAddSingle = (line: string) => {
    if (!line.trim()) return;
    onAddTask({
      name: line.trim(),
      description: 'Quick dump mission',
      category: defaultCategory,
      spaces: [],
      dueDate: '',
      doDate: todayStr,
      isCompleted: false,
      progressCount: 0,
      repeatInterval: 'none',
      priority: tasks.length + 1,
      duration: 30,
      startTime: '',
      parentId: null,
    });
    triggerComicInterjection('DUMPED!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative" id="barf-page-container">
      
      {/* CENTRAL BRAIN DUMP WORKSPACE */}
      <div className={`${showSidePanel ? 'md:col-span-8' : 'col-span-12'} space-y-4 transition-all duration-300`}>
        <div className="bg-white comic-border p-6 rounded-none comic-shadow relative overflow-hidden">
          
          {/* Playful Header */}
          <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
            <div>
              <h2 className="font-comic text-2xl md:text-3xl font-extrabold uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
                Mission Barf Chamber
              </h2>
              <p className="text-xs text-gray-500 font-sans mt-1">
                Type or paste whatever is in your head. Put each mission on a separate line, then barf them out into active tasks instantly!
              </p>
            </div>

            {/* Toggle Sidebar button */}
            <button
              id="barf-toggle-sidebar"
              type="button"
              onClick={() => setShowSidePanel(!showSidePanel)}
              className="bg-yellow-200 hover:bg-yellow-300 comic-border px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform"
            >
              {showSidePanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSidePanel ? 'Hide Feed' : 'Show Feed'}
            </button>
          </div>

          {/* Quick Line Input helpers */}
          <div className="space-y-4">
            <textarea
              id="barf-textarea"
              placeholder="Assemble the shelf&#10;Design retro banner&#10;Water the flowers&#10;Prepare campaign slides..."
              rows={10}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full bg-yellow-50/20 text-black font-mono text-sm p-4 border-4 border-black rounded-none focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400"
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase">
                📝 {inputText.split('\n').filter(l => l.trim()).length} potential missions detected
              </span>

              <button
                id="barf-submit-btn"
                onClick={handleBarfOut}
                disabled={!inputText.trim()}
                className={`font-comic text-lg px-6 py-2.5 comic-border rounded-none comic-shadow-sm font-bold transition-all cursor-pointer ${
                  inputText.trim()
                    ? 'bg-[#FFDE4D] text-black hover:bg-[#ffe366]'
                    : 'bg-gray-200 text-gray-400 border-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                BARF THEM OUT! 💥
              </button>
            </div>
          </div>
        </div>

        {/* Pro-Tip Card */}
        <div className="bg-blue-100 comic-border p-4 rounded-none comic-shadow-sm flex items-start gap-3">
          <span className="text-xl shrink-0">💡</span>
          <p className="text-xs text-blue-900 font-sans font-medium leading-relaxed">
            <strong>CHAMBER PRO-TIP:</strong> You can quickly dump single lines directly using standard inputs. Ideal for clearing cognitive load before getting into high-focus work.
          </p>
        </div>
      </div>

      {/* HIDEABLE SIDE FEED (CALENDAR EVENTS & GMAIL SYNC) */}
      {showSidePanel && (
        <div className="md:col-span-4 space-y-4 animate-comic-pop" id="barf-sidebar-panel">
          
          {/* 1. GMAIL SYNC FEED */}
          <div className="bg-red-50 comic-border p-4 rounded-none comic-shadow">
            <h3 className="font-comic text-sm uppercase text-red-800 tracking-wide border-b-2 border-red-200 pb-2 mb-3 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-red-500" />
              Gmail Power Sync
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {gmailEmails.map(email => (
                <div
                  key={email.id}
                  className={`p-2.5 bg-white border-2 border-black rounded-none flex flex-col gap-1 transition-all ${
                    email.isRead ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                    <span className="font-bold truncate max-w-[120px]">{email.from}</span>
                    <span>{email.date}</span>
                  </div>
                  <h4 className="text-xs font-bold truncate">{email.subject}</h4>
                  <p className="text-[10px] text-gray-600 line-clamp-2 leading-tight">{email.snippet}</p>

                  <div className="flex gap-2 justify-end pt-1.5 mt-1 border-t border-dashed border-gray-200">
                    <button
                      type="button"
                      onClick={() => onToggleEmailRead(email.id)}
                      className="text-[9px] font-bold underline text-gray-500 hover:text-black"
                    >
                      {email.isRead ? 'Unread' : 'Read'}
                    </button>
                    {!email.isRead && (
                      <button
                        type="button"
                        onClick={() => onLinkGmailAsTask(email)}
                        className="bg-red-200 hover:bg-red-300 comic-border text-[10px] px-2 py-0.5 font-bold cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> Dump as Mission
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. CALENDAR EVENT FEED */}
          <div className="bg-purple-50 comic-border p-4 rounded-none comic-shadow">
            <h3 className="font-comic text-sm uppercase text-purple-800 tracking-wide border-b-2 border-purple-200 pb-2 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-500" />
              Calendar Event Sync
            </h3>

            <div className="space-y-2.5">
              {calendarEvents.map(event => (
                <div
                  key={event.id}
                  className="p-2.5 bg-white border-2 border-black rounded-none flex flex-col gap-1"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-purple-700 font-bold">
                    <span>{event.time}</span>
                    <span>Today</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">{event.title}</h4>

                  <div className="flex justify-end pt-1.5 mt-1 border-t border-dashed border-gray-200">
                    {event.linkedTaskId ? (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Mission Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddCalendarTask(event)}
                        className="bg-purple-200 hover:bg-purple-300 comic-border text-[10px] px-2 py-0.5 font-bold cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> Attach Mission
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
