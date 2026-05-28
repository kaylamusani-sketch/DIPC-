import React, { useState } from 'react';
import { Event, Month } from '../types';
import { isEventInMonth } from '../utils/dateUtils';
import { EventModal } from './EventModal';
import { Calendar, Share2, Megaphone, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface MonthPageProps {
  month: Month;
  year: number;
  events: Event[];
  onUpdateEvent: (updatedEvent: Event) => void;
}

export const MonthPage: React.FC<MonthPageProps> = ({ month, year, events, onUpdateEvent }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const monthEvents = events.filter(e => isEventInMonth(e, month, year));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">{month}</h1>
          <p className="text-gray-500 font-medium text-lg mt-1">Events and observances for {year}</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Calendar
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Socials
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Assembly
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {monthEvents.length > 0 ? (
          monthEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedEvent(event)}
              className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                    {event.dates[year] || 'TBA'}
                  </span>
                  {event.isAllMonth && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase">All Month</span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                  {event.name}
                </h3>

                <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

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
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <Calendar className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No events found for this month.</p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          year={year} 
          onClose={() => setSelectedEvent(null)} 
          onUpdate={onUpdateEvent}
        />
      )}
    </div>
  );
};
