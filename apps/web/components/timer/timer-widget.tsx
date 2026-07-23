'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { startTimer, stopTimer } from '@/lib/actions/time-entries'
import { WORK_CATEGORIES } from '@se-worktime/database'
import { toast } from 'sonner'
import type { Project, ActiveTimer } from '@se-worktime/database'

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

interface TimerWidgetProps {
  initialTimer: (ActiveTimer & { project: Pick<Project, 'id' | 'name'> | null }) | null
  projects: Pick<Project, 'id' | 'name'>[]
}

export function TimerWidget({ initialTimer, projects }: TimerWidgetProps) {
  const [timer, setTimer] = useState(initialTimer)
  const [elapsed, setElapsed] = useState(0)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!timer) { setElapsed(0); return }
    const startedAt = new Date(timer.started_at).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timer])

  const handleStart = useCallback(async () => {
    setLoading(true)
    const result = await startTimer()
    if (result?.error) {
      toast.error(result.error)
    } else {
      setTimer({ user_id: '', started_at: new Date().toISOString(), project_id: null, project: null })
    }
    setLoading(false)
  }, [])

  async function handleStop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await stopTimer(formData)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('稼働を記録しました')
      setTimer(null)
      setShowStopDialog(false)
    }
    setLoading(false)
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
        {timer ? (
          <>
            <div className="font-mono text-3xl font-bold tabular-nums text-primary">
              {formatElapsed(elapsed)}
            </div>
            <div className="flex-1 text-sm text-muted-foreground">
              {timer.project?.name ?? '案件なし'}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowStopDialog(true)}
              disabled={loading}
            >
              <Square className="h-4 w-4 mr-1" />
              停止して記録
            </Button>
          </>
        ) : (
          <>
            <div className="font-mono text-3xl font-bold tabular-nums text-muted-foreground">
              00:00:00
            </div>
            <div className="flex-1 text-sm text-muted-foreground">タイマー停止中</div>
            <Button size="sm" onClick={handleStart} disabled={loading}>
              <Play className="h-4 w-4 mr-1" />
              開始
            </Button>
          </>
        )}
      </div>

      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>稼働を記録</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStop} className="space-y-4">
            <div className="space-y-2">
              <Label>稼働分類 *</Label>
              <Select name="work_category" required>
                <SelectTrigger>
                  <SelectValue placeholder="分類を選択" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>案件</Label>
              <Select name="project_id" defaultValue={timer?.project_id ?? ''}>
                <SelectTrigger>
                  <SelectValue placeholder="案件を選択（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">なし</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>作業内容</Label>
              <Input name="description" placeholder="作業内容を入力（任意）" />
            </div>
            <p className="text-sm text-muted-foreground">
              計測時間: <span className="font-mono font-bold">{formatElapsed(elapsed)}</span>
              （15分単位で自動丸め）
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowStopDialog(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '記録する'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
