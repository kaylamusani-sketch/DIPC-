import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  User, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Mail, 
  XCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { Event, AssemblyAssignment, MonthlyAssignments, Month, Person } from '../types';
import { getThursdaysInMonth, formatDate, parseEventDate, toISODateString } from '../utils/dateUtils';
import { EventModal } from './EventModal';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  query
} from 'firebase/firestore';

interface DashboardProps {
  events: Event[];
  onUpdateEvent: (updatedEvent: Event) => void;
  onDeleteEvent?: (id: string) => void;
  people: Person[];
}

interface SpeakerEmailInputProps {
  onSend: () => void;
  isSent?: boolean;
}

const SpeakerEmailInput: React.FC<SpeakerEmailInputProps> = ({ onSend, isSent }) => {
  return (
    <button
      onClick={onSend}
      title="Send Announcement Email"
      className={`p-1.5 rounded-lg transition-colors ${isSent ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
    >
      <Mail className="w-3.5 h-3.5" />
    </button>
  );
};

interface AssignmentEmailInputProps {
  onSend: () => void;
  isSent?: boolean;
}

const AssignmentEmailInput: React.FC<AssignmentEmailInputProps> = ({ onSend, isSent }) => {
  return (
    <button
      onClick={onSend}
      title="Send Email"
      className={`p-1.5 rounded-lg transition-colors ${isSent ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
    >
      <Mail className="w-3 h-3" />
    </button>
  );
};

interface MonthlyEmailInputProps {
  onSend: () => void;
  isSent?: boolean;
}

const MonthlyEmailInput: React.FC<MonthlyEmailInputProps> = ({ onSend, isSent }) => {
  return (
    <button
      onClick={onSend}
      title="Send Email"
      className={`p-2 rounded-xl transition-colors ${isSent ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
    >
      <Mail className="w-5 h-5" />
    </button>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ events, onUpdateEvent, onDeleteEvent, people }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState<Record<string, AssemblyAssignment>>({});
  const [monthlyAssignments, setMonthlyAssignments] = useState<Record<string, MonthlyAssignments>>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const monthNames: Month[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = `${year}-${month + 1}`; // Use 1-indexed month for key
  const thursdays = getThursdaysInMonth(month, year);

  // Firestore Weekly Assignments Listener
  useEffect(() => {
    const assignmentsRef = collection(db, 'assignments');
    const q = query(assignmentsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Record<string, AssemblyAssignment> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data() as AssemblyAssignment;
      });
      setAssignments(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'assignments');
    });

    return () => unsubscribe();
  }, []);

  // Firestore Monthly Assignments Listener
  useEffect(() => {
    const monthlyRef = collection(db, 'monthlyAssignments');
    const q = query(monthlyRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Record<string, MonthlyAssignments> = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data() as MonthlyAssignments;
      });
      setMonthlyAssignments(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'monthlyAssignments');
    });

    return () => unsubscribe();
  }, []);

  const currentMonthly = monthlyAssignments[monthKey] || {
    calendarAssignee: '',
    calendarAssigneeEmail: '',
    isCalendarUpdated: false,
    socialMediaAssignee: '',
    socialMediaAssigneeEmail: '',
    isSocialMediaSent: false
  };

  const updateMonthly = async (updates: Partial<MonthlyAssignments>) => {
    try {
      const newMonthly = { ...currentMonthly, ...updates };
      await setDoc(doc(db, 'monthlyAssignments', monthKey), newMonthly);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `monthlyAssignments/${monthKey}`);
    }
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const updateAssignment = async (dateStr: string, updates: Partial<AssemblyAssignment>) => {
    try {
      const current = assignments[dateStr] || {
        thursdayDate: dateStr,
        speaker: '',
        speakerEmail: '',
        emailAssignee: '',
        emailAssigneeEmail: '',
        isCancelled: false
      };
      const newAssignment = { ...current, ...updates };
      await setDoc(doc(db, 'assignments', dateStr), newAssignment);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `assignments/${dateStr}`);
    }
  };

  const getEmailForName = (input: string) => {
    if (!input) return null;
    
    const search = input.toLowerCase().trim();
    
    // 1. Try exact full name match
    const exactMatch = people.find(p => p.name.toLowerCase() === search);
    if (exactMatch) return exactMatch.email;
    
    // 2. Try first name + last initial match (e.g. "John D")
    const parts = search.split(/\s+/);
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastInitial = parts[parts.length - 1][0];
      const matches = people.filter(p => {
        const pParts = p.name.toLowerCase().split(/\s+/);
        return pParts[0] === firstName && pParts[pParts.length - 1][0] === lastInitial;
      });
      if (matches.length === 1) return matches[0].email;
    }
    
    // 3. Try first name only match (if unique)
    const firstNameMatches = people.filter(p => p.name.toLowerCase().split(/\s+/)[0] === search);
    if (firstNameMatches.length === 1) return firstNameMatches[0].email;
    
    return null;
  };

  // Real email sending function via backend
  const sendEmailNotification = async (type: 'announcement' | 'calendar' | 'social', email: string, data: any) => {
    if (!email) {
      alert("No email address found for this person. Please add them to the Directory.");
      return false;
    }

    let subject = '';
    let html = '';

    if (type === 'announcement') {
      subject = `DIPC Announcement: ${data.event}`;
      html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">DIPC Announcement Reminder</h2>
          <p>You have been assigned to announce the following event:</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Event:</strong> ${data.event}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Announcement:</strong> ${data.announcement}</p>
          </div>
          <p style="font-size: 12px; color: #6b7280;">This is an automated reminder from DIPC.</p>
        </div>
      `;
    } else if (type === 'calendar') {
      subject = `DIPC Calendar Update: ${data.month}`;
      html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">DIPC Calendar Update Reminder</h2>
          <p>Please update the school calendar for <strong>${data.month}</strong> with the following holidays/events:</p>
          <ul style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0;">
            ${data.holidays.map((h: string) => `<li>${h}</li>`).join('')}
          </ul>
          <p style="font-size: 12px; color: #6b7280;">This is an automated reminder from DIPC.</p>
        </div>
      `;
    } else if (type === 'social') {
      subject = `DIPC Social Media Posts: ${data.month}`;
      html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">DIPC Social Media Posts Reminder</h2>
          <p>Please prepare and send the social media posts for <strong>${data.month}</strong>:</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
            ${data.posts.map((p: any) => `
              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                <p><strong>Event:</strong> ${p.name}</p>
                ${p.image ? `<img src="${p.image}" alt="${p.name}" style="max-width: 200px; border-radius: 8px;" />` : '<p><em>No image provided</em></p>'}
              </div>
            `).join('')}
          </div>
          <p style="font-size: 12px; color: #6b7280;">This is an automated reminder from DIPC.</p>
        </div>
      `;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject, html }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Email successfully sent to ${email}!`);
        return true;
      } else {
        alert(`Failed to send email: ${result.error}`);
        return false;
      }
    } catch (error: any) {
      console.error("Email API call failed:", error);
      alert(`Error sending email: ${error.message}`);
      return false;
    }
  };

  const handleSendAnnouncementEmail = async (thursday: Date, event: Event) => {
    const email = getEmailForName(event.speaker || '');
    if (email) {
      const success = await sendEmailNotification('announcement', email, {
        date: formatDate(thursday),
        event: event.name,
        announcement: event.announcementText || event.description
      });
      if (success) {
        onUpdateEvent({ ...event, isEmailSent: true });
      }
    } else {
      alert(`Could not find an email for "${event.speaker}". Please add them to the Directory.`);
    }
  };

  const handleSendCalendarEmail = async () => {
    const email = getEmailForName(currentMonthly.calendarAssignee);
    if (email) {
      const monthEvents = events.filter(e => e.month === monthNames[month] && e.onCalendar);
      const success = await sendEmailNotification('calendar', email, {
        month: monthNames[month],
        holidays: monthEvents.map(e => e.name)
      });
      if (success) {
        updateMonthly({ isCalendarEmailSent: true });
      }
    } else {
      alert(`Could not find an email for "${currentMonthly.calendarAssignee}". Please add them to the Directory.`);
    }
  };

  const handleSendSocialMediaEmail = async () => {
    const email = getEmailForName(currentMonthly.socialMediaAssignee);
    if (email) {
      const monthEvents = events.filter(e => e.month === monthNames[month] && e.onSocialMedia);
      const success = await sendEmailNotification('social', email, {
        month: monthNames[month],
        posts: monthEvents.map(e => ({ name: e.name, image: e.graphicUrl }))
      });
      if (success) {
        updateMonthly({ isSocialMediaEmailSent: true });
      }
    } else {
      alert(`Could not find an email for "${currentMonthly.socialMediaAssignee}". Please add them to the Directory.`);
    }
  };

  const handleSendWeeklyDeadlineEmail = async (thursday: Date) => {
    const dateStr = thursday.toISOString().split('T')[0];
    const email = 'kaylamusani@gmail.com'; // Automated assembly email proxy
    
    const announcements = getAnnouncementsForThursday(thursday);
    const subject = `DIPC Weekly Announcements: ${formatDate(thursday)}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5;">Weekly Announcements Summary</h2>
        <p>The following announcements are scheduled for the assembly on <strong>${formatDate(thursday)}</strong>:</p>
        <div style="margin: 20px 0;">
          ${announcements.map(a => `
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 5px 0;"><strong>${a.name}</strong></p>
              <p style="margin: 0; font-size: 13px; color: #4b5563;">${a.announcementText || a.description}</p>
              ${a.speaker ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Speaker: ${a.speaker}</p>` : ''}
            </div>
          `).join('')}
        </div>
        <p style="font-size: 12px; color: #6b7280;">This is an automated summary from DIPC.</p>
      </div>
    `;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject, html }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Weekly summary successfully sent to ${email}!`);
        updateAssignment(dateStr, { isEmailSent: true });
      } else {
        alert(`Failed to send weekly summary: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Email API call failed:", error);
      alert(`Error sending weekly summary: ${error.message}`);
    }
  };

  const handleMoveAnnouncement = async (event: Event, direction: 'up' | 'down', currentThursday: Date) => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    const allPossibleTs = [
      ...getThursdaysInMonth(prevMonth, prevYear),
      ...getThursdaysInMonth(month, year),
      ...getThursdaysInMonth(nextMonth, nextYear)
    ];

    const currentIndex = allPossibleTs.findIndex(t => t.getTime() === currentThursday.getTime());
    
    let targetThursday: Date | null = null;
    if (direction === 'up' && currentIndex > 0) {
      targetThursday = allPossibleTs[currentIndex - 1];
    } else if (direction === 'down' && currentIndex < allPossibleTs.length - 1) {
      targetThursday = allPossibleTs[currentIndex + 1];
    }

    if (targetThursday) {
      onUpdateEvent({
        ...event,
        manualThursdayDate: toISODateString(targetThursday)
      });
    }
  };

  const getUnassignedAnnouncements = () => {
    const currentThursdays = getThursdaysInMonth(month, year);
    const assignedIds = new Set<string>();
    currentThursdays.forEach(t => {
      getAnnouncementsForThursday(t).forEach(a => assignedIds.add(a.id));
    });
    
    return events.filter(e => 
      e.announced && 
      !e.isCompleted && 
      e.month === monthNames[month] &&
      !assignedIds.has(e.id)
    );
  };

  const handleClearOverride = (event: Event) => {
    onUpdateEvent({
      ...event,
      manualThursdayDate: undefined
    });
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    const oldEvent = events.find(e => e.id === updatedEvent.id);
    
    // Reset email sent flag if critical fields changed
    let eventToUpdate = { ...updatedEvent };
    if (oldEvent && (
      oldEvent.speaker !== updatedEvent.speaker || 
      oldEvent.announcementText !== updatedEvent.announcementText ||
      oldEvent.graphicUrl !== updatedEvent.graphicUrl
    )) {
      eventToUpdate.isEmailSent = false;
    }

    onUpdateEvent(eventToUpdate);

    if (oldEvent && (oldEvent.announcementText !== updatedEvent.announcementText || oldEvent.graphicUrl !== updatedEvent.graphicUrl)) {
      const thursdaysInMonth = getThursdaysInMonth(month, year);
      thursdaysInMonth.forEach(t => {
        const announcements = getAnnouncementsForThursday(t);
        if (announcements.some(a => a.id === updatedEvent.id)) {
          handleSendAnnouncementEmail(t, eventToUpdate);
        }
      });
      
      if (updatedEvent.onSocialMedia && updatedEvent.month === monthNames[month]) {
        handleSendSocialMediaEmail();
      }
    }
  };

  const getAnnouncementsForThursday = (thursday: Date) => {
    const dateStr = toISODateString(thursday);
    const isCancelled = assignments[dateStr]?.isCancelled;
    
    if (isCancelled) return [];

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    const allPossibleTs = [
      ...getThursdaysInMonth(prevMonth, prevYear),
      ...getThursdaysInMonth(month, year),
      ...getThursdaysInMonth(nextMonth, nextYear)
    ];
    
    // First, get events manually assigned to this Thursday
    const manualAnnouncements = events.filter(e => {
      if (!e.announced || e.isCompleted || !e.manualThursdayDate) return false;
      
      // Handle both ISO strings and YYYY-MM-DD strings
      const manualDate = new Date(e.manualThursdayDate);
      return toISODateString(manualDate) === dateStr;
    });

    // Then get base announcements, excluding those with manual overrides
    let announcements = getBaseAnnouncementsForThursday(thursday).filter(e => !e.manualThursdayDate);

    allPossibleTs.forEach(otherT => {
      const otherDateStr = toISODateString(otherT);
      if (assignments[otherDateStr]?.isCancelled) {
        const nearest = findNearestNonCancelledThursday(otherT, allPossibleTs);
        if (nearest && toISODateString(nearest) === dateStr) {
          announcements = [...announcements, ...getBaseAnnouncementsForThursday(otherT).filter(e => !e.manualThursdayDate)];
        }
      }
    });

    return [...announcements, ...manualAnnouncements];
  };

  const getBaseAnnouncementsForThursday = (thursday: Date) => {
    const isFirstThursday = thursday.getDate() <= 7;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    const allPossibleTs = [
      ...getThursdaysInMonth(prevMonth, prevYear),
      ...getThursdaysInMonth(month, year),
      ...getThursdaysInMonth(nextMonth, nextYear)
    ];

    return events.filter(e => {
      if (!e.announced) return false;
      if (e.isCompleted) return false;

      const dateStr = e.dates[year];
      if (!dateStr) return false;

      if (dateStr === 'All Month') {
        return isFirstThursday && e.month === monthNames[month];
      }
      
      const eventDate = parseEventDate(dateStr, year);
      if (!eventDate) return false;

      let closestT = allPossibleTs[0];
      let minDiff = Math.abs(eventDate.getTime() - allPossibleTs[0].getTime());

      for (const t of allPossibleTs) {
        const diff = Math.abs(eventDate.getTime() - t.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestT = t;
        } else if (diff === minDiff && t.getTime() > eventDate.getTime()) {
          closestT = t;
        }
      }

      return closestT.getTime() === thursday.getTime();
    });
  };

  const getCompletedAnnouncementsForThursday = (thursday: Date) => {
    const dateStr = toISODateString(thursday);
    const isCancelled = assignments[dateStr]?.isCancelled;
    
    if (isCancelled) return [];

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    const allPossibleTs = [
      ...getThursdaysInMonth(prevMonth, prevYear),
      ...getThursdaysInMonth(month, year),
      ...getThursdaysInMonth(nextMonth, nextYear)
    ];
    
    // Get manually assigned completed events
    const manualCompleted = events.filter(e => {
      if (!e.announced || !e.isCompleted || !e.manualThursdayDate) return false;
      const manualDate = new Date(e.manualThursdayDate);
      return toISODateString(manualDate) === dateStr;
    });

    let completed = getBaseCompletedForThursday(thursday).filter(e => !e.manualThursdayDate);

    allPossibleTs.forEach(otherT => {
      const otherDateStr = toISODateString(otherT);
      if (assignments[otherDateStr]?.isCancelled) {
        const nearest = findNearestNonCancelledThursday(otherT, allPossibleTs);
        if (nearest && toISODateString(nearest) === dateStr) {
          completed = [...completed, ...getBaseCompletedForThursday(otherT).filter(e => !e.manualThursdayDate)];
        }
      }
    });

    return [...completed, ...manualCompleted];
  };

  const getBaseCompletedForThursday = (thursday: Date) => {
    const isFirstThursday = thursday.getDate() <= 7;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    const allPossibleTs = [
      ...getThursdaysInMonth(prevMonth, prevYear),
      ...getThursdaysInMonth(month, year),
      ...getThursdaysInMonth(nextMonth, nextYear)
    ];

    return events.filter(e => {
      if (!e.announced) return false;
      if (!e.isCompleted) return false;

      const dateStr = e.dates[year];
      if (!dateStr) return false;

      if (dateStr === 'All Month') {
        return isFirstThursday && e.month === monthNames[month];
      }
      
      const eventDate = parseEventDate(dateStr, year);
      if (!eventDate) return false;

      let closestT = allPossibleTs[0];
      let minDiff = Math.abs(eventDate.getTime() - allPossibleTs[0].getTime());

      for (const t of allPossibleTs) {
        const diff = Math.abs(eventDate.getTime() - t.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestT = t;
        } else if (diff === minDiff && t.getTime() > eventDate.getTime()) {
          closestT = t;
        }
      }

      return closestT.getTime() === thursday.getTime();
    });
  };

  const findNearestNonCancelledThursday = (cancelledT: Date, allTs: Date[]) => {
    let nearest: Date | null = null;
    let minDiff = Infinity;

    allTs.forEach(t => {
      const tStr = toISODateString(t);
      if (!assignments[tStr]?.isCancelled) {
        const diff = Math.abs(t.getTime() - cancelledT.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          nearest = t;
        } else if (diff === minDiff) {
          if (t.getTime() > cancelledT.getTime()) {
            nearest = t;
          }
        }
      }
    });

    return nearest;
  };

  const handleCancelThursday = (dateStr: string) => {
    const isCancelled = !assignments[dateStr]?.isCancelled;
    updateAssignment(dateStr, { isCancelled });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">DIPC Dashboard</h1>
          <p className="text-gray-500 font-medium italic">DIPC</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedEvent({
              id: '',
              name: '',
              description: '',
              month: monthNames[month],
              dates: {},
              onCalendar: true,
              onSocialMedia: false,
              announced: true,
            })}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
          
          <div className="flex items-center bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center select-none">
              {currentDate.toLocaleDateString('en-US', { month: 'long' })}
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Weekly Schedule</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {thursdays.map((thursday) => {
              const dateStr = toISODateString(thursday);
              const assignment = assignments[dateStr];
              const announcements = getAnnouncementsForThursday(thursday);
              const isCancelled = assignment?.isCancelled;
              const tuesdayDate = new Date(thursday);
              tuesdayDate.setDate(tuesdayDate.getDate() - 2);

              return (
                <motion.div 
                  key={dateStr}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-3xl border-2 transition-all p-6 ${isCancelled ? 'border-red-100 bg-red-50/30' : 'border-gray-100 hover:border-indigo-100 shadow-sm'}`}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-grow">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-black ${isCancelled ? 'text-red-400 line-through' : 'text-gray-900'}`}>
                          Thursday, {thursday.getDate()}
                        </span>
                        {isCancelled && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">Cancelled</span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Events & Announcements</p>
                        {announcements.length > 0 ? (
                          <div className="space-y-3">
                            {announcements.map(ann => (
                              <div key={ann.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 group">
                                <button 
                                  onClick={() => setSelectedEvent(ann)}
                                  className="flex items-center gap-2 text-indigo-700 text-sm font-bold hover:text-indigo-900 transition-colors"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                  {ann.name}
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                
                                <div className="sm:ml-auto flex flex-col gap-2">
                                  <div className="flex items-center gap-3">
                                    {ann.manualThursdayDate && (
                                      <button 
                                        onClick={() => handleClearOverride(ann)}
                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 underline"
                                        title="Reset to closest assembly"
                                      >
                                        Reset
                                      </button>
                                    )}
                                    <div className="relative flex-grow">
                                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400" />
                                      <input 
                                        type="text"
                                        placeholder="Speaker..."
                                        value={ann.speaker || ''}
                                        onChange={(e) => onUpdateEvent({ ...ann, speaker: e.target.value, isEmailSent: false })}
                                        className="w-full sm:w-32 pl-7 pr-3 py-1 bg-white border border-indigo-100 rounded-lg text-[11px] font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <button 
                                        onClick={() => handleMoveAnnouncement(ann, 'up', thursday)}
                                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors"
                                        title="Move to previous assembly"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => handleMoveAnnouncement(ann, 'down', thursday)}
                                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors"
                                        title="Move to next assembly"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <SpeakerEmailInput 
                                      onSend={() => handleSendAnnouncementEmail(thursday, ann)}
                                      isSent={ann.isEmailSent}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No announcements scheduled</p>
                        )}
                      </div>

                      {getCompletedAnnouncementsForThursday(thursday).length > 0 && (
                        <div className="pt-4 border-t border-gray-50 space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</p>
                          <div className="flex flex-wrap gap-2">
                            {getCompletedAnnouncementsForThursday(thursday).map(ann => (
                              <div key={ann.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-[11px] font-medium text-gray-500 line-through">{ann.name}</span>
                                <button 
                                  onClick={() => onUpdateEvent({ ...ann, isCompleted: false })}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                  Bring Back
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isCancelled && (
                        <div className="pt-4 border-t border-gray-50 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-widest">
                                <Mail className="w-3 h-3" />
                                Email Deadline: Tuesday, {tuesdayDate.getDate()}
                              </div>
                              <AssignmentEmailInput 
                                onSend={() => handleSendWeeklyDeadlineEmail(thursday)}
                                isSent={assignment?.isEmailSent}
                              />
                            </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 min-w-[160px] justify-start">
                      <button 
                        onClick={() => handleCancelThursday(dateStr)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${isCancelled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'}`}
                      >
                        {isCancelled ? <Plus className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {isCancelled ? 'Restore Assembly' : 'Cancel Assembly'}
                      </button>
                    </div>
                  </div>
                  
                  {isCancelled && announcements.length > 0 && (
                    <div className="mt-4 p-3 bg-white border border-red-100 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-700 leading-relaxed">
                        Assembly cancelled. Announcements for this week should be moved to the {thursday.getDate() > 15 ? 'next' : 'previous'} assembly.
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {getUnassignedAnnouncements().length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-gray-800">Unassigned Announcements</h2>
              </div>
              <div className="bg-amber-50 rounded-3xl border-2 border-amber-100 p-6">
                <p className="text-sm text-amber-800 mb-4 font-medium">
                  These events are marked for announcement in {monthNames[month]} but aren't assigned to a specific assembly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getUnassignedAnnouncements().map(ann => (
                    <div key={ann.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{ann.name}</p>
                        <p className="text-xs text-gray-500">{ann.dates[year]}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleClearOverride(ann)}
                          className="px-3 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg hover:bg-amber-200 transition-colors"
                        >
                          Reset Assignment
                        </button>
                        <button 
                          onClick={() => setSelectedEvent(ann)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Monthly Responsibilities</h2>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => updateMonthly({ isCalendarUpdated: !currentMonthly.isCalendarUpdated })}
                    className={`mt-1 transition-colors ${currentMonthly.isCalendarUpdated ? 'text-green-500' : 'text-gray-300 hover:text-indigo-400'}`}
                  >
                    {currentMonthly.isCalendarUpdated ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div>
                    <h3 className={`font-black text-lg ${currentMonthly.isCalendarUpdated ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      Update Calendar
                    </h3>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">
                      Due: Start of {currentDate.toLocaleDateString('en-US', { month: 'long' })}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned To</p>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Name..."
                        value={currentMonthly.calendarAssignee}
                        onChange={(e) => updateMonthly({ calendarAssignee: e.target.value, isCalendarEmailSent: false })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Send Email</p>
                    <MonthlyEmailInput 
                      onSend={handleSendCalendarEmail}
                      isSent={currentMonthly.isCalendarEmailSent}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 space-y-4">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => updateMonthly({ isSocialMediaSent: !currentMonthly.isSocialMediaSent })}
                    className={`mt-1 transition-colors ${currentMonthly.isSocialMediaSent ? 'text-green-500' : 'text-gray-300 hover:text-indigo-400'}`}
                  >
                    {currentMonthly.isSocialMediaSent ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div>
                    <h3 className={`font-black text-lg ${currentMonthly.isSocialMediaSent ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      Send Social Media Posts
                    </h3>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">
                      Monthly Assignment
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned To</p>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Name..."
                        value={currentMonthly.socialMediaAssignee}
                        onChange={(e) => updateMonthly({ socialMediaAssignee: e.target.value, isSocialMediaEmailSent: false })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Send Email</p>
                    <MonthlyEmailInput 
                      onSend={handleSendSocialMediaEmail}
                      isSent={currentMonthly.isSocialMediaEmailSent}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Weekly Reminder
                </div>
                <p className="text-xs text-indigo-600 leading-relaxed">
                  Weekly announcements must be emailed to assembly by Tuesday for the Thursday program.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200">
            <h3 className="font-bold text-lg mb-2">Assembly Note</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              When an assembly is cancelled, the system will automatically redistribute announcements to the nearest available assembly date.
            </p>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          year={year} 
          onClose={() => setSelectedEvent(null)} 
          onUpdate={handleUpdateEvent}
          onDelete={onDeleteEvent}
        />
      )}
    </div>
  );
};
