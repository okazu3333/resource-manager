-- ============================================================
-- SE稼働管理システム - 初期スキーマ
-- ============================================================

-- ============================================================
-- profiles テーブル（Supabase Auth と連携）
-- ============================================================
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  email       text        NOT NULL,
  role        text        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('super_admin', 'admin', 'member')),
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- projects テーブル
-- ============================================================
CREATE TABLE public.projects (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  type          text        NOT NULL
                            CHECK (type IN ('project', 'approval')),
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'completed', 'suspended')),
  budget_hours  numeric(6,2)
                            CHECK (budget_hours IS NULL OR budget_hours >= 0),
  start_date    date,
  end_date      date,
  description   text,
  archived      boolean     NOT NULL DEFAULT false,
  created_by    uuid        NOT NULL REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- time_entries テーブル
-- ============================================================
CREATE TABLE public.time_entries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.profiles(id),
  date            date        NOT NULL,
  work_category   text        NOT NULL
                              CHECK (work_category IN (
                                '生産稼働（開発）',
                                '保守稼働（調査/問合せ対応）',
                                '保守稼働（開発）',
                                '社/本部/部内の仕事',
                                'イベント',
                                '休暇'
                              )),
  project_id      uuid        REFERENCES public.projects(id),
  description     text,
  started_at      timestamptz,
  ended_at        timestamptz,
  duration_hours  numeric(4,2) NOT NULL
                              CHECK (duration_hours > 0 AND duration_hours <= 24),
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- active_timers テーブル（起動中タイマー管理）
-- ============================================================
CREATE TABLE public.active_timers (
  user_id     uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at  timestamptz NOT NULL DEFAULT now(),
  project_id  uuid        REFERENCES public.projects(id)
);

-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX idx_time_entries_user_date   ON public.time_entries(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_project     ON public.time_entries(project_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_date        ON public.time_entries(date)           WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status          ON public.projects(status)             WHERE archived = false;

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ユーザー登録時に profiles を自動作成するトリガー
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
