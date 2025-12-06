import React from 'react';
import { Project, Assignee } from '../../types';
import { DashboardStats } from '../../hooks/useDashboardStats';
import StatCard from './StatCard';
import ProjectCard from './ProjectCard';
import AssigneeWorkloadSection from './AssigneeWorkloadSection';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  TicketIcon,
  FolderIcon,
} from '../Icons';
import { TOOLTIP_TEXTS } from '../../constants/dashboard';

interface DashboardProps {
  /** プロジェクトリスト */
  projects: Project[];
  /** 担当者リスト */
  assignees: Assignee[];
  /** ダッシュボード統計データ */
  dashboardStats: DashboardStats;
  /** プロジェクト選択時のハンドラ */
  onProjectSelect: (projectId: string) => void;
  /** ローディング状態 */
  isLoading?: boolean;
}

/**
 * 統計カードセクションのスケルトン
 */
const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div
        key={i}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
      >
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    ))}
  </div>
);

/**
 * プロジェクトがない場合の空状態表示
 */
const EmptyProjectsState: React.FC = () => (
  <div className="text-center py-12">
    <FolderIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
      進行中のプロジェクトはありません
    </p>
    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
      プロジェクトを作成し、ステータスを「進行中」に設定するとここに表示されます
    </p>
  </div>
);

/**
 * ダッシュボードのメインコンポーネント
 * プロジェクト統計、担当者稼働状況、進行中プロジェクト一覧を表示
 */
const Dashboard: React.FC<DashboardProps> = ({
  projects,
  assignees,
  dashboardStats,
  onProjectSelect,
  isLoading = false,
}) => {
  const inProgressProjects = projects.filter((p) => p.status === 'in_progress');

  return (
    <div className="flex-grow p-4 overflow-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        ダッシュボード
      </h2>

      {/* プロジェクト統計 */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8"
          role="region"
          aria-label="プロジェクト統計"
        >
          <StatCard
            title="プロジェクト総数"
            value={projects.length}
            tooltip={TOOLTIP_TEXTS.totalProjects}
          />
          <StatCard
            title="進行中"
            value={projects.filter((p) => p.status === 'in_progress').length}
            valueColorClass="text-blue-600 dark:text-blue-400"
            tooltip={TOOLTIP_TEXTS.inProgress}
          />
          <StatCard
            title="完了"
            value={projects.filter((p) => p.status === 'completed').length}
            valueColorClass="text-green-600 dark:text-green-400"
            tooltip={TOOLTIP_TEXTS.completed}
          />
          <StatCard
            title="計画中"
            value={projects.filter((p) => p.status === 'planning').length}
            valueColorClass="text-yellow-600 dark:text-yellow-400"
            tooltip={TOOLTIP_TEXTS.planning}
          />
          <StatCard
            title="総チケット数"
            value={dashboardStats.globalStats.totalTickets}
            icon={<TicketIcon className="w-4 h-4" aria-hidden="true" />}
            tooltip={TOOLTIP_TEXTS.totalTickets}
          />
          <StatCard
            title="期限超過"
            value={dashboardStats.globalStats.totalOverdue}
            valueColorClass="text-red-600 dark:text-red-400"
            borderColorClass="border-red-200 dark:border-red-700"
            icon={<ExclamationTriangleIcon className="w-4 h-4" aria-hidden="true" />}
            iconColorClass="text-red-500 dark:text-red-400"
            tooltip={TOOLTIP_TEXTS.overdueTickets}
          />
          <StatCard
            title="期限間近"
            value={dashboardStats.globalStats.totalDueSoon}
            valueColorClass="text-yellow-600 dark:text-yellow-400"
            borderColorClass="border-yellow-200 dark:border-yellow-700"
            icon={<ClockIcon className="w-4 h-4" aria-hidden="true" />}
            iconColorClass="text-yellow-600 dark:text-yellow-400"
            tooltip={TOOLTIP_TEXTS.dueSoonTickets}
          />
        </div>
      )}

      {/* 担当者稼働状況 */}
      <AssigneeWorkloadSection
        assigneeStats={dashboardStats.assigneeStats}
        isLoading={isLoading}
      />

      {/* 進行中のプロジェクト一覧 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          進行中のプロジェクト
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <ProjectCard
                key={i}
                project={{} as Project}
                assignees={[]}
                onClick={() => {}}
                isLoading
              />
            ))}
          </div>
        ) : inProgressProjects.length === 0 ? (
          <EmptyProjectsState />
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="進行中のプロジェクト一覧"
          >
            {inProgressProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                stats={dashboardStats.projectStats.get(project.id)}
                assignees={assignees}
                onClick={() => onProjectSelect(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
