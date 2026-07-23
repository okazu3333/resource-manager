'use client'

import { useState, useTransition } from 'react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { updateProfile, updatePassword } from '@/lib/actions/users'
import { toast } from 'sonner'
import type { Profile } from '@/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    })
  }, [])

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('プロフィールを更新しました')
      }
    })
  }

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const pw = formData.get('password') as string
    const confirm = formData.get('confirm') as string
    if (pw !== confirm) { toast.error('パスワードが一致しません'); return }
    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('パスワードを変更しました')
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  if (!profile) return <div className="p-6 text-muted-foreground">読み込み中...</div>

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">プロフィール設定</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>名前</Label>
              <Input name="name" defaultValue={profile.name} required />
            </div>
            <div className="space-y-2">
              <Label>メールアドレス</Label>
              <Input value={profile.email} disabled className="bg-muted" />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? '保存中...' : '更新'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">パスワード変更</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>新しいパスワード</Label>
              <Input name="password" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label>パスワード（確認）</Label>
              <Input name="confirm" type="password" required minLength={8} />
            </div>
            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending ? '変更中...' : 'パスワードを変更'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
