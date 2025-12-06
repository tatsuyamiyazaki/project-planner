/**
 * 日付計算の共通ユーティリティ
 * タイムゾーン依存を排除するため、時刻を00:00:00に正規化して計算
 */

/**
 * 日付に日数を加算
 * @param date 基準日
 * @param days 加算日数（負の値で減算）
 * @returns 新しいDateオブジェクト
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * 2つの日付間の日数差を計算
 * @param date1 基準日
 * @param date2 比較日
 * @returns date1 - date2 の日数（正: date1が未来、負: date1が過去）
 */
export const diffInDays = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 今日の日付を取得（時刻を00:00:00に正規化）
 * @returns 正規化された今日のDate
 */
export const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};
