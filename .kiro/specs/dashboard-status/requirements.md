# Requirements Document

## Introduction
ホーム画面のダッシュボードを拡張し、進行中のプロジェクトの詳細な状況とチケットの状況を一目で把握できるようにする。現在のダッシュボードは基本的な統計情報（プロジェクト数、ステータス別カウント）と進行中プロジェクトの簡易カード表示のみであるため、より詳細な進捗状況やチケット情報を表示することで、プロジェクト管理の効率を向上させる。

## Requirements

### Requirement 1: プロジェクト進捗サマリー
**Objective:** As a プロジェクトマネージャー, I want 各進行中プロジェクトの進捗率とチケット状況を視覚的に確認したい, so that プロジェクト全体の健全性を迅速に評価できる

#### Acceptance Criteria
1.1. When ダッシュボードが表示される, the Dashboard shall 各進行中プロジェクトの総チケット数と親チケット数を表示する
1.2. When ダッシュボードが表示される, the Dashboard shall プロジェクトごとの期間情報（開始日・終了日）を表示する
1.3. If プロジェクトに終了日が設定されている, then the Dashboard shall 残日数または期限超過日数を表示する
1.4. The Dashboard shall 進行中プロジェクトをカード形式で見やすく配置する

### Requirement 2: チケット状況の可視化
**Objective:** As a チームメンバー, I want プロジェクトごとのチケット状況を確認したい, so that 作業の優先順位を判断できる

#### Acceptance Criteria
2.1. When プロジェクトカードが表示される, the Dashboard shall そのプロジェクトに属するチケットの総数を表示する
2.2. When プロジェクトカードが表示される, the Dashboard shall 担当者別のチケット数を表示する
2.3. If チケットに担当者が未割り当ての場合, then the Dashboard shall 未割り当てチケット数を別途表示する

### Requirement 3: 期限管理の表示
**Objective:** As a プロジェクトマネージャー, I want 期限が近いまたは超過したチケットを把握したい, so that リスクを早期に特定し対応できる

#### Acceptance Criteria
3.1. When ダッシュボードが表示される, the Dashboard shall 本日から7日以内に期限を迎えるチケット数を表示する
3.2. When ダッシュボードが表示される, the Dashboard shall 期限を超過したチケット数を警告表示する
3.3. If 期限超過チケットが存在する, then the Dashboard shall 該当プロジェクトカードに警告アイコンを表示する

### Requirement 4: クイックアクセス機能
**Objective:** As a ユーザー, I want ダッシュボードから関連画面に素早く遷移したい, so that 作業効率を向上できる

#### Acceptance Criteria
4.1. When プロジェクトカードをクリックする, the Dashboard shall 該当プロジェクトのタイムライン画面に遷移する
4.2. When 期限警告エリアをクリックする, the Dashboard shall 該当プロジェクトのタイムライン画面に遷移する
4.3. The Dashboard shall 各プロジェクトカードにタイムラインへのリンクボタンを表示する

### Requirement 5: 全体統計の拡張
**Objective:** As a 経営層, I want プロジェクト全体の状況を俯瞰したい, so that リソース配分の判断材料にできる

#### Acceptance Criteria
5.1. The Dashboard shall 全プロジェクトの総チケット数を表示する
5.2. The Dashboard shall 全担当者の稼働状況（担当チケット数）を表示する
5.3. When 統計セクションが表示される, the Dashboard shall 既存の4つの統計カード（総数・進行中・完了・計画中）を維持する
