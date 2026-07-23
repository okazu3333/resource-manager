'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTimeEntry, updateTimeEntry } from '@/lib/actions/time-entries'
import { WORK_CATEGORIES } from '@/types'
import { toast } from 'sonner'
import { todayJst } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Project, TimeEntry, Task } from '@/types'

const MINUTE_OPTIONS = [0, 15, 30, 45]

interface EntryFormProps {
  projects: Pick<Project, 'id' | 'name'>[]
  entry?: TimeEntry & { project: Pick<Project, 'id' | 'name'> | null }
  onSuccess?: () => void
}

export function EntryForm({ projects, entry, onSuccess }: EntryFormProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedProjectId, setSelectedProjectId] = useState(entry?.project_id ?? '')
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState(entry?.task_id ?? '')

  const defaultHours = entry ? Math.floor(entry.duration_hours) : 0
  const defaultMinutes = entry ? Math.round((entry.duration_hours % 1) * 60) : 0

  // プロジェクト選択時にそのタスクを取得
  useEffect(() => {
    if (!selectedProjectId) { setTasks([]); setSelectedTaskId(''); return }
    const supabase = createClient()
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', selectedProjectId)
      .neq('status', 'closed')
      .order('created_at')
      .then(({ data }) => {
        setTasks((data ?? []) as Task[])
        // 編集時にタスクが現在のプロジェクトに属さなければリセット
        if (entry?.task_id && !data?.find(t => t.id === entry.task_id)) {
          setSelectedTaskId('')
        }
      })
  }, [selectedProjectId, entry?.task_id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (selectedTaskId) formData.set('task_id', selectedTaskId)

    startTransition(async () => {
      const result = entry
        ? await updateTimeEntry(entry.id, formData)
        : await createTimeEntry(formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(entry ? '稼働を更新しました' : '稼働を記録しました')
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>日付 *</Label>
          <Input
            name="date"
            type="date"
            defaultValue={entry?.date ?? todayJst()}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>稼働時間 *</Label>
          <div className="flex items-center gap-2">
            <Input
              name="hours"
              type="number"
              min={0}
              max={24}
              defaultValue={defaultHours}
              className="w-16 text-center"
              required
            />
            <span className="text-sm shrink-0">時間</span>
            <Select name="minutes" defaultValue={String(defaultMinutes)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTE_OPTIONS.map(m => (
                  <SelectItem key={m} value={String(m)}>{m}分</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>稼働分類 *</Label>
        <Select name="work_category" defaultValue={entry?.work_category} required>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>案件</Label>
          <Select
            name="project_id"
            value={selectedProjectId}
            onValueChange={v => { setSelectedProjectId(v ?? ''); setSelectedTaskId('') }}
          >
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
          <Label>タスク</Label>
          <Select
            value={selectedTaskId}
            onValueChange={v => setSelectedTaskId(v ?? '')}
            disabled={!selectedProjectId || tasks.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={tasks.length === 0 ? 'タスクなし' : 'タスクを選択'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">なし</SelectItem>
              {tasks.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>作業内容</Label>
        <Input
          name="description"
          defaultValue={entry?.description ?? ''}
          placeholder="作業内容を入力（任意）"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中...' : entry ? '更新' : '記録する'}
        </Button>
      </div>
    </form>
  )
}
