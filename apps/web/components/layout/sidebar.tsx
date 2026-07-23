'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  BarChart3,
  Users,
  LogOut,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/time', label: '稼働記録', icon: Clock },
  { href: '/projects', label: '案件', icon: FolderKanban },
  { href: '/reports', label: 'レポート', icon: BarChart3 },
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
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      pathname.startsWith(href)
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
    )

  return (
    <aside className="w-56 flex flex-col bg-sidebar min-h-screen">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <h1 className="font-bold text-base tracking-tight text-sidebar-foreground">SE稼働管理</h1>
        <p className="text-xs text-sidebar-foreground/50 mt-0.5">Resource Manager</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">管理</p>
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          href="/settings/profile"
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group w-full"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {profile.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{profile.name}</p>
            <p className="text-xs truncate text-sidebar-foreground/50">{profile.email}</p>
          </div>
          <UserCog className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 shrink-0" />
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors mt-1"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
