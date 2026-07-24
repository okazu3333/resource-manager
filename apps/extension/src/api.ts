import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get('access_token')
  return result.access_token ?? null
}

async function req(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? res.statusText)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function signIn(email: string, password: string) {
  const data = await req('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  await chrome.storage.local.set({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: data.user.id,
    user_email: data.user.email,
  })
  return data
}

export async function signOut() {
  const token = await getToken()
  if (token) {
    await req('/auth/v1/logout', { method: 'POST' }).catch(() => {})
  }
  await chrome.storage.local.remove(['access_token', 'refresh_token', 'user_id', 'user_email', 'profile'])
}

export async function getProfile() {
  const { user_id } = await chrome.storage.local.get('user_id')
  if (!user_id) return null
  const data = await req(`/rest/v1/profiles?id=eq.${user_id}&select=*`)
  return data?.[0] ?? null
}

export async function getActiveTimer() {
  const { user_id } = await chrome.storage.local.get('user_id')
  if (!user_id) return null
  const data = await req(`/rest/v1/active_timers?user_id=eq.${user_id}&select=*,project:projects(id,name),task:tasks(id,name)`)
  return data?.[0] ?? null
}

export async function getProjects() {
  const data = await req('/rest/v1/projects?archived=eq.false&select=id,name&order=name')
  return data ?? []
}

export async function getTasks(projectId: string) {
  const data = await req(`/rest/v1/tasks?project_id=eq.${projectId}&status=neq.closed&select=id,name&order=created_at`)
  return data ?? []
}

export async function startTimer(projectId: string | null, taskId: string | null) {
  const { user_id } = await chrome.storage.local.get('user_id')
  // 既存タイマーを削除してから新規作成
  await req(`/rest/v1/active_timers?user_id=eq.${user_id}`, { method: 'DELETE' }).catch(() => {})
  return req('/rest/v1/active_timers', {
    method: 'POST',
    body: JSON.stringify({
      user_id,
      started_at: new Date().toISOString(),
      project_id: projectId || null,
      task_id: taskId || null,
    }),
  })
}

export async function stopTimer(workCategory: string, description: string) {
  const { user_id } = await chrome.storage.local.get('user_id')
  const timer = await getActiveTimer()
  if (!timer) return null

  const startedAt = new Date(timer.started_at)
  const now = new Date()
  const diffMs = now.getTime() - startedAt.getTime()
  // 15分単位切り上げ（最低1ブロック=15分）
  const blocks = Math.max(1, Math.ceil((diffMs / 60000) / 15))
  const durationHours = blocks * 0.25

  // タイムエントリを作成
  await req('/rest/v1/time_entries', {
    method: 'POST',
    body: JSON.stringify({
      user_id,
      date: now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }),
      work_category: workCategory,
      project_id: timer.project_id,
      task_id: timer.task_id,
      description: description || null,
      started_at: timer.started_at,
      ended_at: now.toISOString(),
      duration_hours: durationHours,
    }),
  })

  // タイマー削除
  await req(`/rest/v1/active_timers?user_id=eq.${user_id}`, { method: 'DELETE' })
  return { duration_hours: durationHours }
}

export async function getTodayTotal() {
  const { user_id } = await chrome.storage.local.get('user_id')
  if (!user_id) return 0
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
  const data = await req(
    `/rest/v1/time_entries?user_id=eq.${user_id}&date=eq.${today}&deleted_at=is.null&select=duration_hours`,
  )
  return (data ?? []).reduce((sum: number, e: any) => sum + e.duration_hours, 0)
}
