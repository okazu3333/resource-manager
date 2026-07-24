'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjectForm } from '@/components/projects/project-form'
import { archiveProject } from '@/lib/actions/projects'
import { toast } from 'sonner'
import type { Project } from '@/types'

interface ProjectActionsProps {
  project: Project & { consumed_hours: number }
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleArchive() {
    const msg = project.archived ? 'アーカイブを解除しますか？' : 'この案件をアーカイブしますか？'
    if (!confirm(msg)) return
    startTransition(async () => {
      const result = await archiveProject(project.id, !project.archived)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(project.archived ? 'アーカイブを解除しました' : 'アーカイブしました')
        router.push('/projects')
      }
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>編集</Button>
        <Button variant="outline" size="sm" onClick={handleArchive} disabled={isPending}>
          {project.archived ? 'アーカイブ解除' : 'アーカイブ'}
        </Button>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>案件を編集</DialogTitle></DialogHeader>
          <ProjectForm project={project} onSuccess={() => { setShowEdit(false); router.refresh() }} />
        </DialogContent>
      </Dialog>
    </>
  )
}
