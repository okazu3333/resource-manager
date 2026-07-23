import { getCurrentUser, getActiveTimer, getTimeEntries, getProjects } from '@/lib/queries'
import { TimerWidget } from '@/components/timer/timer-widget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDuration, todayJst, getDayOfWeek } from '@/lib/utils'
import { redirect } from 'next/navigation'

function getWeekRange(): { from: string; to: string } {
  const now = new Date()
  const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const day = jstNow.getDay()
  const monday = new Date(jstNow)
  monday.setDate(jstNow.getDate() - (day === 0 ? 6 : day - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString('sv-SE')
  return { from: fmt(monday), to: fmt(sunday) }
}

export default async function DashboardPage() {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')
  const profileId = profile!.id

  const today = todayJst()
  const { from: weekFrom, to: weekTo } = getWeekRange()

  const [activeTimer, todayEntries, weekEntries, projects] = await Promise.all([
    getActiveTimer(),
    getTimeEntries({ userId: profileId, dateFrom: today, dateTo: today }),
    getTimeEntries({ userId: profileId, dateFrom: weekFrom, dateTo: weekTo }),
    getProjects(),
  ])

  const todayTotal = todayEntries.reduce((sum, e) => sum + e.duration_hours, 0)
  const weekTotal = weekEntries.reduce((sum, e) => sum + e.duration_hours, 0)

  const projectOptions = projects.map(p => ({ id: p.id, name: p.name }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {/* タイマー */}
      <TimerWidget initialTimer={activeTimer as any} projects={projectOptions} />

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本日の稼働</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatDuration(todayTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今週の稼働</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatDuration(weekTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 本日の稼働一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">本日の稼働記録</CardTitle>
        </CardHeader>
        <CardContent>
          {todayEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              本日の稼働記録はありません
            </p>
          ) : (
            <div className="space-y-2">
              {todayEntries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {entry.work_category}
                      </Badge>
                      {entry.project && (
                        <span className="text-sm text-muted-foreground">
                          {entry.project.name}
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                  </div>
                  <span className="text-sm font-mono font-medium">
                    {formatDuration(entry.duration_hours)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
