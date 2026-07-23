'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  BarChart3,
  Settings,
  Users,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/time', label: '稼働記録', icon: Clock },
  { href: '/projects', label: '案件', icon: FolderKanban },
  { href: '/reports', label: 'レポート', icon: BarChart3 },
  { href: '/settings/profile', label: '設定', icon: Settings },
]

const adminItems = [
  { href: '/settings/users', label: 'ユーザー管理', icon: Users },
]

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile.role === 'super_admin' || profile.role === 'admin'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
      pathname.startsWith(href)
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    )

  return (
    <aside className="w-56 flex flex-col border-r bg-card min-h-screen">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg tracking-tight">SE稼働管理</h1>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">管理</p>
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {profile.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile.name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full px-1"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
