'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjectForm } from '@/components/projects/project-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDuration, formatPercent } from '@/lib/utils'
import { archiveProject } from '@/lib/actions/projects'
import { toast } from 'sonner'
import type { Project, TimeEntry, Profile } from '@se-worktime/database'

const STATUS_LABEL: Record<string, string> = {
  active: '進行中',
  completed: '完了',
  suspended: '停止',
}

const TYPE_LABEL: Record<string, string> = {
  project: 'PJ案件',
  approval: '都度稟議案件',
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project & { consumed_hours: number } | null>(null)
  const [entries, setEntries] = useState<(TimeEntry & { profile: Pick<Profile, 'name'> })[]>([])
  const [myRole, setMyRole] = useState<string>('member')
  const [showEdit, setShowEdit] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [{ data: proj }, { data: ents }, { data: { user } }] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase
          .from('time_entries')
          .select('*, profile:profiles(name)')
          .eq('project_id', id)
          .is('deleted_at', null)
          .order('date', { ascending: false }),
        supabase.auth.getUser(),
      ])

      if (!proj) { router.push('/projects'); return }

      const consumed = (ents ?? []).reduce((sum: number, e: any) => sum + e.duration_hours, 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProject({ ...(proj as any), consumed_hours: consumed })
      setEntries((ents ?? []) as any)

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMyRole((profile as any)?.role ?? 'member')
      }
    }

    load()
  }, [id, router])

  const isAdmin = myRole === 'super_admin' || myRole === 'admin'

  async function handleArchive() {
    if (!project) return
    const msg = project.archived ? 'アーカイブを解除しますか？' : 'この案件をアーカイブしますか？'
    if (!confirm(msg)) return
    startTransition(async () => {
      const result = await archiveProject(id, !project.archived)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(project.archived ? 'アーカイブを解除しました' : 'アーカイブしました')
        router.push('/projects')
      }
    })
  }

  if (!project) {
    return <div className="p-6 text-muted-foreground">読み込み中...</div>
  }

  const budgetPercent = project.budget_hours
    ? Math.min((project.consumed_hours / project.budget_hours) * 100, 100)
    : null

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="outline">{TYPE_LABEL[project.type]}</Badge>
          </div>
          <Badge>{STATUS_LABEL[project.status]}</Badge>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              編集
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isPending}
            >
              {project.archived ? 'アーカイブ解除' : 'アーカイブ'}
            </Button>
          </div>
        )}
      </div>

      {/* 予実管理 */}
      {project.budget_hours && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">予実管理</CardTitle>
          </CardHeader>
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
                    budgetPercent! >= 100
                      ? 'bg-destructive'
                      : budgetPercent! >= 80
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 案件情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">案件情報</CardTitle>
        </CardHeader>
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
          <CardTitle className="text-base">稼働記録（合計: {formatDuration(project.consumed_hours)}）</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">稼働記録なし</p>
          ) : (
            <div className="space-y-1">
              {entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-2">{entry.date}</span>
                    <span className="mr-2">{(entry as any).profile?.name}</span>
                    {entry.description && <span className="text-muted-foreground">{entry.description}</span>}
                  </div>
                  <span className="text-sm font-mono">{formatDuration(entry.duration_hours)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>案件を編集</DialogTitle>
          </DialogHeader>
          <ProjectForm project={project} onSuccess={() => { setShowEdit(false); router.refresh() }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
