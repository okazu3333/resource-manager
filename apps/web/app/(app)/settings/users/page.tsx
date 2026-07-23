import { redirect } from 'next/navigation'
import { getCurrentUser, getAllProfiles } from '@/lib/queries'
import { UserManagement } from './user-management'

export default async function UsersPage() {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')
  if (profile.role !== 'super_admin') redirect('/settings/profile')

  const profiles = await getAllProfiles()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">ユーザー管理</h1>
      <UserManagement profiles={profiles} currentUserId={profile.id} />
    </div>
  )
}
