/**
 * ダッシュボード関連の設定定数
 */

/** 期限間近と判定する日数閾値 */
export const DUE_SOON_THRESHOLD_DAYS = 7;

/** プロジェクトカードに表示する担当者の最大数 */
export const MAX_DISPLAYED_ASSIGNEES = 3;

/** 統計カードの設定 */
export const STAT_CARD_CONFIG = {
  /** プロジェクトステータス別の色設定 */
  statusColors: {
    in_progress: {
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900',
      border: 'border-blue-200 dark:border-blue-700',
    },
    completed: {
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900',
      border: 'border-green-200 dark:border-green-700',
    },
    planning: {
      text: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      border: 'border-yellow-200 dark:border-yellow-700',
    },
  },
  /** 警告レベル別の色設定 */
  alertColors: {
    overdue: {
      text: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900',
      border: 'border-red-200 dark:border-red-700',
    },
    dueSoon: {
      text: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      border: 'border-yellow-200 dark:border-yellow-700',
    },
  },
} as const;

/** ツールチップテキスト */
export const TOOLTIP_TEXTS = {
  totalProjects: '登録されているすべてのプロジェクトの総数',
  inProgress: '現在進行中のプロジェクト数',
  completed: '完了したプロジェクト数',
  planning: '計画段階のプロジェクト数',
  totalTickets: '進行中プロジェクトの総チケット数',
  overdueTickets: '期限を超過したチケット数。早急な対応が必要です',
  dueSoonTickets: `${DUE_SOON_THRESHOLD_DAYS}日以内に期限を迎えるチケット数`,
  assigneeWorkload: '各担当者が担当しているチケット数',
  daysRemaining: 'プロジェクト終了日までの残り日数',
  parentTickets: 'サブタスクを持つ親チケットの数',
  unassignedTickets: '担当者が未割り当てのチケット数',
} as const;
