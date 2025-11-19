export interface Worker {
  id: string;
  name: string;
  company: string;
  occupation: string; // e.g., 'Electrician', 'Carpenter'
  avatarUrl: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  qrCodeValue: string;
}

export enum AttendanceStatus {
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  ABSENT = 'ABSENT'
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  siteId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  status: AttendanceStatus;
}

export interface DailyStats {
  date: string;
  totalWorkers: number;
  totalHours: number;
  roles: Record<string, number>;
}

export type ViewMode = 'SCAN' | 'DASHBOARD' | 'ANALYSIS';