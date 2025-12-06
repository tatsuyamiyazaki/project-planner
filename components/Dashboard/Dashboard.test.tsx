import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from './index';
import { Project, Assignee } from '../../types';
import { DashboardStats, ProjectStats, AssigneeStats } from '../../hooks/useDashboardStats';

describe('Dashboard', () => {
  const createMockProject = (overrides: Partial<Project> = {}): Project => ({
    id: crypto.randomUUID(),
    name: 'Test Project',
    description: 'Description',
    manager: 'Manager',
    estimatedHours: 100,
    estimatedBudget: 1000000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    notes: '',
    status: 'in_progress',
    ...overrides,
  });

  const createMockProjectStats = (
    projectId: string,
    overrides: Partial<ProjectStats> = {}
  ): ProjectStats => ({
    projectId,
    totalTickets: 10,
    parentTickets: 3,
    overdueTickets: 0,
    dueSoonTickets: 2,
    unassignedTickets: 1,
    assigneeBreakdown: new Map(),
    daysRemaining: 30,
    ...overrides,
  });

  const mockAssignees: Assignee[] = [
    { id: 'assignee-1', name: 'Alice' },
    { id: 'assignee-2', name: 'Bob' },
  ];

  const createMockDashboardStats = (
    projects: Project[],
    overrides: Partial<DashboardStats> = {}
  ): DashboardStats => {
    const projectStats = new Map<string, ProjectStats>();
    projects.forEach((p) => {
      projectStats.set(p.id, createMockProjectStats(p.id));
    });

    return {
      projectStats,
      globalStats: {
        totalTickets: projects.length * 10,
        totalOverdue: 2,
        totalDueSoon: 5,
      },
      assigneeStats: [
        { assigneeId: 'assignee-1', assigneeName: 'Alice', ticketCount: 8 },
        { assigneeId: 'assignee-2', assigneeName: 'Bob', ticketCount: 5 },
      ],
      ...overrides,
    };
  };

  it('should render dashboard title', () => {
    const projects = [createMockProject({ id: 'p1' })];
    const stats = createMockDashboardStats(projects);

    render(
      <Dashboard
        projects={projects}
        assignees={mockAssignees}
        dashboardStats={stats}
        onProjectSelect={vi.fn()}
      />
    );

    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
  });

  describe('statistics cards', () => {
    it('should render project count statistics', () => {
      const projects = [
        createMockProject({ id: 'p1', status: 'in_progress' }),
        createMockProject({ id: 'p2', status: 'completed' }),
        createMockProject({ id: 'p3', status: 'planning' }),
      ];
      const stats = createMockDashboardStats(projects);

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
        />
      );

      expect(screen.getByText('プロジェクト総数')).toBeInTheDocument();

      // 統計カードの値を aria-label で確認
      expect(screen.getByRole('article', { name: 'プロジェクト総数: 3' })).toBeInTheDocument();
      expect(screen.getByRole('article', { name: '進行中: 1' })).toBeInTheDocument();
      expect(screen.getByRole('article', { name: '完了: 1' })).toBeInTheDocument();
      expect(screen.getByRole('article', { name: '計画中: 1' })).toBeInTheDocument();
    });

    it('should render ticket statistics', () => {
      const projects = [createMockProject({ id: 'p1' })];
      const stats = createMockDashboardStats(projects, {
        globalStats: {
          totalTickets: 25,
          totalOverdue: 3,
          totalDueSoon: 7,
        },
      });

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
        />
      );

      expect(screen.getByText('総チケット数')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();

      expect(screen.getByText('期限超過')).toBeInTheDocument();
      expect(screen.getByText('期限間近')).toBeInTheDocument();
    });
  });

  describe('assignee workload section', () => {
    it('should render assignee workload section', () => {
      const projects = [createMockProject({ id: 'p1' })];
      const stats = createMockDashboardStats(projects);

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
        />
      );

      expect(screen.getByText('担当者稼働状況')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('in-progress projects section', () => {
    it('should render in-progress projects', () => {
      const projects = [
        createMockProject({ id: 'p1', name: 'Active Project 1', status: 'in_progress' }),
        createMockProject({ id: 'p2', name: 'Active Project 2', status: 'in_progress' }),
      ];
      const stats = createMockDashboardStats(projects);

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
        />
      );

      expect(screen.getByText('進行中のプロジェクト')).toBeInTheDocument();
      expect(screen.getByText('Active Project 1')).toBeInTheDocument();
      expect(screen.getByText('Active Project 2')).toBeInTheDocument();
    });

    it('should filter to show only in-progress projects', () => {
      const projects = [
        createMockProject({ id: 'p1', name: 'Active', status: 'in_progress' }),
        createMockProject({ id: 'p2', name: 'Completed', status: 'completed' }),
        createMockProject({ id: 'p3', name: 'Planning', status: 'planning' }),
      ];
      const stats = createMockDashboardStats(projects);

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
        />
      );

      // 進行中プロジェクトのみカードとして表示
      expect(screen.getByText('Active')).toBeInTheDocument();
      // 完了・計画中は進行中プロジェクトセクションには表示されない
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
      expect(screen.queryByText('Planning')).not.toBeInTheDocument();
    });

    it('should show empty state when no in-progress projects', () => {
      const projects = [
        createMockProject({ id: 'p1', status: 'completed' }),
        createMockProject({ id: 'p2', status: 'planning' }),
      ];
      const stats = createMockDashboardStats(projects);

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
        />
      );

      expect(screen.getByText('進行中のプロジェクトはありません')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onProjectSelect when project card is clicked', () => {
      const onProjectSelect = vi.fn();
      const projects = [
        createMockProject({ id: 'project-123', name: 'Clickable Project', status: 'in_progress' }),
      ];
      const stats = createMockDashboardStats(projects);

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={onProjectSelect}
        />
      );

      const projectCard = screen.getByText('Clickable Project').closest('[role="button"]');
      fireEvent.click(projectCard!);

      expect(onProjectSelect).toHaveBeenCalledWith('project-123');
    });
  });

  describe('loading state', () => {
    it('should show skeletons when loading', () => {
      const projects = [createMockProject({ id: 'p1' })];
      const stats = createMockDashboardStats(projects);

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
          isLoading
        />
      );

      // スケルトンが表示される
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should have proper region labels', () => {
      const projects = [createMockProject({ id: 'p1', status: 'in_progress' })];
      const stats = createMockDashboardStats(projects);

      render(
        <Dashboard
          projects={projects}
          assignees={mockAssignees}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
        />
      );

      expect(screen.getByRole('region', { name: 'プロジェクト統計' })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: '進行中のプロジェクト一覧' })).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render correctly with no projects', () => {
      const stats: DashboardStats = {
        projectStats: new Map(),
        globalStats: {
          totalTickets: 0,
          totalOverdue: 0,
          totalDueSoon: 0,
        },
        assigneeStats: [],
      };

      render(
        <Dashboard
          projects={[]}
          assignees={[]}
          dashboardStats={stats}
          onProjectSelect={vi.fn()}
        />
      );

      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
      // 統計カードの aria-label で確認（0が複数箇所に表示されるため）
      expect(screen.getByRole('article', { name: 'プロジェクト総数: 0' })).toBeInTheDocument();
      expect(screen.getByText('進行中のプロジェクトはありません')).toBeInTheDocument();
    });
  });
});
