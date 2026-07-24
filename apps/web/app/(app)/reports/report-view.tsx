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
import type { Project, Profile, TimeEntry } from '@/types'

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

const CATEGORY_COLORS: Record<string, string> = {
  '生産稼働（開発）':           'bg-blue-500',
  '保守稼働（調査/問合せ対応）': 'bg-orange-400',
  '保守稼働（開発）':           'bg-amber-400',
  '社/本部/部内の仕事':         'bg-violet-500',
  'イベント':                   'bg-emerald-500',
  '休暇':                       'bg-slate-400',
}

const CATEGORY_TEXT: Record<string, string> = {
  '生産稼働（開発）':           'text-blue-600',
  '保守稼働（調査/問合せ対応）': 'text-orange-500',
  '保守稼働（開発）':           'text-amber-500',
  '社/本部/部内の仕事':         'text-violet-600',
  'イベント':                   'text-emerald-600',
  '休暇':                       'text-slate-500',
}

// 日ごとの集計
function groupByDate(entries: EntryWithRelations[]) {
  const map: Record<string, number> = {}
  for (const e of entries) {
    map[e.date] = (map[e.date] ?? 0) + e.duration_hours
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
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

  function handleCsvExport() {
    const header = ['名前', '日付', '曜日', '稼働分類', 'PJ/サービス', '内容', '稼働実績(h)', '稼働実績(分)', '工数']
    const rows = entries.map(e => {
      const totalMin = Math.round(e.duration_hours * 60)
      return [
        e.profile.name,
        e.date.replace(/-/g, '/'),
        getDayOfWeek(e.date),
        e.work_category,
        e.project?.name ?? '-',
        e.description ?? '',
        e.duration_hours,
        totalMin,
        e.duration_hours.toFixed(2),
      ]
    })
    const csv = [header, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `稼働記録_${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 集計
  const totalHours = entries.reduce((sum, e) => sum + e.duration_hours, 0)
  const workingDays = new Set(entries.map(e => e.date)).size
  const avgPerDay = workingDays > 0 ? totalHours / workingDays : 0

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
    if (!acc[e.user_id]) acc[e.user_id] = { name: e.profile.name, hours: 0 }
    acc[e.user_id].hours += e.duration_hours
    return acc
  }, {})

  const dailyData = groupByDate(entries)
  const maxDailyHours = Math.max(...dailyData.map(([, h]) => h), 1)

  const sortedCategories = Object.entries(byCategory).sort(([, a], [, b]) => b - a)
  const sortedProjects = Object.entries(byProject).sort(([, a], [, b]) => b.hours - a.hours)
  const sortedMembers = Object.entries(byMember).sort(([, a], [, b]) => b.hours - a.hours)

  return (
    <div className="p-6 space-y-6">

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">レポート</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{from} 〜 {to}</p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={handleCsvExport}>
            CSVエクスポート
          </Button>
        )}
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">開始日</Label>
              <Input type="date" className="h-8 text-sm w-36" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">終了日</Label>
              <Input type="date" className="h-8 text-sm w-36" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            </div>
            {isAdmin && (
              <div className="space-y-1">
                <Label className="text-xs">メンバー</Label>
                <Select value={filterUser} onValueChange={v => setFilterUser(v ?? '')}>
                  <SelectTrigger className="h-8 text-sm w-36">
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
                <SelectTrigger className="h-8 text-sm w-40">
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
            <Button type="submit" size="sm" className="h-8">適用</Button>
          </form>
        </CardContent>
      </Card>

      {/* KPI カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">総稼働時間</p>
            <p className="text-3xl font-bold mt-1">{formatDuration(totalHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">稼働件数</p>
            <p className="text-3xl font-bold mt-1">{entries.length}<span className="text-base font-normal text-muted-foreground ml-1">件</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">稼働日数</p>
            <p className="text-3xl font-bold mt-1">{workingDays}<span className="text-base font-normal text-muted-foreground ml-1">日</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">1日平均</p>
            <p className="text-3xl font-bold mt-1">{formatDuration(avgPerDay)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 日別トレンド */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">日別稼働</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyData.map(([date, hours]) => (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 shrink-0">
                    {date.replace(/-/g, '/')} ({getDayOfWeek(date)})
                  </span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(hours / maxDailyHours) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-14 text-right shrink-0">{formatDuration(hours)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* 稼働分類別 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">稼働分類別</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">データなし</p>
            ) : (
              <>
                {/* 積み上げバー */}
                <div className="flex h-3 rounded-full overflow-hidden mb-4">
                  {sortedCategories.map(([cat, hours]) => (
                    <div
                      key={cat}
                      className={`${CATEGORY_COLORS[cat] ?? 'bg-gray-400'} transition-all`}
                      style={{ width: `${totalHours > 0 ? (hours / totalHours) * 100 : 0}%` }}
                      title={`${cat}: ${formatDuration(hours)}`}
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  {sortedCategories.map(([cat, hours]) => (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_COLORS[cat] ?? 'bg-gray-400'}`} />
                          <span className={`text-xs font-medium ${CATEGORY_TEXT[cat] ?? ''}`}>{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono">{formatDuration(hours)}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {totalHours > 0 ? ((hours / totalHours) * 100).toFixed(1) + '%' : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${CATEGORY_COLORS[cat] ?? 'bg-gray-400'} rounded-full`}
                          style={{ width: `${totalHours > 0 ? (hours / totalHours) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* 案件別 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">案件別</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">データなし</p>
              ) : (
                <div className="space-y-2">
                  {sortedProjects.map(([key, { name, hours }]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs truncate max-w-[60%]">{name}</span>
                        <span className="text-xs font-mono">{formatDuration(hours)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${totalHours > 0 ? (hours / totalHours) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* メンバー別（管理者のみ・複数人時） */}
          {isAdmin && sortedMembers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">メンバー別</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sortedMembers.map(([uid, { name, hours }]) => (
                    <div key={uid}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">{name}</span>
                        <span className="text-xs font-mono">{formatDuration(hours)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${totalHours > 0 ? (hours / totalHours) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 明細一覧 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">稼働明細</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">データなし</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">日付</TableHead>
                  {isAdmin && <TableHead className="text-xs">メンバー</TableHead>}
                  <TableHead className="text-xs">分類</TableHead>
                  <TableHead className="text-xs">案件</TableHead>
                  <TableHead className="text-xs">内容</TableHead>
                  <TableHead className="text-xs text-right">時間</TableHead>
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
                      <span className={`text-xs font-medium ${CATEGORY_TEXT[entry.work_category] ?? ''}`}>
                        {entry.work_category}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.project?.name ?? '-'}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">{entry.description ?? ''}</TableCell>
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
