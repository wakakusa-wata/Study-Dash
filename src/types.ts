export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  xp: number;
  weeklyGoalMinutes: number;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string; // ISO date string
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0-100
  userId: string;
  userName: string;
  userPhoto?: string;
  teamId?: string; // Empty if individual
  personalDeadline?: string; // ISO date string (Self completion target)
  googleCalendarEventId?: string;
  googleCalendarPersonalEventId?: string;
  overdueReminded?: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // List of user emails or uids as simple names
  createdAt: string;
}

export interface Journal {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  studyMinutes: number;
  createdAt: string; // ISO string
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
}

export interface ExamSchedule {
  id: string;
  userId: string;
  title: string;
  examDate: string; // YYYY-MM-DD
  subjects?: string[];
  notes?: string;
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
