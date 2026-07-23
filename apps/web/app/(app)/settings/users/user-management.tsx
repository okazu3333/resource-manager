'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { inviteUser } from '@/lib/actions/auth'
import { updateUserRole, toggleUserActive, updateUserName, deleteUser } from '@/lib/actions/users'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import type { Profile } from '@/types'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'スーパーユーザー',
  admin: '管理者',
  member: 'メンバー',
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-violet-100 text-violet-700 border-violet-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-slate-100 text-slate-600 border-slate-200',
}

interface UserManagementProps {
  profiles: Profile[]
  currentUserId: string
}

export function UserManagement({ profiles, currentUserId }: UserManagementProps) {
  const [showInvite, setShowInvite] = useState(false)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [editName, setEditName] = useState('')
  const [isPending, startTransition] = useTransition()

  function openEdit(p: Profile) {
    setEditTarget(p)
    setEditName(p.name)
  }

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

  async function handleNameSave() {
    if (!editTarget || !editName.trim()) return
    startTransition(async () => {
      const result = await updateUserName(editTarget.id, editName.trim())
      if (result?.error) toast.error(result.error)
      else {
        toast.success('名前を更新しました')
        setEditTarget(null)
      }
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteUser(deleteTarget.id)
      if (result?.error) toast.error(result.error)
      else {
        toast.success('ユーザーを削除しました')
        setDeleteTarget(null)
      }
    })
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
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
        <CardContent className="pt-4 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">ユーザー</TableHead>
                <TableHead>ロール</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="text-right pr-4">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {p.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.id === currentUserId ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_BADGE[p.role]}`}>
                        {ROLE_LABEL[p.role]}
                      </span>
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
                    <Badge
                      variant="outline"
                      className={p.is_active
                        ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                        : 'text-slate-400 border-slate-200 bg-slate-50'
                      }
                    >
                      {p.is_active ? '有効' : '無効'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(p)}
                        title="名前を編集"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {p.id !== currentUserId && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => handleToggleActive(p.id, p.is_active)}
                            disabled={isPending}
                          >
                            {p.is_active ? '無効化' : '有効化'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(p)}
                            title="削除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 招待ダイアログ */}
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
              <Label>ロール</Label>
              <Select name="role" defaultValue="member">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">スーパーユーザー</SelectItem>
                  <SelectItem value="admin">管理者</SelectItem>
                  <SelectItem value="member">メンバー</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              招待メールが送信されます。受信者がリンクからパスワードを設定するとログインできます。
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>キャンセル</Button>
              <Button type="submit" disabled={isPending}>{isPending ? '送信中...' : '招待する'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 名前編集ダイアログ */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>名前を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>名前</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>キャンセル</Button>
              <Button onClick={handleNameSave} disabled={isPending || !editName.trim()}>
                {isPending ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーを削除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{deleteTarget?.name}</span> を削除しますか？<br />
            この操作は取り消せません。稼働記録は残りますがログインできなくなります。
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? '削除中...' : '削除する'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
