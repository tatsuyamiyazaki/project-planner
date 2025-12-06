import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AssigneeWorkloadSection from './AssigneeWorkloadSection';
import { AssigneeStats } from '../../hooks/useDashboardStats';

describe('AssigneeWorkloadSection', () => {
  const mockAssigneeStats: AssigneeStats[] = [
    { assigneeId: '1', assigneeName: 'Alice', ticketCount: 5 },
    { assigneeId: '2', assigneeName: 'Bob', ticketCount: 3 },
    { assigneeId: '3', assigneeName: 'Charlie', ticketCount: 2 },
  ];

  it('should render section title', () => {
    render(<AssigneeWorkloadSection assigneeStats={mockAssigneeStats} />);

    expect(screen.getByText('担当者稼働状況')).toBeInTheDocument();
  });

  it('should render all assignees with ticket counts', () => {
    render(<AssigneeWorkloadSection assigneeStats={mockAssigneeStats} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    expect(screen.getByText('5 チケット')).toBeInTheDocument();
    expect(screen.getByText('3 チケット')).toBeInTheDocument();
    expect(screen.getByText('2 チケット')).toBeInTheDocument();
  });

  it('should show empty state when no assignees', () => {
    render(<AssigneeWorkloadSection assigneeStats={[]} />);

    expect(
      screen.getByText('進行中プロジェクトに担当者が割り当てられたチケットがありません')
    ).toBeInTheDocument();
    expect(
      screen.getByText('チケットに担当者を割り当てると、ここに稼働状況が表示されます')
    ).toBeInTheDocument();
  });

  it('should show skeleton when loading', () => {
    render(<AssigneeWorkloadSection assigneeStats={[]} isLoading />);

    // ローディング中は空状態のメッセージが表示されない
    expect(
      screen.queryByText('進行中プロジェクトに担当者が割り当てられたチケットがありません')
    ).not.toBeInTheDocument();

    // スケルトンが表示される
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have proper list role for accessibility', () => {
    render(<AssigneeWorkloadSection assigneeStats={mockAssigneeStats} />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('aria-label', '担当者別チケット数');
  });

  it('should render list items with proper role', () => {
    render(<AssigneeWorkloadSection assigneeStats={mockAssigneeStats} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('should include aria-label on ticket count badges', () => {
    render(<AssigneeWorkloadSection assigneeStats={mockAssigneeStats} />);

    const badge = screen.getByText('5 チケット');
    expect(badge).toHaveAttribute('aria-label', '5件のチケット');
  });
});
