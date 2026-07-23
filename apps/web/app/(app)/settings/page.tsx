import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/queries'

export default async function SettingsPage() {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')

  if (profile.role === 'super_admin' || profile.role === 'admin') {
    redirect('/settings/users')
  }
  redirect('/settings/profile')
}
