import { getCurrentUser, getTimeEntries, getProjects } from '@/lib/queries'
import { EntryList } from '@/components/time-entries/entry-list'
import { EntryForm } from '@/components/time-entries/entry-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getMonthRange(yearMonth?: string): { from: string; to: string; label: string } {
  const target = yearMonth
    ? new Date(yearMonth + '-01')
    : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const year = target.getFullYear()
  const month = target.getMonth()
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const label = `${year}年${month + 1}月`
  return { from, to, label }
}

function getWeekRange(dateStr?: string): { from: string; to: string; label: string } {
  const base = dateStr
    ? new Date(dateStr)
    : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const day = base.getDay()
  const monday = new Date(base)
  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('sv-SE')
  const labelFmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  return {
    from: fmt(monday),
    to: fmt(sunday),
    label: `${labelFmt(monday)} 〜 ${labelFmt(sunday)}`,
  }
}

function offsetWeek(dateStr: string, offset: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + offset * 7)
  return d.toLocaleDateString('sv-SE')
}

export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string; date?: string }>
}) {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')

  const params = await searchParams
  const view = params.view === 'week' ? 'week' : 'month'
  const isAdmin = profile.role === 'super_admin' || profile.role === 'admin'

  let from: string, to: string, label: string
  let prevLink: string, nextLink: string

  if (view === 'week') {
    const range = getWeekRange(params.date)
    from = range.from
    to = range.to
    label = range.label
    prevLink = `/time?view=week&date=${offsetWeek(from, -1)}`
    nextLink = `/time?view=week&date=${offsetWeek(from, 1)}`
  } else {
    const range = getMonthRange(params.month)
    from = range.from
    to = range.to
    label = range.label
    const prevMonth = new Date(new Date(from).setMonth(new Date(from).getMonth() - 1))
      .toLocaleDateString('sv-SE').slice(0, 7)
    const nextMonth = new Date(new Date(from).setMonth(new Date(from).getMonth() + 1))
      .toLocaleDateString('sv-SE').slice(0, 7)
    prevLink = `/time?month=${prevMonth}`
    nextLink = `/time?month=${nextMonth}`
  }

  const [entries, projects] = await Promise.all([
    getTimeEntries({ userId: isAdmin ? undefined : profile.id, dateFrom: from, dateTo: to }),
    getProjects(),
  ])

  const projectOptions = projects.map(p => ({ id: p.id, name: p.name }))
  const totalHours = entries.reduce((sum, e) => sum + e.duration_hours, 0)
  const totalH = Math.floor(totalHours)
  const totalM = Math.round((totalHours % 1) * 60)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">稼働記録</h1>

      {/* 手動追加フォーム */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">稼働を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm projects={projectOptions} />
        </CardContent>
      </Card>

      {/* 期間切り替えバー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Link
            href={`/time?${params.month ? `month=${params.month}` : ''}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'month'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            月
          </Link>
          <Link
            href={`/time?view=week${params.date ? `&date=${params.date}` : ''}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'week'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            週
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href={prevLink} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="text-center">
            <span className="font-semibold text-sm">{label}</span>
            <span className="text-xs text-muted-foreground ml-2">
              合計 {totalH}h{totalM > 0 ? `${totalM}m` : ''}
            </span>
          </div>
          <Link href={nextLink} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
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
