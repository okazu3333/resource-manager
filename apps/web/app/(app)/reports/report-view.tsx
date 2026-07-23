'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDuration, getDayOfWeek } from '@/lib/utils'
import type { Project, Profile, TimeEntry } from '@se-worktime/database'

type EntryWithRelations = TimeEntry & {
  project: Pick<Project, 'id' | 'name' | 'type'> | null
  profile: Pick<Profile, 'id' | 'name'>
}

interface ReportViewProps {
  entries: EntryWithRelations[]
  projects: Project[]
  profiles: Profile[]
  currentUserId: string
  isAdmin: boolean
  from: string
  to: string
  selectedUserId: string
  selectedProjectId: string
}

export function ReportView({
  entries,
  projects,
  profiles,
  isAdmin,
  from,
  to,
  selectedUserId,
  selectedProjectId,
}: ReportViewProps) {
  const router = useRouter()
  const [filterFrom, setFilterFrom] = useState(from)
  const [filterTo, setFilterTo] = useState(to)
  const [filterUser, setFilterUser] = useState(selectedUserId)
  const [filterProject, setFilterProject] = useState(selectedProjectId)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('from', filterFrom)
    params.set('to', filterTo)
    if (filterUser) params.set('user_id', filterUser)
    if (filterProject) params.set('project_id', filterProject)
    router.push(`/reports?${params.toString()}`)
  }

  // 集計
  const totalHours = entries.reduce((sum, e) => sum + e.duration_hours, 0)

  const byCategory = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.work_category] = (acc[e.work_category] ?? 0) + e.duration_hours
    return acc
  }, {})

  const byProject = entries.reduce<Record<string, { name: string; hours: number }>>((acc, e) => {
    const key = e.project_id ?? '__none__'
    if (!acc[key]) acc[key] = { name: e.project?.name ?? '（案件なし）', hours: 0 }
    acc[key].hours += e.duration_hours
    return acc
  }, {})

  const byMember = entries.reduce<Record<string, { name: string; hours: number }>>((acc, e) => {
    const key = e.user_id
    if (!acc[key]) acc[key] = { name: e.profile.name, hours: 0 }
    acc[key].hours += e.duration_hours
    return acc
  }, {})

  function handleCsvExport() {
    const header = ['名前', '日付', '曜日', '稼働分類', 'PJ/サービス', '内容', '稼働実績(h)']
    const rows = entries.map(e => [
      e.profile.name,
      e.date.replace(/-/g, '/'),
      getDayOfWeek(e.date),
      e.work_category,
      e.project?.name ?? '-',
      e.description ?? '',
      e.duration_hours,
    ])

    const csv = [header, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `稼働記録_${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">レポート</h1>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={handleCsvExport}>
            CSVエクスポート
          </Button>
        )}
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">開始日</Label>
              <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">終了日</Label>
              <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            </div>
            {isAdmin && (
              <div className="space-y-1">
                <Label className="text-xs">メンバー</Label>
                <Select value={filterUser} onValueChange={v => setFilterUser(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="全員" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全員</SelectItem>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">案件</Label>
              <Select value={filterProject} onValueChange={v => setFilterProject(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="全案件" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全案件</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 md:col-span-4 flex justify-end">
              <Button type="submit" size="sm">検索</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">総稼働時間</p>
            <p className="text-2xl font-bold">{formatDuration(totalHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">稼働件数</p>
            <p className="text-2xl font-bold">{entries.length}件</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">稼働日数</p>
            <p className="text-2xl font-bold">
              {new Set(entries.map(e => e.date)).size}日
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 稼働分類別 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">稼働分類別</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>分類</TableHead>
                  <TableHead className="text-right">時間</TableHead>
                  <TableHead className="text-right">割合</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, hours]) => (
                    <TableRow key={cat}>
                      <TableCell className="text-xs">{cat}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatDuration(hours)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {totalHours > 0 ? ((hours / totalHours) * 100).toFixed(1) + '%' : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 案件別 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">案件別</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>案件</TableHead>
                  <TableHead className="text-right">時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(byProject)
                  .sort(([, a], [, b]) => b.hours - a.hours)
                  .map(([key, { name, hours }]) => (
                    <TableRow key={key}>
                      <TableCell className="text-xs">{name}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatDuration(hours)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* メンバー別（管理者のみ） */}
      {isAdmin && Object.keys(byMember).length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">メンバー別</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>メンバー</TableHead>
                  <TableHead className="text-right">時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(byMember)
                  .sort(([, a], [, b]) => b.hours - a.hours)
                  .map(([uid, { name, hours }]) => (
                    <TableRow key={uid}>
                      <TableCell className="text-sm">{name}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatDuration(hours)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 明細一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">稼働明細</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">データなし</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  {isAdmin && <TableHead>メンバー</TableHead>}
                  <TableHead>分類</TableHead>
                  <TableHead>案件</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead className="text-right">時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {entry.date.replace(/-/g, '/')} ({getDayOfWeek(entry.date)})
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-xs">{entry.profile.name}</TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{entry.work_category}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{entry.project?.name ?? '-'}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{entry.description ?? ''}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatDuration(entry.duration_hours)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
