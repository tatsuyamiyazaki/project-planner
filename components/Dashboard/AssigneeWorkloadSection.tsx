import React from 'react';
import { AssigneeStats } from '../../hooks/useDashboardStats';
import { UserIcon } from '../Icons';
import { TOOLTIP_TEXTS } from '../../constants/dashboard';

interface AssigneeWorkloadSectionProps {
  /** 担当者統計リスト */
  assigneeStats: AssigneeStats[];
  /** ローディング状態 */
  isLoading?: boolean;
}

/**
 * スケルトンローダー
 */
const AssigneeWorkloadSkeleton: React.FC = () => (
  <div className="mb-8">
    <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse"
          >
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-600 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * 担当者がいない場合の空状態表示
 */
const EmptyState: React.FC = () => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <UserIcon className="w-5 h-5" aria-hidden="true" />
      担当者稼働状況
    </h3>
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
        <p className="text-sm">進行中プロジェクトに担当者が割り当てられたチケットがありません</p>
        <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
          チケットに担当者を割り当てると、ここに稼働状況が表示されます
        </p>
      </div>
    </div>
  </div>
);

/**
 * 担当者の稼働状況を表示するセクションコンポーネント
 */
const AssigneeWorkloadSection: React.FC<AssigneeWorkloadSectionProps> = ({
  assigneeStats,
  isLoading = false,
}) => {
  if (isLoading) {
    return <AssigneeWorkloadSkeleton />;
  }

  if (assigneeStats.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="mb-8">
      <h3
        className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
        title={TOOLTIP_TEXTS.assigneeWorkload}
      >
        <UserIcon className="w-5 h-5" aria-hidden="true" />
        担当者稼働状況
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4" role="list" aria-label="担当者別チケット数">
          {assigneeStats.map((stat) => (
            <div
              key={stat.assigneeId}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
              role="listitem"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stat.assigneeName}
              </span>
              <span
                className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                aria-label={`${stat.ticketCount}件のチケット`}
              >
                {stat.ticketCount} チケット
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssigneeWorkloadSection;
