'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProject, updateProject } from '@/lib/actions/projects'
import { toast } from 'sonner'
import type { Project } from '@/types'

interface ProjectFormProps {
  project?: Project
  onSuccess?: () => void
}

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = project
        ? await updateProject(project.id, formData)
        : await createProject(formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(project ? '案件を更新しました' : '案件を登録しました')
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>案件名 *</Label>
        <Input
          name="name"
          defaultValue={project?.name ?? ''}
          placeholder="案件名を入力"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>案件種別 *</Label>
        <Select name="type" defaultValue={project?.type ?? 'project'} required>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project">PJ案件</SelectItem>
            <SelectItem value="approval">都度稟議案件</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {project && (
        <div className="space-y-2">
          <Label>ステータス *</Label>
          <Select name="status" defaultValue={project.status} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">進行中</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
              <SelectItem value="suspended">停止</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>予算工数 (h)</Label>
        <Input
          name="budget_hours"
          type="number"
          min={0}
          step={0.25}
          defaultValue={project?.budget_hours ?? ''}
          placeholder="例: 100"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>開始予定日</Label>
          <Input
            name="start_date"
            type="date"
            defaultValue={project?.start_date ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label>終了予定日</Label>
          <Input
            name="end_date"
            type="date"
            defaultValue={project?.end_date ?? ''}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>メモ</Label>
        <Input
          name="description"
          defaultValue={project?.description ?? ''}
          placeholder="メモを入力（任意）"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? '保存中...' : project ? '更新' : '登録'}
        </Button>
      </div>
    </form>
  )
}
