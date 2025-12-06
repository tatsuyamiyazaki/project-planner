import React from 'react';
import { Project, Assignee } from '../../types';
import { ProjectStats } from '../../hooks/useDashboardStats';
import { FolderIcon, ExclamationTriangleIcon, ClockIcon, TicketIcon, ArrowRightIcon } from '../Icons';
import { MAX_DISPLAYED_ASSIGNEES, TOOLTIP_TEXTS } from '../../constants/dashboard';

interface ProjectCardProps {
  /** プロジェクト情報 */
  project: Project;
  /** プロジェクトの統計情報 */
  stats?: ProjectStats;
  /** 担当者リスト */
  assignees: Assignee[];
  /** カードクリック時のハンドラ */
  onClick: () => void;
  /** ローディング状態 */
  isLoading?: boolean;
}

/**
 * 日付をフォーマットする
 */
const formatDate = (date: Date | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * 残日数のバッジスタイルを取得
 */
const getDaysRemainingStyle = (days: number): string => {
  if (days < 0) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  if (days <= 7) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

/**
 * プロジェクトカードのスケルトン表示
 */
const ProjectCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

/**
 * 進行中プロジェクトの詳細情報を表示するカードコンポーネント
 */
const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats,
  assignees,
  onClick,
  isLoading = false,
}) => {
  if (isLoading) {
    return <ProjectCardSkeleton />;
  }

  // 担当者リストを構築
  const assigneeList = stats
    ? Array.from(stats.assigneeBreakdown.entries())
        .map(([id, count]) => {
          const assignee = assignees.find((a) => a.id === id);
          return { name: assignee?.name || '不明', count };
        })
        .sort((a, b) => b.count - a.count)
    : [];
  const displayAssignees = assigneeList.slice(0, MAX_DISPLAYED_ASSIGNEES);
  const remainingCount = assigneeList.length - MAX_DISPLAYED_ASSIGNEES;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
      role="button"
      tabIndex={0}
      aria-label={`${project.name}のタイムラインを開く`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-6 h-6 text-blue-500" aria-hidden="true" />
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
            進行中
          </span>
        </div>
        {stats && stats.overdueTickets > 0 && (
          <div
            className="flex items-center gap-1 text-red-500"
            title={TOOLTIP_TEXTS.overdueTickets}
            aria-label={`期限超過チケット: ${stats.overdueTickets}件`}
          >
            <ExclamationTriangleIcon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* プロジェクト名 */}
      <h4
        className="font-semibold text-gray-900 dark:text-white mb-3 truncate"
        title={project.name}
      >
        {project.name}
      </h4>

      {/* 期間情報 */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2 flex-wrap">
        <span>
          {formatDate(project.startDate)} - {formatDate(project.endDate)}
        </span>
        {stats && stats.daysRemaining !== null && (
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${getDaysRemainingStyle(stats.daysRemaining)}`}
            title={TOOLTIP_TEXTS.daysRemaining}
          >
            {stats.daysRemaining < 0
              ? `${Math.abs(stats.daysRemaining)}日超過`
              : `残${stats.daysRemaining}日`}
          </span>
        )}
      </div>

      {/* チケット統計 */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div
          className="flex items-center gap-1 text-gray-600 dark:text-gray-300"
          title={TOOLTIP_TEXTS.totalTickets}
        >
          <TicketIcon className="w-4 h-4" aria-hidden="true" />
          <span>総数: {stats?.totalTickets || 0}</span>
        </div>
        <div
          className="text-gray-600 dark:text-gray-300"
          title={TOOLTIP_TEXTS.parentTickets}
        >
          親チケット: {stats?.parentTickets || 0}
        </div>
        {stats && stats.unassignedTickets > 0 && (
          <div
            className="text-yellow-600 dark:text-yellow-400"
            title={TOOLTIP_TEXTS.unassignedTickets}
          >
            未割当: {stats.unassignedTickets}
          </div>
        )}
      </div>

      {/* 期限警告 */}
      {stats && (stats.overdueTickets > 0 || stats.dueSoonTickets > 0) && (
        <div className="flex gap-2 mb-3 flex-wrap" role="alert">
          {stats.overdueTickets > 0 && (
            <span
              className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded flex items-center gap-1"
              title={TOOLTIP_TEXTS.overdueTickets}
            >
              <ExclamationTriangleIcon className="w-3 h-3" aria-hidden="true" />
              期限超過: {stats.overdueTickets}
            </span>
          )}
          {stats.dueSoonTickets > 0 && (
            <span
              className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded flex items-center gap-1"
              title={TOOLTIP_TEXTS.dueSoonTickets}
            >
              <ClockIcon className="w-3 h-3" aria-hidden="true" />
              期限間近: {stats.dueSoonTickets}
            </span>
          )}
        </div>
      )}

      {/* 担当者別チケット数 */}
      {displayAssignees.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex flex-wrap gap-1">
            {displayAssignees.map((a) => (
              <span
                key={a.name}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
              >
                {a.name}: {a.count}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                他{remainingCount}名
              </span>
            )}
          </div>
        </div>
      )}

      {/* タイムラインへのリンク */}
      <div className="flex items-center justify-end text-blue-500 dark:text-blue-400 text-sm">
        <span className="mr-1">タイムラインを見る</span>
        <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
      </div>
    </div>
  );
};

export default ProjectCard;
