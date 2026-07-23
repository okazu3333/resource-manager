import Link from 'next/link'
import { getCurrentUser, getProjects } from '@/lib/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'

const STATUS_LABEL: Record<string, string> = {
  active: '進行中',
  completed: '完了',
  suspended: '停止',
}

const TYPE_LABEL: Record<string, string> = {
  project: 'PJ案件',
  approval: '都度稟議',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  completed: 'secondary',
  suspended: 'outline',
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>
}) {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')

  const { archived } = await searchParams
  const showArchived = archived === '1'
  const isAdmin = profile.role === 'super_admin' || profile.role === 'admin'

  const projects = await getProjects({ includeArchived: showArchived })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">案件</h1>
        {isAdmin && (
          <Link href="/projects/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              案件登録
            </Button>
          </Link>
        )}
      </div>

      {/* アーカイブ切り替え */}
      <div className="flex gap-2 text-sm">
        <a
          href="/projects"
          className={!showArchived ? 'font-semibold underline' : 'text-muted-foreground hover:text-foreground'}
        >
          進行中
        </a>
        <span className="text-muted-foreground">/</span>
        <a
          href="/projects?archived=1"
          className={showArchived ? 'font-semibold underline' : 'text-muted-foreground hover:text-foreground'}
        >
          アーカイブ
        </a>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          案件がありません
        </p>
      ) : (
        <div className="space-y-2">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABEL[project.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {project.start_date && <span>{project.start_date} 〜</span>}
                      {project.end_date && <span>{project.end_date}</span>}
                      {project.budget_hours && <span>予算: {project.budget_hours}h</span>}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[project.status]}>
                    {STATUS_LABEL[project.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
