# Research & Design Decisions

## Summary
- **Feature**: `dashboard-status`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - App.tsxのダッシュボードセクション（610-677行）を拡張することで実装可能
  - GanttChartの`diffInDays`関数を共通ユーティリティとして抽出・再利用可能
  - 既存のuseMemoパターンを踏襲し、集計ロジックをカスタムフックに分離することで保守性向上

## Research Log

### 既存ダッシュボード構造の分析
- **Context**: 現在のダッシュボード実装を把握し、拡張ポイントを特定
- **Sources Consulted**: `App.tsx:610-677`
- **Findings**:
  - 4つの統計カード（総数・進行中・完了・計画中）が実装済み
  - 進行中プロジェクトのカード表示が実装済み（チケット数のみ表示）
  - `onClick`でタイムライン画面への遷移機能が既に存在
  - Tailwind CSSによるダークモード対応済み
- **Implications**: 既存UIパターンを踏襲し、追加情報を表示する形で拡張

### 日付計算ユーティリティの調査
- **Context**: 期限計算に必要な日付操作関数の存在確認
- **Sources Consulted**: `components/GanttChart.tsx:5-18`
- **Findings**:
  - `addDays(date, days)`: 日付に日数を加算
  - `diffInDays(date1, date2)`: 2つの日付間の日数差を計算
  - 両関数ともGanttChart内にローカル定義されている
- **Implications**: 共通ユーティリティファイルに抽出し、ダッシュボードでも再利用

### 型定義の確認
- **Context**: データモデルの構造を確認し、集計ロジックに必要な情報を特定
- **Sources Consulted**: `types.ts`
- **Findings**:
  - `Project.endDate: Date | null` - 期限計算に使用
  - `Project.status: ProjectStatus` - フィルタリングに使用
  - `Ticket.endDate: Date` - チケット期限計算に使用
  - `Ticket.assigneeId: string | null` - 担当者別集計に使用
  - `Ticket.parentId: string | null` - 親チケット判定に使用
- **Implications**: 既存型定義で全要件をカバー可能、型拡張不要

### Reactパターンの分析
- **Context**: 既存のステート管理・パフォーマンス最適化パターンを確認
- **Sources Consulted**: `App.tsx:1-60`
- **Findings**:
  - `useMemo`で計算結果をメモ化（currentProject, projectTickets, visibleTickets）
  - `useCallback`でイベントハンドラをメモ化
  - Discriminated Union型でModalStateを管理
  - `useState`でローカルステート管理（外部状態管理ライブラリ不使用）
- **Implications**: カスタムフックでuseMemoを活用し、集計計算を最適化

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: App.tsx直接拡張 | ダッシュボードセクションに直接ロジック追加 | 最小変更、即座に実装可能 | App.tsxがさらに肥大化（現在894行） | 短期的には有効だが保守性に懸念 |
| B: 新規コンポーネント群 | Dashboard.tsx、DashboardStatsCard.tsx等を新規作成 | 責務分離、テスタビリティ向上 | ファイル数増加、props drilling | 長期的には推奨 |
| C: ハイブリッド | カスタムフック(useDashboardStats)で集計分離、UIはApp.tsx内 | ロジック分離、段階的改善可能 | 完全な責務分離には至らない | 現実的なバランス、選択 |

## Design Decisions

### Decision: 集計ロジックのカスタムフック化
- **Context**: ダッシュボードに複数の集計計算が必要（プロジェクト別、期限別、担当者別）
- **Alternatives Considered**:
  1. App.tsx内にインライン実装 — 変更箇所が1ファイルで済む
  2. カスタムフック(useDashboardStats)に分離 — ロジックとUIの分離
  3. 別途Contextで状態管理 — 過剰設計の懸念
- **Selected Approach**: カスタムフック `useDashboardStats` を新規作成
- **Rationale**:
  - 集計ロジックの単体テストが可能
  - App.tsxの肥大化を抑制
  - useMemoによるメモ化を適切に適用可能
- **Trade-offs**: フック呼び出しのオーバーヘッド（軽微）
- **Follow-up**: パフォーマンス影響を実装後に確認

### Decision: 日付ユーティリティの共通化
- **Context**: GanttChartとダッシュボードで同じ日付計算が必要
- **Alternatives Considered**:
  1. GanttChartから関数をimport — GanttChartの責務外
  2. 新規ユーティリティファイル `utils/date.ts` 作成 — クリーンだが追加ファイル
  3. ダッシュボードフック内に再定義 — 重複コード
- **Selected Approach**: `utils/date.ts` を新規作成し、GanttChartからも参照変更
- **Rationale**: DRY原則、将来的な拡張性
- **Trade-offs**: GanttChartの軽微なリファクタリングが必要
- **Follow-up**: GanttChartの動作確認テスト

### Decision: 警告アイコンの追加
- **Context**: 期限超過チケットがあるプロジェクトを視覚的に警告表示
- **Alternatives Considered**:
  1. 新規警告アイコンをIcons.tsxに追加
  2. 既存アイコンの色変更で対応
- **Selected Approach**: `ExclamationTriangleIcon` を Icons.tsx に追加
- **Rationale**: 明確な視覚的識別、既存パターンに準拠
- **Trade-offs**: なし

## Risks & Mitigations
- **Risk 1**: App.tsxのさらなる肥大化 — カスタムフックへの集計ロジック分離で軽減
- **Risk 2**: 日付計算の時間帯依存バグ — `setHours(0,0,0,0)`で正規化（既存パターン踏襲）
- **Risk 3**: 大量チケット時のパフォーマンス低下 — useMemoによるメモ化で軽減

## References
- React公式ドキュメント - useMemo, useCallback
- Tailwind CSS v3 - ダークモード対応
