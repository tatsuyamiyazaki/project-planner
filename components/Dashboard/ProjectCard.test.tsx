import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from './ProjectCard';
import { Project, Assignee } from '../../types';
import { ProjectStats } from '../../hooks/useDashboardStats';

describe('ProjectCard', () => {
  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'A test project description',
    manager: 'Test Manager',
    estimatedHours: 100,
    estimatedBudget: 1000000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    notes: 'Some notes',
    status: 'in_progress',
  };

  const mockAssignees: Assignee[] = [
    { id: 'assignee-1', name: 'Alice' },
    { id: 'assignee-2', name: 'Bob' },
    { id: 'assignee-3', name: 'Charlie' },
    { id: 'assignee-4', name: 'David' },
  ];

  const mockStats: ProjectStats = {
    projectId: 'project-1',
    totalTickets: 10,
    parentTickets: 3,
    overdueTickets: 2,
    dueSoonTickets: 4,
    unassignedTickets: 1,
    assigneeBreakdown: new Map([
      ['assignee-1', 5],
      ['assignee-2', 3],
      ['assignee-3', 2],
      ['assignee-4', 1],
    ]),
    daysRemaining: 75,
  };

  const defaultProps = {
    project: mockProject,
    stats: mockStats,
    assignees: mockAssignees,
    onClick: vi.fn(),
  };

  it('should render project name', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should render project status badge', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('進行中')).toBeInTheDocument();
  });

  it('should render date range', () => {
    render(<ProjectCard {...defaultProps} />);

    // 日付フォーマットを確認
    expect(screen.getByText(/2025年1月1日/)).toBeInTheDocument();
    expect(screen.getByText(/2025年3月31日/)).toBeInTheDocument();
  });

  it('should render days remaining badge', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('残75日')).toBeInTheDocument();
  });

  it('should render overdue days when daysRemaining is negative', () => {
    const overdueStats = { ...mockStats, daysRemaining: -5 };
    render(<ProjectCard {...defaultProps} stats={overdueStats} />);

    expect(screen.getByText('5日超過')).toBeInTheDocument();
  });

  it('should render ticket statistics', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('総数: 10')).toBeInTheDocument();
    expect(screen.getByText('親チケット: 3')).toBeInTheDocument();
  });

  it('should render unassigned ticket count when > 0', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('未割当: 1')).toBeInTheDocument();
  });

  it('should not render unassigned count when 0', () => {
    const noUnassignedStats = { ...mockStats, unassignedTickets: 0 };
    render(<ProjectCard {...defaultProps} stats={noUnassignedStats} />);

    expect(screen.queryByText(/未割当/)).not.toBeInTheDocument();
  });

  it('should render overdue and due soon warnings', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('期限超過: 2')).toBeInTheDocument();
    expect(screen.getByText('期限間近: 4')).toBeInTheDocument();
  });

  it('should render warning icon when has overdue tickets', () => {
    render(<ProjectCard {...defaultProps} />);

    // ヘッダー部分に警告アイコンが表示される
    const warningIcons = document.querySelectorAll('.text-red-500');
    expect(warningIcons.length).toBeGreaterThan(0);
  });

  it('should not render warnings when no overdue or due soon tickets', () => {
    const noWarningStats = {
      ...mockStats,
      overdueTickets: 0,
      dueSoonTickets: 0,
    };
    render(<ProjectCard {...defaultProps} stats={noWarningStats} />);

    expect(screen.queryByText(/期限超過/)).not.toBeInTheDocument();
    expect(screen.queryByText(/期限間近/)).not.toBeInTheDocument();
  });

  it('should render top 3 assignees with ticket counts', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('Alice: 5')).toBeInTheDocument();
    expect(screen.getByText('Bob: 3')).toBeInTheDocument();
    expect(screen.getByText('Charlie: 2')).toBeInTheDocument();
  });

  it('should show remaining assignee count', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('他1名')).toBeInTheDocument();
  });

  it('should render timeline link', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('タイムラインを見る')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<ProjectCard {...defaultProps} onClick={onClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Enter key is pressed', () => {
    const onClick = vi.fn();
    render(<ProjectCard {...defaultProps} onClick={onClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have proper aria-label for accessibility', () => {
    render(<ProjectCard {...defaultProps} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'Test Projectのタイムラインを開く');
  });

  it('should be focusable', () => {
    render(<ProjectCard {...defaultProps} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should show skeleton when loading', () => {
    render(<ProjectCard {...defaultProps} isLoading />);

    // ローディング中はプロジェクト名が表示されない
    expect(screen.queryByText('Test Project')).not.toBeInTheDocument();

    // スケルトンが表示される
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should handle null endDate gracefully', () => {
    const projectWithoutEndDate = { ...mockProject, endDate: null };
    const statsWithNullRemaining = { ...mockStats, daysRemaining: null };

    render(
      <ProjectCard
        {...defaultProps}
        project={projectWithoutEndDate}
        stats={statsWithNullRemaining}
      />
    );

    // 残日数バッジが表示されない
    expect(screen.queryByText(/残\d+日/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+日超過/)).not.toBeInTheDocument();
  });

  it('should handle missing stats gracefully', () => {
    render(<ProjectCard {...defaultProps} stats={undefined} />);

    expect(screen.getByText('総数: 0')).toBeInTheDocument();
    expect(screen.getByText('親チケット: 0')).toBeInTheDocument();
  });
});
