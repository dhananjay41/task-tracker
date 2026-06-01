export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Status = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  assigneeId: string;
  assignee?: User;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}
