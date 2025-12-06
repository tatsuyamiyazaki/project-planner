import { useMemo } from 'react';
import { Project, Ticket, Assignee } from '../types';
import { diffInDays, getToday } from '../utils/date';
import { DUE_SOON_THRESHOLD_DAYS } from '../constants/dashboard';

/**
 * プロジェクト別の統計情報
 */
export interface ProjectStats {
  /** プロジェクトID */
  projectId: string;
  /** 総チケット数 */
  totalTickets: number;
  /** 親チケット数（サブタスクを持つチケット） */
  parentTickets: number;
  /** 期限超過チケット数 */
  overdueTickets: number;
  /** 期限間近チケット数（閾値日数以内） */
  dueSoonTickets: number;
  /** 未割り当てチケット数 */
  unassignedTickets: number;
  /** 担当者別チケット数のマップ（担当者ID → チケット数） */
  assigneeBreakdown: Map<string, number>;
  /** プロジェクト終了日までの残日数（null = 終了日未設定） */
  daysRemaining: number | null;
}

/**
 * 全体統計情報
 */
export interface GlobalStats {
  /** 全プロジェクトの総チケット数 */
  totalTickets: number;
  /** 期限超過チケットの総数 */
  totalOverdue: number;
  /** 期限間近チケットの総数 */
  totalDueSoon: number;
}

/**
 * 担当者別統計情報
 */
export interface AssigneeStats {
  /** 担当者ID */
  assigneeId: string;
  /** 担当者名 */
  assigneeName: string;
  /** 担当チケット数 */
  ticketCount: number;
}

/**
 * ダッシュボード用の集計データ
 */
export interface DashboardStats {
  /** プロジェクト別統計のマップ */
  projectStats: Map<string, ProjectStats>;
  /** 全体統計 */
  globalStats: GlobalStats;
  /** 担当者別統計（チケット数の降順） */
  assigneeStats: AssigneeStats[];
}

/**
 * チケットが期限超過かどうかを判定
 * @param ticketEndDate チケットの終了日
 * @param today 今日の日付
 * @returns 期限超過の場合true
 */
const isOverdue = (ticketEndDate: Date, today: Date): boolean => {
  const endDate = new Date(ticketEndDate);
  endDate.setHours(0, 0, 0, 0);
  return diffInDays(today, endDate) > 0;
};

/**
 * チケットが期限間近かどうかを判定
 * @param ticketEndDate チケットの終了日
 * @param today 今日の日付
 * @param thresholdDays 閾値日数
 * @returns 期限間近（thresholdDays日以内）の場合true
 */
const isDueSoon = (ticketEndDate: Date, today: Date, thresholdDays: number): boolean => {
  const endDate = new Date(ticketEndDate);
  endDate.setHours(0, 0, 0, 0);
  const daysUntilDue = diffInDays(endDate, today);
  return daysUntilDue >= 0 && daysUntilDue <= thresholdDays;
};

/**
 * プロジェクトの残日数を計算
 * @param projectEndDate プロジェクトの終了日
 * @param today 今日の日付
 * @returns 残日数（終了日未設定の場合はnull）
 */
const calculateDaysRemaining = (projectEndDate: Date | null, today: Date): number | null => {
  if (!projectEndDate) return null;
  const endDate = new Date(projectEndDate);
  endDate.setHours(0, 0, 0, 0);
  return diffInDays(endDate, today);
};

/**
 * ダッシュボード用の集計データを算出するカスタムフック
 *
 * 全プロジェクトを対象に以下の統計を計算：
 * - プロジェクト別のチケット統計（総数、期限超過、期限間近、未割り当て等）
 * - 全体の集計値（総チケット数、期限超過/期限間近の合計）
 * - 担当者別のチケット数分布
 *
 * @param projects プロジェクトリスト
 * @param tickets チケットリスト
 * @param assignees 担当者リスト
 * @returns メモ化されたダッシュボード統計データ
 *
 * @example
 * ```tsx
 * const dashboardStats = useDashboardStats(projects, tickets, assignees);
 * console.log(dashboardStats.globalStats.totalTickets);
 * ```
 */
export function useDashboardStats(
  projects: Project[],
  tickets: Ticket[],
  assignees: Assignee[]
): DashboardStats {
  return useMemo(() => {
    const today = getToday();

    // プロジェクトごとの統計を計算
    const projectStats = new Map<string, ProjectStats>();

    // 全体統計の初期化（全プロジェクト対象）
    let totalTickets = 0;
    let totalOverdue = 0;
    let totalDueSoon = 0;

    // 担当者ごとのチケット数を集計（全プロジェクト対象）
    const globalAssigneeTicketCount = new Map<string, number>();

    // 全プロジェクトを対象に集計
    for (const project of projects) {
      const projectTickets = tickets.filter((t) => t.projectId === project.id);

      // 親チケット数（parentIdがnull）
      const parentTickets = projectTickets.filter((t) => t.parentId === null).length;

      // 未割り当てチケット数
      const unassignedTickets = projectTickets.filter((t) => t.assigneeId === null).length;

      // 期限超過チケット数
      const overdueTickets = projectTickets.filter((t) => isOverdue(t.endDate, today)).length;

      // 期限間近チケット数（定数で定義された日数以内）
      const dueSoonTickets = projectTickets.filter((t) =>
        isDueSoon(t.endDate, today, DUE_SOON_THRESHOLD_DAYS)
      ).length;

      // 残日数の計算
      const daysRemaining = calculateDaysRemaining(project.endDate, today);

      // 担当者別チケット数
      const assigneeBreakdown = new Map<string, number>();
      for (const ticket of projectTickets) {
        if (ticket.assigneeId) {
          const count = assigneeBreakdown.get(ticket.assigneeId) || 0;
          assigneeBreakdown.set(ticket.assigneeId, count + 1);

          // グローバル集計にも追加
          const globalCount = globalAssigneeTicketCount.get(ticket.assigneeId) || 0;
          globalAssigneeTicketCount.set(ticket.assigneeId, globalCount + 1);
        }
      }

      projectStats.set(project.id, {
        projectId: project.id,
        totalTickets: projectTickets.length,
        parentTickets,
        overdueTickets,
        dueSoonTickets,
        unassignedTickets,
        assigneeBreakdown,
        daysRemaining,
      });

      // 全体統計に加算
      totalTickets += projectTickets.length;
      totalOverdue += overdueTickets;
      totalDueSoon += dueSoonTickets;
    }

    // 担当者統計を構築
    const assigneeStats: AssigneeStats[] = [];
    for (const assignee of assignees) {
      const ticketCount = globalAssigneeTicketCount.get(assignee.id) || 0;
      if (ticketCount > 0) {
        assigneeStats.push({
          assigneeId: assignee.id,
          assigneeName: assignee.name,
          ticketCount,
        });
      }
    }

    // チケット数の降順でソート
    assigneeStats.sort((a, b) => b.ticketCount - a.ticketCount);

    return {
      projectStats,
      globalStats: {
        totalTickets,
        totalOverdue,
        totalDueSoon,
      },
      assigneeStats,
    };
  }, [projects, tickets, assignees]);
}
