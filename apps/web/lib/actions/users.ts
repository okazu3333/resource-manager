'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/queries'

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function updateUserName(userId: string, name: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const me = await getCurrentUser()
  if (me?.role !== 'super_admin') return { error: '権限がありません' }
  if (me.id === userId) return { error: '自分自身は削除できません' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const { error } = await supabase
    .from('profiles')
    .update({ name: formData.get('name') as string })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings/profile')
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}
