'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const project_id = formData.get('project_id') as string
  const name = formData.get('name') as string
  const backlog_issue_key = (formData.get('backlog_issue_key') as string) || null
  const backlog_issue_url = backlog_issue_key
    ? buildBacklogIssueUrl(backlog_issue_key)
    : null

  const { error } = await supabase
    .from('tasks')
    .insert({ project_id, name, backlog_issue_key, backlog_issue_url })

  if (error) return { error: error.message }
  revalidatePath(`/projects/${project_id}`)
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) return { error: error.message }
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

function buildBacklogIssueUrl(issueKey: string): string {
  const spaceId = process.env.BACKLOG_SPACE_ID
  if (!spaceId) return ''
  return `https://${spaceId}.backlog.com/view/${issueKey}`
}
