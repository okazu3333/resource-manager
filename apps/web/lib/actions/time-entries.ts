'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { hmToHours } from '@/lib/utils'

export async function createTimeEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const durationHours = hmToHours(
    Number(formData.get('hours')),
    Number(formData.get('minutes')),
  )

  if (durationHours <= 0) return { error: '稼働時間を入力してください' }

  const projectId = (formData.get('project_id') as string) || null
  const taskId = (formData.get('task_id') as string) || null

  const { error } = await supabase.from('time_entries').insert({
    user_id: user.id,
    date: formData.get('date') as string,
    work_category: formData.get('work_category') as string,
    project_id: projectId,
    task_id: taskId,
    description: (formData.get('description') as string) || null,
    duration_hours: durationHours,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/time')
  return { success: true }
}

export async function updateTimeEntry(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const durationHours = hmToHours(
    Number(formData.get('hours')),
    Number(formData.get('minutes')),
  )

  if (durationHours <= 0) return { error: '稼働時間を入力してください' }

  const projectId = (formData.get('project_id') as string) || null
  const taskId = (formData.get('task_id') as string) || null

  const { error } = await supabase
    .from('time_entries')
    .update({
      date: formData.get('date') as string,
      work_category: formData.get('work_category') as string,
      project_id: projectId,
      task_id: taskId,
      description: (formData.get('description') as string) || null,
      duration_hours: durationHours,
    })
    .eq('id', id)
    .eq('user_id', user.id) // RLS補完

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/time')
  return { success: true }
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const { error } = await supabase
    .from('time_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/time')
  return { success: true }
}

// タイマー操作
export async function startTimer(projectId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const { error } = await supabase.from('active_timers').upsert({
    user_id: user.id,
    started_at: new Date().toISOString(),
    project_id: projectId || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function stopTimer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  // タイマー状態を取得
  const { data: timer } = await supabase
    .from('active_timers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!timer) return { error: 'タイマーが起動していません' }

  const startedAt = new Date(timer.started_at)
  const endedAt = new Date()
  const diffMs = endedAt.getTime() - startedAt.getTime()
  // 15分単位に切り上げ（実際の経過時間を尊重、最低1ブロック=15分）
  const blocks = Math.max(1, Math.ceil((diffMs / 60000) / 15))
  const durationHours = blocks * 0.25

  const projectId = (formData.get('project_id') as string) || timer.project_id || null
  const taskId = (formData.get('task_id') as string) || timer.task_id || null
  const dateStr = startedAt.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })

  const { error: insertError } = await supabase.from('time_entries').insert({
    user_id: user.id,
    date: dateStr,
    work_category: formData.get('work_category') as string,
    project_id: projectId,
    task_id: taskId,
    description: (formData.get('description') as string) || null,
    started_at: timer.started_at,
    ended_at: endedAt.toISOString(),
    duration_hours: durationHours,
  })

  if (insertError) return { error: insertError.message }

  // タイマー削除
  await supabase.from('active_timers').delete().eq('user_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/time')
  return { success: true }
}
