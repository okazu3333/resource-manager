export type UserRole = 'super_admin' | 'admin' | 'member'
export type ProjectType = 'project' | 'approval'
export type ProjectStatus = 'active' | 'completed' | 'suspended'
export type TaskStatus = 'open' | 'in_progress' | 'closed'
export type WorkCategory =
  | '生産稼働（開発）'
  | '保守稼働（調査/問合せ対応）'
  | '保守稼働（開発）'
  | '社/本部/部内の仕事'
  | 'イベント'
  | '休暇'

export const WORK_CATEGORIES: WorkCategory[] = [
  '生産稼働（開発）',
  '保守稼働（調査/問合せ対応）',
  '保守稼働（開発）',
  '社/本部/部内の仕事',
  'イベント',
  '休暇',
]

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Project {
  id: string
  name: string
  type: ProjectType
  status: ProjectStatus
  budget_hours: number | null
  start_date: string | null
  end_date: string | null
  description: string | null
  archived: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  name: string
  backlog_issue_key: string | null
  backlog_issue_url: string | null
  status: TaskStatus
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  date: string
  work_category: WorkCategory
  project_id: string | null
  task_id: string | null
  description: string | null
  started_at: string | null
  ended_at: string | null
  duration_hours: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ActiveTimer {
  user_id: string
  started_at: string
  project_id: string | null
  task_id: string | null
}
