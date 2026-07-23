export type UserRole = 'super_admin' | 'admin' | 'member'
export type ProjectType = 'project' | 'approval'
export type ProjectStatus = 'active' | 'completed' | 'suspended'
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

export interface TimeEntry {
  id: string
  user_id: string
  date: string
  work_category: WorkCategory
  project_id: string | null
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
}

// Join types
export interface TimeEntryWithProject extends TimeEntry {
  project: Pick<Project, 'id' | 'name' | 'type'> | null
  profile: Pick<Profile, 'id' | 'name'>
}

export interface ProjectWithStats extends Project {
  consumed_hours: number
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at'>>
      }
      time_entries: {
        Row: TimeEntry
        Insert: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<TimeEntry, 'id' | 'created_at'>>
      }
      active_timers: {
        Row: ActiveTimer
        Insert: ActiveTimer
        Update: Partial<ActiveTimer>
      }
    }
  }
}
