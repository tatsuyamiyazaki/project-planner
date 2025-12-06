import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('should render title and value', () => {
    render(<StatCard title="Test Title" value={42} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should format large numbers with locale', () => {
    render(<StatCard title="Large Number" value={1234567} />);

    // 日本語ロケールでカンマ区切り
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should apply custom value color class', () => {
    render(
      <StatCard
        title="Colored Value"
        value={10}
        valueColorClass="text-red-500"
      />
    );

    const valueElement = screen.getByText('10');
    expect(valueElement).toHaveClass('text-red-500');
  });

  it('should apply custom border color class', () => {
    render(
      <StatCard
        title="Custom Border"
        value={5}
        borderColorClass="border-blue-500"
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveClass('border-blue-500');
  });

  it('should render icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;

    render(<StatCard title="With Icon" value={15} icon={<TestIcon />} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should display tooltip when provided', () => {
    render(<StatCard title="With Tooltip" value={20} tooltip="This is a tooltip" />);

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('title', 'This is a tooltip');
  });

  it('should show skeleton when loading', () => {
    render(<StatCard title="Loading" value={0} isLoading />);

    // ローディング中は値が表示されない
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    // スケルトンのアニメーションクラスが存在
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('should have proper aria-label for accessibility', () => {
    render(<StatCard title="Accessible Card" value={30} />);

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', 'Accessible Card: 30');
  });

  it('should apply icon color class when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;

    render(
      <StatCard
        title="Colored Icon"
        value={25}
        icon={<TestIcon />}
        iconColorClass="text-green-500"
      />
    );

    // iconColorClass is applied to the parent div containing the icon
    const titleContainer = screen.getByText('Colored Icon').parentElement;
    expect(titleContainer).toHaveClass('text-green-500');
  });
});
