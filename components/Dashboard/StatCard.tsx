import React from 'react';

interface StatCardProps {
  /** カードのタイトル */
  title: string;
  /** 表示する値 */
  value: number;
  /** 値のテキスト色クラス */
  valueColorClass?: string;
  /** ボーダー色クラス */
  borderColorClass?: string;
  /** アイコンコンポーネント */
  icon?: React.ReactNode;
  /** アイコンの色クラス */
  iconColorClass?: string;
  /** ツールチップテキスト */
  tooltip?: string;
  /** ローディング状態 */
  isLoading?: boolean;
}

/**
 * 統計情報を表示するカードコンポーネント
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  valueColorClass = 'text-gray-900 dark:text-white',
  borderColorClass = 'border-gray-200 dark:border-gray-700',
  icon,
  iconColorClass,
  tooltip,
  isLoading = false,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${borderColorClass} p-4 transition-colors`}
      title={tooltip}
      role="article"
      aria-label={`${title}: ${value}`}
    >
      <div className={`flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 ${iconColorClass || ''}`}>
        {icon}
        <span>{title}</span>
      </div>
      {isLoading ? (
        <div className="mt-1 h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : (
        <div className={`text-3xl font-bold mt-1 ${valueColorClass}`} aria-live="polite">
          {value.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default StatCard;
