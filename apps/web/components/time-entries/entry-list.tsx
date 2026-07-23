'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDuration, getDayOfWeek } from '@/lib/utils'
import { deleteTimeEntry } from '@/lib/actions/time-entries'
import { EntryForm } from './entry-form'
import { toast } from 'sonner'
import type { TimeEntry, Project, Profile } from '@/types'

type EntryWithRelations = TimeEntry & {
  project: Pick<Project, 'id' | 'name' | 'type'> | null
  profile: Pick<Profile, 'id' | 'name'>
}

interface EntryListProps {
  entries: EntryWithRelations[]
  projects: Pick<Project, 'id' | 'name'>[]
  currentUserId: string
  isAdmin: boolean
}

export function EntryList({ entries, projects, currentUserId, isAdmin }: EntryListProps) {
  const [editEntry, setEditEntry] = useState<EntryWithRelations | null>(null)

  // 日付ごとにグループ化
  const grouped = entries.reduce<Record<string, EntryWithRelations[]>>((acc, entry) => {
    const key = entry.date
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  async function handleDelete(id: string) {
    if (!confirm('この稼働記録を削除しますか？')) return
    const result = await deleteTimeEntry(id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('削除しました')
    }
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        稼働記録がありません
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dayEntries]) => {
            const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration_hours, 0)
            const dow = getDayOfWeek(date)
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 pb-1 border-b">
                  <span className="text-sm font-semibold">
                    {date.replace(/-/g, '/')} ({dow})
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">
                    合計 {formatDuration(dayTotal)}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEntries.map(entry => {
                    const canEdit = isAdmin || entry.user_id === currentUserId
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {entry.work_category}
                            </Badge>
                            {entry.project && (
                              <span className="text-sm text-muted-foreground truncate">
                                {entry.project.name}
                              </span>
                            )}
                            {isAdmin && (
                              <span className="text-xs text-muted-foreground">
                                ({entry.profile.name})
                              </span>
                            )}
                          </div>
                          {entry.description && (
                            <p className="text-sm mt-0.5 truncate">{entry.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-mono font-medium shrink-0">
                          {formatDuration(entry.duration_hours)}
                        </span>
                        {canEdit && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditEntry(entry)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
      </div>

      <Dialog open={!!editEntry} onOpenChange={open => !open && setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>稼働記録を編集</DialogTitle>
          </DialogHeader>
          {editEntry && (
            <EntryForm
              entry={editEntry}
              projects={projects}
              onSuccess={() => setEditEntry(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
