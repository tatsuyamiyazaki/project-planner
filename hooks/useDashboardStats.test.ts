import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardStats } from './useDashboardStats';
import { Project, Ticket, Assignee } from '../types';

// テスト用のモックデータを生成するヘルパー
const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: crypto.randomUUID(),
  name: 'Test Project',
  description: '',
  manager: 'Test Manager',
  estimatedHours: null,
  estimatedBudget: null,
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-03-31'),
  notes: '',
  status: 'in_progress',
  ...overrides,
});

const createTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: crypto.randomUUID(),
  name: 'Test Ticket',
  startDate: new Date('2025-01-15'),
  endDate: new Date('2025-01-20'),
  projectId: 'project-1',
  parentId: null,
  assigneeId: null,
  sortOrder: 0,
  ...overrides,
});

const createAssignee = (overrides: Partial<Assignee> = {}): Assignee => ({
  id: crypto.randomUUID(),
  name: 'Test User',
  ...overrides,
});

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('empty data', () => {
    it('should return empty stats when no data provided', () => {
      const { result } = renderHook(() => useDashboardStats([], [], []));

      expect(result.current.projectStats.size).toBe(0);
      expect(result.current.globalStats.totalTickets).toBe(0);
      expect(result.current.globalStats.totalOverdue).toBe(0);
      expect(result.current.globalStats.totalDueSoon).toBe(0);
      expect(result.current.assigneeStats).toHaveLength(0);
    });
  });

  describe('globalStats', () => {
    it('should count total tickets across all projects', () => {
      const project = createProject({ id: 'project-1' });
      const tickets = [
        createTicket({ projectId: 'project-1' }),
        createTicket({ projectId: 'project-1' }),
        createTicket({ projectId: 'project-1' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project], tickets, [])
      );

      expect(result.current.globalStats.totalTickets).toBe(3);
    });

    it('should count overdue tickets correctly', () => {
      const project = createProject({ id: 'project-1' });
      const tickets = [
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-10') }), // 過去 - 期限超過
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-14') }), // 過去 - 期限超過
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-15') }), // 今日 - 期限超過ではない
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-20') }), // 未来 - 期限超過ではない
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project], tickets, [])
      );

      expect(result.current.globalStats.totalOverdue).toBe(2);
    });

    it('should count due soon tickets correctly (within 7 days)', () => {
      const project = createProject({ id: 'project-1' });
      const tickets = [
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-15') }), // 今日 - 期限間近
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-18') }), // 3日後 - 期限間近
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-22') }), // 7日後 - 期限間近
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-23') }), // 8日後 - 期限間近ではない
        createTicket({ projectId: 'project-1', endDate: new Date('2025-01-10') }), // 過去 - 期限間近ではない
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project], tickets, [])
      );

      expect(result.current.globalStats.totalDueSoon).toBe(3);
    });
  });

  describe('projectStats', () => {
    it('should calculate stats per project', () => {
      const project1 = createProject({ id: 'project-1', name: 'Project 1' });
      const project2 = createProject({ id: 'project-2', name: 'Project 2' });
      const tickets = [
        createTicket({ projectId: 'project-1' }),
        createTicket({ projectId: 'project-1' }),
        createTicket({ projectId: 'project-2' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project1, project2], tickets, [])
      );

      expect(result.current.projectStats.get('project-1')?.totalTickets).toBe(2);
      expect(result.current.projectStats.get('project-2')?.totalTickets).toBe(1);
    });

    it('should count parent tickets (parentId is null)', () => {
      const project = createProject({ id: 'project-1' });
      const tickets = [
        createTicket({ id: 'parent-1', projectId: 'project-1', parentId: null }),
        createTicket({ id: 'parent-2', projectId: 'project-1', parentId: null }),
        createTicket({ id: 'child-1', projectId: 'project-1', parentId: 'parent-1' }),
        createTicket({ id: 'child-2', projectId: 'project-1', parentId: 'parent-1' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project], tickets, [])
      );

      expect(result.current.projectStats.get('project-1')?.parentTickets).toBe(2);
    });

    it('should count unassigned tickets', () => {
      const project = createProject({ id: 'project-1' });
      const assignee = createAssignee({ id: 'assignee-1' });
      const tickets = [
        createTicket({ projectId: 'project-1', assigneeId: null }),
        createTicket({ projectId: 'project-1', assigneeId: null }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-1' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project], tickets, [assignee])
      );

      expect(result.current.projectStats.get('project-1')?.unassignedTickets).toBe(2);
    });

    it('should calculate days remaining for project', () => {
      const project = createProject({
        id: 'project-1',
        endDate: new Date('2025-01-25'), // 10日後
      });

      const { result } = renderHook(() =>
        useDashboardStats([project], [], [])
      );

      expect(result.current.projectStats.get('project-1')?.daysRemaining).toBe(10);
    });

    it('should return negative days remaining for overdue project', () => {
      const project = createProject({
        id: 'project-1',
        endDate: new Date('2025-01-10'), // 5日前
      });

      const { result } = renderHook(() =>
        useDashboardStats([project], [], [])
      );

      expect(result.current.projectStats.get('project-1')?.daysRemaining).toBe(-5);
    });

    it('should return null days remaining when endDate is null', () => {
      const project = createProject({
        id: 'project-1',
        endDate: null,
      });

      const { result } = renderHook(() =>
        useDashboardStats([project], [], [])
      );

      expect(result.current.projectStats.get('project-1')?.daysRemaining).toBeNull();
    });

    it('should calculate assignee breakdown per project', () => {
      const project = createProject({ id: 'project-1' });
      const assignee1 = createAssignee({ id: 'assignee-1', name: 'User A' });
      const assignee2 = createAssignee({ id: 'assignee-2', name: 'User B' });
      const tickets = [
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-1' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-1' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-1' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-2' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project], tickets, [assignee1, assignee2])
      );

      const breakdown = result.current.projectStats.get('project-1')?.assigneeBreakdown;
      expect(breakdown?.get('assignee-1')).toBe(3);
      expect(breakdown?.get('assignee-2')).toBe(1);
    });
  });

  describe('assigneeStats', () => {
    it('should aggregate ticket counts across all projects', () => {
      const project1 = createProject({ id: 'project-1' });
      const project2 = createProject({ id: 'project-2' });
      const assignee = createAssignee({ id: 'assignee-1', name: 'User A' });
      const tickets = [
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-1' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-1' }),
        createTicket({ projectId: 'project-2', assigneeId: 'assignee-1' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project1, project2], tickets, [assignee])
      );

      expect(result.current.assigneeStats).toHaveLength(1);
      expect(result.current.assigneeStats[0].ticketCount).toBe(3);
    });

    it('should sort assignees by ticket count in descending order', () => {
      const project = createProject({ id: 'project-1' });
      const assignee1 = createAssignee({ id: 'assignee-1', name: 'User A' });
      const assignee2 = createAssignee({ id: 'assignee-2', name: 'User B' });
      const assignee3 = createAssignee({ id: 'assignee-3', name: 'User C' });
      const tickets = [
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-1' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-2' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-2' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-2' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-3' }),
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-3' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project], tickets, [assignee1, assignee2, assignee3])
      );

      expect(result.current.assigneeStats[0].assigneeName).toBe('User B'); // 3 tickets
      expect(result.current.assigneeStats[1].assigneeName).toBe('User C'); // 2 tickets
      expect(result.current.assigneeStats[2].assigneeName).toBe('User A'); // 1 ticket
    });

    it('should exclude assignees with zero tickets', () => {
      const project = createProject({ id: 'project-1' });
      const assignee1 = createAssignee({ id: 'assignee-1', name: 'User A' });
      const assignee2 = createAssignee({ id: 'assignee-2', name: 'User B' });
      const tickets = [
        createTicket({ projectId: 'project-1', assigneeId: 'assignee-1' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats([project], tickets, [assignee1, assignee2])
      );

      expect(result.current.assigneeStats).toHaveLength(1);
      expect(result.current.assigneeStats[0].assigneeName).toBe('User A');
    });
  });

  describe('project status filtering', () => {
    it('should include all project statuses in stats', () => {
      const inProgressProject = createProject({ id: 'project-1', status: 'in_progress' });
      const planningProject = createProject({ id: 'project-2', status: 'planning' });
      const completedProject = createProject({ id: 'project-3', status: 'completed' });
      const tickets = [
        createTicket({ projectId: 'project-1' }),
        createTicket({ projectId: 'project-2' }),
        createTicket({ projectId: 'project-3' }),
      ];

      const { result } = renderHook(() =>
        useDashboardStats(
          [inProgressProject, planningProject, completedProject],
          tickets,
          []
        )
      );

      // 全プロジェクトの統計が含まれる
      expect(result.current.projectStats.size).toBe(3);
      expect(result.current.globalStats.totalTickets).toBe(3);
    });
  });

  describe('memoization', () => {
    it('should return same reference when inputs do not change', () => {
      const projects = [createProject({ id: 'project-1' })];
      const tickets = [createTicket({ projectId: 'project-1' })];
      const assignees = [createAssignee({ id: 'assignee-1' })];

      const { result, rerender } = renderHook(() =>
        useDashboardStats(projects, tickets, assignees)
      );

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('should return new reference when inputs change', () => {
      const projects = [createProject({ id: 'project-1' })];
      const tickets = [createTicket({ projectId: 'project-1' })];
      const assignees = [createAssignee({ id: 'assignee-1' })];

      const { result, rerender } = renderHook(
        ({ tickets }) => useDashboardStats(projects, tickets, assignees),
        { initialProps: { tickets } }
      );

      const firstResult = result.current;

      // 新しいチケット配列で再レンダリング
      const newTickets = [...tickets, createTicket({ projectId: 'project-1' })];
      rerender({ tickets: newTickets });

      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
      expect(secondResult.globalStats.totalTickets).toBe(2);
    });
  });
});
