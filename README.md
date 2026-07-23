# SE稼働管理システム

SEの稼働時間管理および案件把握を目的とした社内向けWebアプリケーション。
Clockifyの代替として、必要機能のみに絞って実装したシンプルな稼働管理ツールです。

## 機能一覧

| 機能 | 説明 |
|------|------|
| タイマー記録 | START/STOPボタンでリアルタイム計測・記録 |
| 手動稼働入力 | 日付・分類・案件・時間（時/分）・コメントで記録 |
| 案件管理 | PJ案件・都度稟議案件の登録と予実管理 |
| 稼働レポート | 分類別・案件別・メンバー別集計 |
| CSVエクスポート | 現行Excelフォーマット互換で出力 |
| ユーザー管理 | 招待制（自己登録不可）、3段階ロール管理 |

### 稼働分類（固定）

- 生産稼働（開発）
- 保守稼働（調査/問合せ対応）
- 保守稼働（開発）
- 社/本部/部内の仕事
- イベント
- 休暇

### ユーザーロール

| ロール | 権限 |
|--------|------|
| スーパーユーザー | 全機能 + ユーザー管理 |
| 管理者 | 案件管理 + 全メンバー稼働閲覧 + レポート出力 |
| メンバー | 自分の稼働記録のみ |

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド / API | Next.js 16 (App Router) |
| データベース / 認証 | Supabase (PostgreSQL + Auth) |
| ホスティング | Vercel |
| UIコンポーネント | shadcn/ui + Tailwind CSS v4 |
| モノレポ管理 | Turborepo + pnpm |

## リポジトリ構成

```
.
├── apps/
│   └── web/                    # Next.js アプリケーション
│       ├── app/                # App Router ページ
│       │   ├── (app)/          # 認証済みページ群
│       │   │   ├── dashboard/  # タイマー・本日の稼働
│       │   │   ├── time/       # 稼働記録一覧・手動入力
│       │   │   ├── projects/   # 案件管理・予実
│       │   │   ├── reports/    # レポート・CSV出力
│       │   │   └── settings/   # ユーザー管理・プロフィール
│       │   ├── login/          # ログイン・パスワードリセット
│       │   └── auth/callback/  # Supabase Auth コールバック
│       ├── components/         # 共通コンポーネント
│       │   ├── layout/         # サイドバー
│       │   ├── timer/          # タイマーウィジェット
│       │   ├── time-entries/   # 稼働記録フォーム・一覧
│       │   └── projects/       # 案件フォーム
│       ├── lib/
│       │   ├── supabase/       # Supabase クライアント
│       │   ├── actions/        # Server Actions
│       │   ├── queries.ts      # データ取得クエリ
│       │   └── utils.ts        # ユーティリティ関数
│       └── proxy.ts            # 認証ガード
└── packages/
    └── database/
        ├── src/types.ts        # TypeScript 型定義
        └── migrations/
            ├── 001_initial_schema.sql  # テーブル定義
            └── 002_rls_policies.sql    # RLS ポリシー
```

## セットアップ手順

### 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) でプロジェクトを新規作成
2. SQL Editor で以下の順にマイグレーションを実行:
   - `packages/database/migrations/001_initial_schema.sql`
   - `packages/database/migrations/002_rls_policies.sql`
3. Authentication > Settings で `Site URL` を設定

### 2. 環境変数の設定

`apps/web/.env.local` を作成:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. ローカル起動

```bash
# 依存パッケージインストール
pnpm install

# 開発サーバー起動
pnpm dev
```

`http://localhost:3000` でアクセス可能です。

### 4. Vercel デプロイ

1. Vercel に GitHub リポジトリを接続
2. Root Directory を `apps/web` に設定
3. 環境変数を Vercel ダッシュボードで設定（`NEXT_PUBLIC_SITE_URL` はVercelのURLに変更）

### 5. 初回ユーザー登録

Supabase Dashboard > Authentication > Users から最初のスーパーユーザーを手動で追加してください。
その後は `/settings/users` からアプリ上で招待可能です。

## データベース設計

```
profiles       - ユーザー情報（Supabase Auth と連携）
projects       - 案件（PJ案件 / 都度稟議案件）
time_entries   - 稼働記録（15分単位）
active_timers  - 起動中タイマー管理
```

Row Level Security (RLS) により、メンバーは自分のデータのみアクセス可能です。

## 無料枠について

| サービス | 無料枠 | 6名利用での見込み |
|---------|--------|-----------------|
| Vercel Free | 帯域幅 100GB/月 | 十分 |
| Supabase Free | DB 500MB・50万リクエスト/月 | 十分 |

> **注意:** Supabase 無料枠は7日間アクセスがないとプロジェクトが一時停止します。週1回以上利用することで回避できます。
