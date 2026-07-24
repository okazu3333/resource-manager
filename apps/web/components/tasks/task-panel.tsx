'use client'

import { useState, useMemo, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createTask, updateTaskStatus, deleteTask } from '@/lib/actions/tasks'
import { searchBacklogIssues, type BacklogIssue } from '@/lib/actions/backlog'
import { toast } from 'sonner'
import { Plus, ExternalLink, Search, X, CheckCircle2, Circle, Clock } from 'lucide-react'
import type { Task } from '@/types'

const STATUS_CONFIG = {
  open:        { label: '未着手', icon: Circle,        class: 'text-slate-400' },
  in_progress: { label: '進行中', icon: Clock,         class: 'text-blue-500' },
  closed:      { label: '完了',   icon: CheckCircle2,  class: 'text-emerald-500' },
} as const

interface TaskPanelProps {
  projectId: string
  tasks: Task[]
  isAdmin: boolean
  backlogEnabled: boolean
}

export function TaskPanel({ projectId, tasks, isAdmin, backlogEnabled }: TaskPanelProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [backlogKeyword, setBacklogKeyword] = useState('')
  const [backlogResults, setBacklogResults] = useState<BacklogIssue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<BacklogIssue | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSearch() {
    if (!backlogKeyword.trim()) return
    setIsSearching(true)
    const results = await searchBacklogIssues(backlogKeyword)
    setBacklogResults(results)
    setIsSearching(false)
  }

  function handleSelectIssue(issue: BacklogIssue) {
    setSelectedIssue(issue)
    if (!taskName) setTaskName(issue.summary)
    setBacklogResults([])
  }

  async function handleCreate() {
    if (!taskName.trim()) return
    const fd = new FormData()
    fd.append('project_id', projectId)
    fd.append('name', taskName.trim())
    if (selectedIssue) fd.append('backlog_issue_key', selectedIssue.issueKey)

    startTransition(async () => {
      const result = await createTask(fd)
      if (result?.error) toast.error(result.error)
      else {
        toast.success('タスクを追加しました')
        setShowAdd(false)
        setTaskName('')
        setSelectedIssue(null)
        setBacklogKeyword('')
      }
    })
  }

  async function handleStatusChange(task: Task) {
    const next = task.status === 'open' ? 'in_progress'
      : task.status === 'in_progress' ? 'closed'
      : 'open'
    startTransition(async () => {
      const result = await updateTaskStatus(task.id, next, projectId)
      if (result?.error) toast.error(result.error)
    })
  }

  async function handleDelete(taskId: string) {
    if (!confirm('このタスクを削除しますか？')) return
    startTransition(async () => {
      const result = await deleteTask(taskId, projectId)
      if (result?.error) toast.error(result.error)
      else toast.success('削除しました')
    })
  }

  const openTasks = useMemo(() => tasks.filter(t => t.status !== 'closed'), [tasks])
  const closedTasks = useMemo(() => tasks.filter(t => t.status === 'closed'), [tasks])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            タスク
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {openTasks.length}/{tasks.length}
            </span>
          </CardTitle>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(v => !v)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              追加
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 追加フォーム */}
        {showAdd && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <Input
              placeholder="タスク名 *"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
            />

            {backlogEnabled && (
              <div className="space-y-2">
                {selectedIssue ? (
                  <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded px-3 py-2">
                    <span className="font-mono text-xs text-blue-600">{selectedIssue.issueKey}</span>
                    <span className="flex-1 truncate">{selectedIssue.summary}</span>
                    <button onClick={() => setSelectedIssue(null)}>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Backlogチケット検索..."
                      value={backlogKeyword}
                      onChange={e => setBacklogKeyword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={handleSearch} disabled={isSearching}>
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {backlogResults.length > 0 && (
                  <div className="border rounded-md overflow-hidden max-h-48 overflow-y-auto">
                    {backlogResults.map(issue => (
                      <button
                        key={issue.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                        onClick={() => handleSelectIssue(issue)}
                      >
                        <span className="font-mono text-xs text-blue-600 mr-2">{issue.issueKey}</span>
                        <span className="truncate">{issue.summary}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{issue.status.name}</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setTaskName(''); setSelectedIssue(null); setBacklogKeyword(''); setBacklogResults([]) }}>
                キャンセル
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!taskName.trim() || isPending}>
                追加
              </Button>
            </div>
          </div>
        )}

        {/* タスク一覧 */}
        {tasks.length === 0 && !showAdd && (
          <p className="text-sm text-muted-foreground text-center py-4">タスクなし</p>
        )}

        <div className="space-y-1">
          {openTasks.map(task => {
            const cfg = STATUS_CONFIG[task.status]
            const Icon = cfg.icon
            return (
              <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 group">
                <button onClick={() => handleStatusChange(task)} title="ステータスを変更" disabled={isPending}>
                  <Icon className={`h-4 w-4 ${cfg.class}`} />
                </button>
                <span className="flex-1 text-sm">{task.name}</span>
                {task.backlog_issue_key && (
                  <a
                    href={task.backlog_issue_url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                    onClick={e => e.stopPropagation()}
                  >
                    {task.backlog_issue_key}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 完了タスク */}
        {closedTasks.length > 0 && (
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground py-1">
              完了済み {closedTasks.length}件
            </summary>
            <div className="space-y-1 mt-1">
              {closedTasks.map(task => {
                const Icon = STATUS_CONFIG.closed.icon
                return (
                  <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 group opacity-60">
                    <button onClick={() => handleStatusChange(task)} disabled={isPending}>
                      <Icon className="h-4 w-4 text-emerald-500" />
                    </button>
                    <span className="flex-1 text-sm line-through">{task.name}</span>
                    {task.backlog_issue_key && (
                      <span className="text-xs font-mono text-muted-foreground">{task.backlog_issue_key}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
