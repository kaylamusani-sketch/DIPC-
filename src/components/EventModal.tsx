import React, { useState, useRef } from 'react';
import { Event, Month } from '../types';
import { Calendar, Share2, Megaphone, X, Upload, User, Info, CheckCircle2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EventModalProps {
  event: Event;
  year: number;
  onClose: () => void;
  onUpdate: (updatedEvent: Event) => void;
  onDelete?: (id: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, year, onClose, onUpdate, onDelete }) => {
  const [isEditingDetails, setIsEditingDetails] = useState(!event.id);
  const [name, setName] = useState(event.name || '');
  const [description, setDescription] = useState(event.description || '');
  const [selectedMonth, setSelectedMonth] = useState<Month>(event.month || 'September');
  const [dateStr, setDateStr] = useState(event.dates?.[year] || '');
  const [isAllMonth, setIsAllMonth] = useState(event.isAllMonth || false);

  const [announcement, setAnnouncement] = useState(event.announcementText || '');
  const [speaker, setSpeaker] = useState(event.speaker || '');
  const [onCalendar, setOnCalendar] = useState(event.onCalendar);
  const [onSocialMedia, setOnSocialMedia] = useState(event.onSocialMedia);
  const [announced, setAnnounced] = useState(event.announced);
  const [isCompleted, setIsCompleted] = useState(event.isCompleted || false);
  const [graphicUrl, setGraphicUrl] = useState(event.graphicUrl || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const date = isEditingDetails ? dateStr : (event.dates?.[year] || 'TBA');

  const handleSave = () => {
    if (isEditingDetails && !name.trim()) return;

    // Check if critical fields changed to reset email status
    const hasChanged = 
      event.announcementText !== announcement || 
      event.speaker !== speaker || 
      event.graphicUrl !== graphicUrl ||
      event.name !== name ||
      event.description !== description;

    const eventId = event.id || `event-${Date.now()}`;

    onUpdate({
      ...event,
      id: eventId,
      name: isEditingDetails ? name : event.name,
      description: isEditingDetails ? description : event.description,
      month: isEditingDetails ? selectedMonth : event.month,
      dates: {
        ...(event.dates || {}),
        [year]: isEditingDetails ? dateStr : (event.dates?.[year] || '')
      },
      isAllMonth: isEditingDetails ? isAllMonth : event.isAllMonth,
      announcementText: announcement,
      speaker,
      onCalendar,
      onSocialMedia,
      announced,
      isCompleted,
      graphicUrl,
      isEmailSent: hasChanged ? false : event.isEmailSent
    });
    onClose();
  };

  const handleCancel = () => {
    if (!event.id) {
      // It's a brand new event, just close the modal
      onClose();
    } else {
      // Revert states and go back to View Mode
      setName(event.name || '');
      setDescription(event.description || '');
      setSelectedMonth(event.month || 'September');
      setDateStr(event.dates?.[year] || '');
      setIsAllMonth(event.isAllMonth || false);
      setAnnouncement(event.announcementText || '');
      setSpeaker(event.speaker || '');
      setOnCalendar(event.onCalendar);
      setOnSocialMedia(event.onSocialMedia);
      setAnnounced(event.announced);
      setIsCompleted(event.isCompleted || false);
      setGraphicUrl(event.graphicUrl || '');
      setIsEditingDetails(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGraphicUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {/* 
        Scrolling Fix:
        Changed overlay to 'items-start overflow-y-auto' with padding,
        ensuring that tall forms are fully scrollable and not cut off at the top.
      */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden relative my-6 md:my-12 border border-gray-100"
        >
          {/* Prominent upper-right Close (X) button */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors z-20 border border-gray-100"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            {isEditingDetails ? (
              /* --- EDIT MODE Core Fields Box --- */
              <div className="space-y-4 mb-8 bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">
                    {event.id ? 'Edit Core Event Info' : 'Create New Event'}
                  </h3>
                  {event.id && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Back to View Mode
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-550 uppercase tracking-wider">Event Name *</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Earth Day"
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-550 uppercase tracking-wider">Date String ({year}) *</label>
                    <input 
                      type="text"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      placeholder="e.g. Apr 22 or All Month"
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-550 uppercase tracking-wider">Month *</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value as Month)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input 
                      type="checkbox"
                      id="isAllMonth"
                      checked={isAllMonth}
                      onChange={(e) => setIsAllMonth(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="isAllMonth" className="text-xs font-bold text-gray-650 uppercase tracking-wider cursor-pointer select-none">
                      Is All Month Event
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-550 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this event..."
                    className="w-full px-4 py-2.5 h-20 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            ) : (
              /* --- VIEW MODE Header Info --- */
              <div className="mb-8 pr-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                      {event.month}
                    </span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-600 font-medium">{date}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsEditingDetails(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/35"
                  >
                    Edit Core Details
                  </button>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{event.name}</h2>
                <p className="text-gray-500 leading-relaxed text-sm whitespace-pre-line">{event.description || "No description provided."}</p>
              </div>
            )}

            {/* Content Layout Column (Shared in both edit & view modes, but input fields are editable) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Graphic & Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-450 uppercase tracking-widest">Graphic / Social Post</h3>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>
                
                <div className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center relative group">
                  {graphicUrl ? (
                    <img src={graphicUrl} alt="Event Graphic" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-center p-6">
                      <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-medium">No graphic uploaded yet</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-gray-50 transition-all"
                    >
                      Change Image
                    </button>
                    {graphicUrl && (
                      <button 
                        type="button"
                        onClick={() => setGraphicUrl('')}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-red-750 transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Announcement & Speaker */}
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-450 uppercase tracking-widest">Assembly Announcement</h3>
                  <textarea 
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    placeholder="Write the announcement script here..."
                    className="w-full h-44 bg-gray-50 border border-gray-150 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-450 uppercase tracking-widest">Assembly Speaker</h3>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      placeholder="Who is speaking?"
                      className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-450 uppercase tracking-widest">Visibility Settings</h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => setOnCalendar(!onCalendar)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${onCalendar ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                    >
                      <Calendar className="w-4 h-4" />
                      Calendar
                    </button>
                    <button 
                      type="button"
                      onClick={() => setOnSocialMedia(!onSocialMedia)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${onSocialMedia ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                    >
                      <Share2 className="w-4 h-4" />
                      Social Media
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAnnounced(!announced)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${announced ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                    >
                      <Megaphone className="w-4 h-4" />
                      Announced
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsCompleted(!isCompleted)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isCompleted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Toolbar & Action Bar */}
            <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 text-gray-400">
                {onDelete && event.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this event? This action will permanently remove it.")) {
                        onDelete(event.id);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Event
                  </button>
                ) : !event.id ? (
                  <div className="flex items-center gap-2 text-indigo-500 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/30">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Creating new entry</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-450 bg-gray-50/80 px-3 py-1.5 rounded-lg border border-gray-150">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Saved to cloud database</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 w-full md:w-auto justify-end">
                {isEditingDetails ? (
                  <>
                    <button 
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2.5 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors border border-transparent"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      disabled={!name.trim()}
                      onClick={handleSave}
                      className={`px-8 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all ${!name.trim() ? 'opacity-40 cursor-not-allowed shadow-none' : ''}`}
                    >
                      {event.id ? 'Save Changes' : 'Create Event'}
                    </button>
                  </>
                ) : (
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-8 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-sm font-bold transition-all shadow-md"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
