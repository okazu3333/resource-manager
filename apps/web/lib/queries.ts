import { createClient } from '@/lib/supabase/server'
import type { Profile, Project, TimeEntry, ActiveTimer } from '@se-worktime/database'

// ジョイン型の定義
export type TimeEntryWithRelations = TimeEntry & {
  project: Pick<Project, 'id' | 'name' | 'type'> | null
  profile: Pick<Profile, 'id' | 'name'>
}

export type ActiveTimerWithProject = ActiveTimer & {
  project: Pick<Project, 'id' | 'name'> | null
}

export type ProjectWithStats = Project & {
  consumed_hours: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cast = <T>(v: any): T => v as T

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return cast<Profile | null>(data)
}

export async function getActiveTimer(): Promise<ActiveTimerWithProject | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('active_timers')
    .select('*, project:projects(id, name)')
    .eq('user_id', user.id)
    .single()

  return cast<ActiveTimerWithProject | null>(data)
}

export async function getTimeEntries({
  userId,
  dateFrom,
  dateTo,
}: {
  userId?: string
  dateFrom: string
  dateTo: string
}): Promise<TimeEntryWithRelations[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('time_entries')
    .select('*, project:projects(id, name, type), profile:profiles(id, name)')
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data } = await query
  return cast<TimeEntryWithRelations[]>(data ?? [])
}

export async function getProjects({ includeArchived = false } = {}): Promise<Project[]> {
  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (!includeArchived) {
    query = query.eq('archived', false)
  }

  const { data } = await query
  return cast<Project[]>(data ?? [])
}

export async function getProjectWithStats(id: string): Promise<ProjectWithStats | null> {
  const supabase = await createClient()

  const { data: projectData } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!projectData) return null
  const project = cast<Project>(projectData)

  const { data: entries } = await supabase
    .from('time_entries')
    .select('duration_hours')
    .eq('project_id', id)
    .is('deleted_at', null)

  const consumed = cast<{ duration_hours: number }[]>(entries ?? [])
    .reduce((sum, e) => sum + e.duration_hours, 0)

  return { ...project, consumed_hours: consumed }
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('name')

  return cast<Profile[]>(data ?? [])
}

export async function getReportData({
  dateFrom,
  dateTo,
  userId,
  projectId,
}: {
  dateFrom: string
  dateTo: string
  userId?: string
  projectId?: string
}): Promise<TimeEntryWithRelations[]> {
  const supabase = await createClient()

  let query = supabase
    .from('time_entries')
    .select('*, project:projects(id, name, type), profile:profiles(id, name)')
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .is('deleted_at', null)
    .order('date', { ascending: true })

  if (userId) query = query.eq('user_id', userId)
  if (projectId) query = query.eq('project_id', projectId)

  const { data } = await query
  return cast<TimeEntryWithRelations[]>(data ?? [])
}
