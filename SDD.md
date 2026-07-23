# ソフトウェア設計仕様書 (SDD)
## SE稼働管理システム

**バージョン:** 1.2（確定版）
**作成日:** 2026-07-22
**対象人数:** 6名（社内SE向け）

---

## 1. システム概要

SEの稼働時間管理および案件把握を目的とした社内向けWebアプリケーション。
既存のExcelベース管理（稼働時間管理_SES.xlsx）をWebシステムに置き換え、リアルタイムのタイマー記録・集計・予実管理を実現する。

---

## 2. システム構成

### 2.1 技術スタック

| レイヤー | 技術 | 理由 |
|---------|------|------|
| リポジトリ構成 | モノレポ (Turborepo) | アプリ・パッケージ一元管理 |
| フロントエンド | Next.js 14 (App Router) | Vercel最適化、SSR/CSR両対応 |
| バックエンド | Next.js API Routes / Server Actions | 追加サーバー不要 |
| データベース | Supabase (PostgreSQL) ※新規作成 | 無料枠、Auth込み、SQLで集計容易 |
| 認証 | Supabase Auth | メール/パスワード認証 |
| ホスティング | Vercel（デフォルトドメイン） | 無料枠、Next.js最適化 |
| UIコンポーネント | shadcn/ui + Tailwind CSS | 高品質コンポーネント、モノレポ対応 |

### 2.2 無料枠の範囲

- **Vercel Free:** 帯域幅100GB/月、Serverless Functions実行時間100GB-hours
- **Supabase Free:** DB 500MB、Auth無制限、APIリクエスト50万件/月
- 6名・中規模利用では両枠内に十分収まる見込み

---

## 3. ユーザーロール定義

| ロール | 説明 | 権限 |
|--------|------|------|
| スーパーユーザー | システム管理者 | 全機能 + ユーザー管理 + 案件管理 + 全メンバー稼働閲覧/編集 |
| 管理者 | チームリーダー等 | 案件管理 + 全メンバー稼働閲覧 + レポート出力 |
| メンバー | 一般SE | 自分の稼働記録のみ登録・閲覧・編集 |

---

## 4. 機能要件

### 4.1 認証機能

| ID | 機能 | 詳細 |
|----|------|------|
| AUTH-01 | ログイン | メールアドレス + パスワード認証 |
| AUTH-02 | ログアウト | セッション破棄 |
| AUTH-03 | ユーザー招待 | スーパーユーザー/管理者が招待メール送信。自己登録不可 |
| AUTH-04 | パスワードリセット | メール経由でリセットリンク送付 |

### 4.2 ユーザー管理機能（スーパーユーザーのみ）

| ID | 機能 | 詳細 |
|----|------|------|
| USER-01 | ユーザー招待 | メールアドレス・ロールを指定して招待 |
| USER-02 | ロール変更 | メンバーのロールを変更 |
| USER-03 | ユーザー無効化 | 退職等で利用停止（データは保持） |

### 4.3 案件（プロジェクト）管理機能

| ID | 機能 | 対象ロール | 詳細 |
|----|------|-----------|------|
| PRJ-01 | 案件登録 | 管理者以上 | 案件情報を登録 |
| PRJ-02 | 案件編集 | 管理者以上 | 案件情報を更新 |
| PRJ-03 | 案件一覧 | 全員 | 管理者以上：全案件。メンバー：自分の稼働記録に紐付く案件のみ表示 |
| PRJ-04 | 案件詳細 | 全員 | 案件情報・予実サマリー表示 |
| PRJ-05 | 案件アーカイブ | 管理者以上 | 完了案件を非表示化 |

#### 案件エンティティ

```
案件 (projects)
├── 案件名 (name)           ※必須
├── 案件種別 (type)         ※ 'project'（PJ案件） | 'approval'（都度稟議案件）
├── ステータス (status)     ※ 'active'（進行中） | 'completed'（完了） | 'suspended'（停止）
├── 予算工数 (budget_hours) ※ PJ案件・都度稟議案件ともに同フィールドを使用（単位：h、0.25h刻み）
├── 開始予定日 (start_date)
├── 終了予定日 (end_date)
├── メモ (description)
└── アーカイブフラグ (archived)
```

#### 案件種別の運用

| 種別 | 説明 | 運用方法 |
|------|------|---------|
| PJ案件 | 継続的なプロジェクト | 1案件を継続管理。予算工数に対する予実管理 |
| 都度稟議案件 | 稟議ベースで発生する作業 | **稟議ごとに別案件として登録**。案件名に稟議番号・内容を含めて識別 |

> 都度稟議案件は「稟議ごとに1案件」として登録するため、複数稟議の管理もシンプルな案件一覧で把握できる。

### 4.4 稼働記録機能

#### 稼働分類（固定リスト）

既存Excelから継承（変更不可）：

| 分類名 | 区分 |
|--------|------|
| 生産稼働（開発） | 稼働 |
| 保守稼働（調査/問合せ対応） | 稼働 |
| 保守稼働（開発） | 稼働 |
| 社/本部/部内の仕事 | 稼働 |
| イベント | その他 |
| 休暇 | 休暇 |

#### 稼働記録エンティティ

```
稼働記録 (time_entries)
├── ユーザー (user_id)
├── 日付 (date)
├── 稼働分類 (work_category)     ※上記固定リストから選択
├── 案件 (project_id)            ※ 任意（社/本部/部内の仕事・休暇等は案件なし可）
├── 内容/コメント (description)  ※ 作業内容メモ
├── 開始時刻 (started_at)        ※ タイマー使用時のみ
├── 終了時刻 (ended_at)          ※ タイマー使用時のみ
└── 稼働時間 (duration_hours)    ※ 0.25h刻み（15分単位）
```

| ID | 機能 | 詳細 |
|----|------|------|
| TIME-01 | タイマー記録 | START/STOPボタンで計測。停止時に分類・案件・コメントを入力して保存 |
| TIME-02 | 手動記録 | 日付・分類・案件・時間（時間/分）・コメントを直接入力 |
| TIME-03 | 記録編集 | 自分の記録を編集（管理者以上は全員分） |
| TIME-04 | 記録削除 | 自分の記録を削除（管理者以上は全員分） |
| TIME-05 | 日次一覧 | 日付で絞り込んだ稼働記録リスト表示 |
| TIME-06 | 月次カレンダービュー | カレンダー形式で日ごとの稼働時間合計を確認 |

#### タイマー仕様

- 1ユーザーにつき同時起動タイマーは1つのみ
- タイマー起動中は他画面に移動してもカウント継続（DBに開始時刻を保存）
- ページ再読み込み後もタイマー状態を復元
- STOP後、分類・案件・コメントを入力するモーダルを表示して確定保存

#### 稼働時間の入力仕様

- 入力形式：**時間（h）+ 分（min）の2フィールド**（例：`2時間 30分`）
- 分は 0 / 15 / 30 / 45 のみ選択可（15分単位）
- DBには小数時間に変換して保存（例：2時間30分 → `2.5`）
- タイムゾーン：JST固定（Asia/Tokyo）

### 4.5 レポート・集計機能

| ID | 機能 | 対象ロール | 詳細 |
|----|------|-----------|------|
| RPT-01 | 個人稼働サマリー | 全員 | 自分の日次/週次/月次 稼働合計 |
| RPT-02 | チーム稼働サマリー | 管理者以上 | メンバー全員の稼働一覧 |
| RPT-03 | 案件別集計 | 管理者以上 | 案件ごとの消化工数・予実管理 |
| RPT-04 | 稼働分類別集計 | 管理者以上 | 分類ごとの工数集計 |
| RPT-05 | CSVエクスポート | 管理者以上 | 現行Excel形式で出力 |

#### 集計軸（組み合わせ可）

- 期間：日次 / 週次 / 月次 / 任意期間指定
- メンバー別
- 案件別
- 稼働分類別

#### CSVエクスポート仕様（現行Excel形式に準拠）

出力カラム順：

```
名前, 日付, 曜日, 稼働分類, PJ/サービス, 内容, 稼働実績(h)
```

- 日付形式：YYYY/MM/DD
- 曜日：月〜日（日本語）
- 稼働実績：小数（例：0.25、0.5、8.0）
- 案件なしの場合は PJ/サービス 列を `-` で出力

#### 予実管理表示（案件詳細画面）

```
案件: ○○○○
種別: PJ案件 / 都度稟議案件
予算工数: 100h
消化工数:  67.5h  (67.5%)
残工数:    32.5h
[===========         ] 67.5%
```

---

## 5. 非機能要件

| 項目 | 要件 |
|------|------|
| 対応ブラウザ | Chrome最新版（主要利用環境） |
| レスポンシブ | PC優先（スマホは参照程度） |
| タイムゾーン | JST固定（Asia/Tokyo） |
| 認証セッション | Supabase JWTトークン（有効期限1時間、リフレッシュトークンで延長） |
| データ保持 | 全稼働データを永続保持（削除は論理削除） |
| セキュリティ | Row Level Security (RLS) でユーザーは自分のデータのみアクセス可 |

---

## 6. データベース設計

### テーブル一覧

```sql
-- ユーザー（Supabase Auth と連携）
profiles
  id          uuid        PRIMARY KEY   -- auth.users.id と同一
  name        text        NOT NULL
  email       text        NOT NULL
  role        text        NOT NULL      -- 'super_admin' | 'admin' | 'member'
  is_active   boolean     DEFAULT true
  created_at  timestamptz DEFAULT now()

-- 案件
projects
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid()
  name          text        NOT NULL
  type          text        NOT NULL    -- 'project' | 'approval'
  status        text        NOT NULL DEFAULT 'active'  -- 'active' | 'completed' | 'suspended'
  budget_hours  numeric(6,2)            -- 予算工数（PJ・稟議とも共通）
  start_date    date
  end_date      date
  description   text
  archived      boolean     DEFAULT false
  created_by    uuid        REFERENCES profiles(id)
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()

-- 稼働記録
time_entries
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         uuid        NOT NULL REFERENCES profiles(id)
  date            date        NOT NULL
  work_category   text        NOT NULL    -- 稼働分類（固定値）
  project_id      uuid        REFERENCES projects(id)  -- NULL可
  description     text
  started_at      timestamptz             -- タイマー使用時のみ
  ended_at        timestamptz             -- タイマー使用時のみ
  duration_hours  numeric(4,2) NOT NULL   -- 0.25h刻み
  deleted_at      timestamptz             -- 論理削除
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()

-- タイマー状態（起動中タイマー管理）
active_timers
  user_id       uuid        PRIMARY KEY REFERENCES profiles(id)
  started_at    timestamptz NOT NULL
  project_id    uuid        REFERENCES projects(id)
```

### RLSポリシー概要

| テーブル | メンバー | 管理者以上 |
|---------|---------|----------|
| profiles | 自分のみ読み書き | 全件読み取り |
| projects | 自分の time_entries に紐付くもののみ読み取り | 全件読み書き |
| time_entries | 自分のレコードのみ読み書き | 全件読み書き |
| active_timers | 自分のレコードのみ | 全件読み書き |

---

## 7. 画面構成

```
/
├── /login                    ログイン
├── /dashboard                ダッシュボード
│                               - 今日の稼働一覧・合計時間
│                               - タイマー（START/STOP）
│                               - 今週の稼働サマリー
├── /time
│   └── /time                 稼働記録一覧
│                               - 日/週 切り替え
│                               - 手動追加フォーム
├── /projects
│   ├── /projects             案件一覧（ステータス・種別フィルタ）
│   ├── /projects/new         案件登録（管理者以上）
│   └── /projects/[id]        案件詳細・予実グラフ
├── /reports
│   ├── /reports/personal     個人稼働レポート（期間・分類・案件軸）
│   └── /reports/team         チームレポート（管理者以上）
└── /settings
    ├── /settings/users       ユーザー管理・招待（スーパーユーザーのみ）
    └── /settings/profile     自分のプロフィール・パスワード変更
```

---

## 8. 対象外機能

- クライアント/請求管理
- 通知・Slack連携
- 月次承認ワークフロー
- 複数ワークスペース
- スマホアプリ
- 外部カレンダー連携
