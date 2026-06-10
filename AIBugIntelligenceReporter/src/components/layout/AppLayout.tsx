import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <ErrorBoundary>
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'bg-[#1c1c21] border border-white/[0.08] text-white',
            description: 'text-white/60',
          },
        }}
      />
    </div>
  )
}
