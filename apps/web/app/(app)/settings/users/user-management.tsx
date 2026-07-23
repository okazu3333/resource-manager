'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { inviteUser } from '@/lib/actions/auth'
import { updateUserRole, toggleUserActive } from '@/lib/actions/users'
import { toast } from 'sonner'
import type { Profile } from '@se-worktime/database'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'スーパーユーザー',
  admin: '管理者',
  member: 'メンバー',
}

interface UserManagementProps {
  profiles: Profile[]
  currentUserId: string
}

export function UserManagement({ profiles, currentUserId }: UserManagementProps) {
  const [showInvite, setShowInvite] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await inviteUser(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('招待メールを送信しました')
        setShowInvite(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  async function handleRoleChange(userId: string, role: string) {
    startTransition(async () => {
      const result = await updateUserRole(userId, role)
      if (result?.error) toast.error(result.error)
      else toast.success('ロールを変更しました')
    })
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    const msg = isActive ? 'このユーザーを無効化しますか？' : 'このユーザーを有効化しますか？'
    if (!confirm(msg)) return
    startTransition(async () => {
      const result = await toggleUserActive(userId, !isActive)
      if (result?.error) toast.error(result.error)
      else toast.success(isActive ? '無効化しました' : '有効化しました')
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowInvite(true)}>
          ユーザーを招待
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>メール</TableHead>
                <TableHead>ロール</TableHead>
                <TableHead>状態</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                  <TableCell>
                    {p.id === currentUserId ? (
                      <Badge variant="outline">{ROLE_LABEL[p.role]}</Badge>
                    ) : (
                      <Select
                        defaultValue={p.role}
                        onValueChange={role => role && handleRoleChange(p.id, role)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">スーパーユーザー</SelectItem>
                          <SelectItem value="admin">管理者</SelectItem>
                          <SelectItem value="member">メンバー</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? 'default' : 'secondary'}>
                      {p.is_active ? '有効' : '無効'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleToggleActive(p.id, p.is_active)}
                        disabled={isPending}
                      >
                        {p.is_active ? '無効化' : '有効化'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーを招待</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label>名前 *</Label>
              <Input name="name" placeholder="山田 太郎" required />
            </div>
            <div className="space-y-2">
              <Label>メールアドレス *</Label>
              <Input name="email" type="email" placeholder="user@example.com" required />
            </div>
            <div className="space-y-2">
              <Label>ロール *</Label>
              <Select name="role" defaultValue="member">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">スーパーユーザー</SelectItem>
                  <SelectItem value="admin">管理者</SelectItem>
                  <SelectItem value="member">メンバー</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              招待メールが送信されます。受信者がリンクをクリックしてパスワードを設定することでログインできます。
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '送信中...' : '招待メールを送信'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
