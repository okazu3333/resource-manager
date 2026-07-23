-- ============================================================
-- Row Level Security (RLS) ポリシー
-- ============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ヘルパー関数: 現在のユーザーのロール取得
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS boolean AS $$
  SELECT get_my_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT get_my_role() = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- profiles ポリシー
-- ============================================================
-- 全員: 自分のプロフィールを読む
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- 管理者以上: 全プロフィール読み取り
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (is_admin_or_above());

-- 全員: 自分のプロフィールを更新
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- スーパーユーザーのみ: 他ユーザーのロール・状態を更新
CREATE POLICY "profiles_update_super"
  ON public.profiles FOR UPDATE
  USING (is_super_admin());

-- ============================================================
-- projects ポリシー
-- ============================================================
-- 管理者以上: 全案件を読み取り・作成・更新
CREATE POLICY "projects_all_admin"
  ON public.projects FOR ALL
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

-- メンバー: 自分の time_entries に紐付く案件のみ読み取り
CREATE POLICY "projects_select_member"
  ON public.projects FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT project_id
      FROM public.time_entries
      WHERE user_id = auth.uid()
        AND project_id IS NOT NULL
        AND deleted_at IS NULL
    )
  );

-- ============================================================
-- time_entries ポリシー
-- ============================================================
-- 管理者以上: 全エントリを読み取り・作成・更新・削除
CREATE POLICY "time_entries_all_admin"
  ON public.time_entries FOR ALL
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

-- メンバー: 自分のエントリのみ読み取り・作成・更新
CREATE POLICY "time_entries_own_member"
  ON public.time_entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- active_timers ポリシー
-- ============================================================
-- 全員: 自分のタイマーのみ操作
CREATE POLICY "active_timers_own"
  ON public.active_timers FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 管理者以上: 全タイマーを読み取り
CREATE POLICY "active_timers_read_admin"
  ON public.active_timers FOR SELECT
  USING (is_admin_or_above());
