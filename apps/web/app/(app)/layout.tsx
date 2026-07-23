import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/queries'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUser()
  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
