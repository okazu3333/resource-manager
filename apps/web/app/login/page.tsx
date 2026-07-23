'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: form.get('email') as string,
      password: form.get('password') as string,
    })

    if (error) {
      toast.error('ログインに失敗しました: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(
      form.get('email') as string,
      { redirectTo: `${window.location.origin}/auth/callback?next=/settings/profile` },
    )

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('パスワードリセットメールを送信しました')
      setShowReset(false)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">SE稼働管理</CardTitle>
          <CardDescription>
            {showReset ? 'パスワードリセット' : 'アカウントにログイン'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showReset ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
              >
                パスワードを忘れた方はこちら
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">メールアドレス</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '送信中...' : 'リセットメールを送信'}
              </Button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
              >
                ログインに戻る
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
