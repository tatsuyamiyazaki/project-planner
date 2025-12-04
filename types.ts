export interface Assignee {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  projectId: string;
  parentId: string | null;
  assigneeId: string | null;
  sortOrder: number;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  estimatedHours: number | null;
  estimatedBudget: number | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string;
  status: ProjectStatus;
}