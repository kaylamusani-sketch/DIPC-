import { Event } from '../types';

export function getEventDateForYear(event: Event, year: number): string {
  return event.dates[year] || 'TBA';
}

export function isEventInMonth(event: Event, monthName: string, year: number): boolean {
  if (event.isAllMonth) {
    return event.month === monthName;
  }
  const dateStr = event.dates[year];
  if (!dateStr || dateStr === 'TBA') return false;
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthIndex = monthNames.indexOf(monthName);
  const monthShort = monthName.substring(0, 3);
  
  // Check if the date string explicitly mentions the month
  if (dateStr.includes(monthShort) || dateStr.includes(monthName)) {
    return true;
  }

  // Handle ranges that might span across months but only mention the second month partially
  // e.g., "Sep 25-Oct 2" in October. The current logic handles this via .includes("Oct").
  // But what if it's "Feb 14-Mar 28" and we are checking for March? .includes("Mar") works.
  
  return false;
}

export function getThursdaysInMonth(month: number, year: number): Date[] {
  const thursdays: Date[] = [];
  const date = new Date(year, month, 1);
  
  // Find first Thursday
  while (date.getDay() !== 4) {
    date.setDate(date.getDate() + 1);
  }
  
  while (date.getMonth() === month) {
    thursdays.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }
  
  return thursdays;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const monthMap: Record<string, number> = {
  'Jan': 0, 'January': 0,
  'Feb': 1, 'February': 1,
  'Mar': 2, 'March': 2,
  'Apr': 3, 'April': 3,
  'May': 4,
  'Jun': 5, 'June': 5,
  'Jul': 6, 'July': 6,
  'Aug': 7, 'August': 7,
  'Sep': 8, 'September': 8,
  'Oct': 9, 'October': 9,
  'Nov': 10, 'November': 10,
  'Dec': 11, 'December': 11
};

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseEventDate(dateStr: string, year: number): Date | null {
  if (!dateStr || dateStr === 'TBA' || dateStr === 'All Month') return null;
  
  const rangeMatch = dateStr.match(/([A-Za-z]+)\s+(\d+)-(\d+)/);
  if (rangeMatch) {
    const monthIndex = monthMap[rangeMatch[1]];
    if (monthIndex !== undefined) {
      return new Date(year, monthIndex, parseInt(rangeMatch[2]));
    }
  }

  const match = dateStr.match(/([A-Za-z]+)\s+(\d+)/);
  if (match) {
    const monthIndex = monthMap[match[1]];
    if (monthIndex !== undefined) {
      return new Date(year, monthIndex, parseInt(match[2]));
    }
  }
  
  return null;
}
