import { getCurrentUser, getTimeEntries, getProjects } from '@/lib/queries'
import { EntryList } from '@/components/time-entries/entry-list'
import { EntryForm } from '@/components/time-entries/entry-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { todayJst } from '@/lib/utils'
import { redirect } from 'next/navigation'

function getMonthRange(yearMonth?: string): { from: string; to: string } {
  const target = yearMonth
    ? new Date(yearMonth + '-01')
    : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))

  const year = target.getFullYear()
  const month = target.getMonth()
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')

  const { month } = await searchParams
  const { from, to } = getMonthRange(month)
  const isAdmin = profile.role === 'super_admin' || profile.role === 'admin'

  const [entries, projects] = await Promise.all([
    getTimeEntries({ userId: isAdmin ? undefined : profile.id, dateFrom: from, dateTo: to }),
    getProjects(),
  ])

  const projectOptions = projects.map(p => ({ id: p.id, name: p.name }))
  const currentYearMonth = from.slice(0, 7)
  const prevMonth = new Date(new Date(from).setMonth(new Date(from).getMonth() - 1))
    .toLocaleDateString('sv-SE').slice(0, 7)
  const nextMonth = new Date(new Date(from).setMonth(new Date(from).getMonth() + 1))
    .toLocaleDateString('sv-SE').slice(0, 7)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">稼働記録</h1>

      {/* 手動追加フォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">稼働を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm projects={projectOptions} />
        </CardContent>
      </Card>

      {/* 月切り替え */}
      <div className="flex items-center gap-4">
        <a
          href={`/time?month=${prevMonth}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 前月
        </a>
        <span className="font-semibold">{currentYearMonth.replace('-', '年')}月</span>
        <a
          href={`/time?month=${nextMonth}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          翌月 →
        </a>
      </div>

      {/* 稼働記録一覧 */}
      <EntryList
        entries={entries as any}
        projects={projectOptions}
        currentUserId={profile.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
