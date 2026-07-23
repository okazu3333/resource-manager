import { redirect } from 'next/navigation'
import { getCurrentUser, getReportData, getProjects, getAllProfiles } from '@/lib/queries'
import { ReportView } from './report-view'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    user_id?: string
    project_id?: string
  }>
}) {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')

  const params = await searchParams
  const isAdmin = profile.role === 'super_admin' || profile.role === 'admin'

  // デフォルト: 当月
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const from = params.from ?? defaultFrom
  const to = params.to ?? defaultTo
  const targetUserId = isAdmin ? params.user_id : profile.id

  const [entries, projects, profiles] = await Promise.all([
    getReportData({ dateFrom: from, dateTo: to, userId: targetUserId, projectId: params.project_id }),
    getProjects({ includeArchived: true }),
    isAdmin ? getAllProfiles() : Promise.resolve([profile]),
  ])

  return (
    <ReportView
      entries={entries as any}
      projects={projects}
      profiles={profiles}
      currentUserId={profile.id}
      isAdmin={isAdmin}
      from={from}
      to={to}
      selectedUserId={targetUserId ?? ''}
      selectedProjectId={params.project_id ?? ''}
    />
  )
}
