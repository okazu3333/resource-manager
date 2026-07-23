'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const budgetRaw = formData.get('budget_hours') as string
  const budget = budgetRaw ? Number(budgetRaw) : null

  const { error } = await supabase.from('projects').insert({
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    status: 'active',
    budget_hours: budget,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    description: (formData.get('description') as string) || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/projects')
  return { success: true }
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient()

  const budgetRaw = formData.get('budget_hours') as string
  const budget = budgetRaw ? Number(budgetRaw) : null

  const { error } = await supabase
    .from('projects')
    .update({
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      budget_hours: budget,
      start_date: (formData.get('start_date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  return { success: true }
}

export async function archiveProject(id: string, archived: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .update({ archived })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/projects')
  return { success: true }
}
