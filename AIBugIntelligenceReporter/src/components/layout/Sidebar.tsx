import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, History, Bug, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useHistoryStore } from '@/store/historyStore'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

const navItems = [
  { to: '/', icon: Upload, label: 'Analyze', exact: true },
  { to: '/history', icon: History, label: 'History' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const reportCount = useHistoryStore((s) => s.reports.length)

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 60 : 220 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-full flex-col border-r border-white/[0.06] bg-[#111113]"
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-white/[0.06] px-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
          <Bug className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="ml-2.5 min-w-0"
            >
              <p className="truncate text-sm font-semibold text-white">BugLens</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Zap className="h-2.5 w-2.5 text-violet-400" />
                <span className="text-[10px] text-white/40 font-medium">AI-Powered</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Tooltip key={to} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 truncate"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!sidebarCollapsed && label === 'History' && reportCount > 0 && (
                  <Badge variant="violet" className="ml-auto py-0 px-1.5 text-[10px]">
                    {reportCount}
                  </Badge>
                )}
              </NavLink>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right">{label}</TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/[0.06] p-2">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-full items-center justify-center rounded-lg text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  )
}
