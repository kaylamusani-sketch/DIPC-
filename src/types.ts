export interface Person {
  id: string;
  name: string;
  email: string;
}

export type Month = 'September' | 'October' | 'November' | 'December' | 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August';

export interface EventDate {
  year: number;
  date: string; // e.g., "Sep 15-17" or "Oct 4"
  startDay: number;
  endDay?: number;
  month: number; // 0-indexed
}

export interface Event {
  id: string;
  name: string;
  description: string;
  month: Month;
  dates: {
    [year: number]: string;
  };
  isAllMonth?: boolean;
  onCalendar: boolean;
  onSocialMedia: boolean;
  announced: boolean;
  isCompleted?: boolean;
  announcementText?: string;
  graphicUrl?: string;
  speaker?: string;
  speakerEmail?: string;
  isEmailSent?: boolean;
  manualThursdayDate?: string; // ISO string for manual override
}

export interface AssemblyAssignment {
  thursdayDate: string; // ISO string
  speaker: string;
  speakerEmail: string;
  emailAssignee: string; // Person emailing announcements on Tuesday
  emailAssigneeEmail: string;
  isCancelled: boolean;
  isEmailSent?: boolean;
}

export interface MonthlyAssignments {
  calendarAssignee: string;
  calendarAssigneeEmail: string;
  isCalendarUpdated: boolean;
  isCalendarEmailSent?: boolean;
  socialMediaAssignee: string;
  socialMediaAssigneeEmail: string;
  isSocialMediaSent: boolean;
  isSocialMediaEmailSent?: boolean;
}

export interface Responsibility {
  id: string;
  task: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  presentIds: string[]; // Array of Person IDs
}
