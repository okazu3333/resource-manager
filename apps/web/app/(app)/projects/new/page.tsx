import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/queries'
import { ProjectForm } from '@/components/projects/project-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewProjectPage() {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')
  if (profile.role === 'member') redirect('/projects')

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">案件登録</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">新規案件</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  )
}
