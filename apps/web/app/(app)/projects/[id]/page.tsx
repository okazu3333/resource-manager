import { redirect } from 'next/navigation'
import { getCurrentUser, getProjectWithStats, getProjectEntries, getProjectTasks } from '@/lib/queries'
import { TaskPanel } from '@/components/tasks/task-panel'
import { ProjectActions } from '@/components/projects/project-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDuration, formatPercent } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  active: '進行中',
  completed: '完了',
  suspended: '停止',
}

const TYPE_LABEL: Record<string, string> = {
  project: 'PJ案件',
  approval: '都度稟議案件',
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [profile, project, entries, tasks] = await Promise.all([
    getCurrentUser(),
    getProjectWithStats(id),
    getProjectEntries(id),
    getProjectTasks(id),
  ])

  if (!profile) redirect('/login')
  if (!project) redirect('/projects')

  const isAdmin = profile.role === 'super_admin' || profile.role === 'admin'
  const backlogEnabled = !!process.env.NEXT_PUBLIC_BACKLOG_SPACE_ID

  const budgetPercent = project.budget_hours
    ? Math.min((project.consumed_hours / project.budget_hours) * 100, 100)
    : null

  // メンバー別集計
  const byMember = entries.reduce<Record<string, { name: string; hours: number }>>(
    (acc, e) => {
      const pid = e.profile.id
      if (!acc[pid]) acc[pid] = { name: e.profile.name, hours: 0 }
      acc[pid].hours += e.duration_hours
      return acc
    },
    {},
  )
  const memberRows = Object.values(byMember).sort((a, b) => b.hours - a.hours)

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="outline">{TYPE_LABEL[project.type]}</Badge>
          </div>
          <Badge>{STATUS_LABEL[project.status]}</Badge>
        </div>
        {isAdmin && <ProjectActions project={project} />}
      </div>

      {/* 予実管理 */}
      {project.budget_hours && (
        <Card>
          <CardHeader><CardTitle className="text-base">予実管理</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">予算工数</p>
                <p className="text-xl font-bold">{formatDuration(project.budget_hours)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">消化工数</p>
                <p className="text-xl font-bold">{formatDuration(project.consumed_hours)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">残工数</p>
                <p className="text-xl font-bold">
                  {formatDuration(Math.max(0, project.budget_hours - project.consumed_hours))}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>消化率</span>
                <span>{formatPercent(project.consumed_hours, project.budget_hours)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetPercent! >= 100 ? 'bg-destructive'
                    : budgetPercent! >= 80  ? 'bg-yellow-500'
                    : 'bg-primary'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* メンバー別稼働 */}
      {memberRows.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">メンバー別稼働</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {memberRows.map(m => (
                <div key={m.name} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate">{m.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(m.hours / project.consumed_hours) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono w-16 text-right">{formatDuration(m.hours)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* タスク */}
      <TaskPanel
        projectId={id}
        tasks={tasks}
        isAdmin={isAdmin}
        backlogEnabled={backlogEnabled}
      />

      {/* 案件情報 */}
      <Card>
        <CardHeader><CardTitle className="text-base">案件情報</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {project.start_date && (
            <div className="flex gap-4">
              <span className="text-muted-foreground w-24">開始予定日</span>
              <span>{project.start_date}</span>
            </div>
          )}
          {project.end_date && (
            <div className="flex gap-4">
              <span className="text-muted-foreground w-24">終了予定日</span>
              <span>{project.end_date}</span>
            </div>
          )}
          {project.description && (
            <div className="flex gap-4">
              <span className="text-muted-foreground w-24">メモ</span>
              <span>{project.description}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 稼働記録 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            稼働記録（合計: {formatDuration(project.consumed_hours)}）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">稼働記録なし</p>
          ) : (
            <div className="space-y-1">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="text-sm flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground">{entry.date}</span>
                    <span>{entry.profile.name}</span>
                    {entry.task && (
                      <Badge variant="outline" className="text-xs">{entry.task.name}</Badge>
                    )}
                    {entry.description && (
                      <span className="text-muted-foreground">{entry.description}</span>
                    )}
                  </div>
                  <span className="text-sm font-mono shrink-0">{formatDuration(entry.duration_hours)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
