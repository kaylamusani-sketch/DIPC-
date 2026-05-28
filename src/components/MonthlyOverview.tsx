import React, { useState } from 'react';
import { Event, Month } from '../types';
import { isEventInMonth, parseEventDate } from '../utils/dateUtils';
import { EventModal } from './EventModal';
import { Calendar, Share2, Megaphone, ChevronRight, LayoutGrid, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface MonthlyOverviewProps {
  events: Event[];
  onUpdateEvent: (updatedEvent: Event) => void;
  onDeleteEvent?: (id: string) => void;
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ events, onUpdateEvent, onDeleteEvent }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();

  const monthNames: Month[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getChronologicalMonths = () => {
    const list: { month: Month; year: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentYear, currentMonthIndex + i, 1);
      const m = monthNames[d.getMonth()];
      list.push({ month: m as Month, year: d.getFullYear() });
    }
    return list;
  };

  const chronologicalMonths = getChronologicalMonths();

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Monthly Overview</h1>
          <p className="text-gray-500 font-medium">A chronological view of all upcoming events and observances</p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedEvent({
            id: '',
            name: '',
            description: '',
            month: monthNames[currentMonthIndex],
            dates: {},
            onCalendar: true,
            onSocialMedia: false,
            announced: true,
          })}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      <div className="space-y-16">
        {chronologicalMonths.map(({ month, year }) => {
          const monthEvents = events
            .filter(e => isEventInMonth(e, month, year))
            .sort((a, b) => {
              // 1. All Month events first
              if (a.isAllMonth && !b.isAllMonth) return -1;
              if (!a.isAllMonth && b.isAllMonth) return 1;
              
              // 2. If both are All Month, sort by name
              if (a.isAllMonth && b.isAllMonth) return a.name.localeCompare(b.name);
              
              // 3. Otherwise sort by date
              const dateA = parseEventDate(a.dates[year], year);
              const dateB = parseEventDate(b.dates[year], year);
              
              if (!dateA && !dateB) return a.name.localeCompare(b.name);
              if (!dateA) return 1;
              if (!dateB) return -1;
              
              return dateA.getTime() - dateB.getTime() || a.name.localeCompare(b.name);
            });
          
          return (
            <div key={`${month}-${year}`} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{month} {year}</h2>
                <div className="h-px flex-grow bg-gray-100" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100">
                  {monthEvents.length} Events
                </span>
              </div>

              {monthEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {monthEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedEvent(event)}
                      className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                            {event.dates[year] || 'TBA'}
                          </span>
                          {event.isAllMonth && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase">All Month</span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {event.name}
                        </h3>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                          <div className={`p-2 rounded-lg ${event.onCalendar ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-300'}`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className={`p-2 rounded-lg ${event.onSocialMedia ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
                            <Share2 className="w-4 h-4" />
                          </div>
                          <div className={`p-2 rounded-lg ${event.announced ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-300'}`}>
                            <Megaphone className="w-4 h-4" />
                          </div>
                          {event.speaker && (
                            <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              {event.speaker}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                  <p className="text-sm font-medium italic">No events scheduled for this month.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          year={now.getFullYear()} 
          onClose={() => setSelectedEvent(null)} 
          onUpdate={onUpdateEvent}
          onDelete={onDeleteEvent}
        />
      )}
    </div>
  );
};
