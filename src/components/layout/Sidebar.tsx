'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  History,
  MessageSquareText,
  Zap,
  Settings,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'positions',     label: 'Positions',      icon: Activity },
  { id: 'cycle-history', label: 'Cycle History',  icon: History },
  { id: 'agent-chat',    label: 'Agent Chat',     icon: MessageSquareText },
];

const bottomItems = [
  { id: 'analytics', label: 'Analytics',  icon: TrendingUp },
  { id: 'settings',  label: 'Settings',   icon: Settings },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      className="fixed left-0 top-14 bottom-0 w-[200px] z-40 flex flex-col
        border-r border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,13,0.9)] backdrop-blur-xl"
    >
      {/* Top section label */}
      <div className="px-4 pt-5 pb-2">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#4b5563]">
          Navigation
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item, i) => {
          const isActive = active === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-[rgba(0,178,255,0.1)] text-white'
                  : 'text-[#6b7280] hover:text-[#d1d5db] hover:bg-[rgba(255,255,255,0.04)]'
              )}
            >
              {/* Active blue bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-bar"
                  className="sidebar-active-bar"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-[#00b2ff]' : 'text-[#4b5563] group-hover:text-[#9ca3af]'
                )}
              />
              <span className="truncate">{item.label}</span>

              {/* Active dot badge */}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00b2ff] shadow-[0_0_8px_rgba(0,178,255,0.8)]" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-2 border-t border-[rgba(255,255,255,0.05)]" />

      {/* Bottom items */}
      <div className="px-3 pb-3 space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                isActive
                  ? 'bg-[rgba(0,178,255,0.1)] text-white'
                  : 'text-[#4b5563] hover:text-[#9ca3af] hover:bg-[rgba(255,255,255,0.04)]'
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#00b2ff]" : "")} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00b2ff] shadow-[0_0_8px_rgba(0,178,255,0.8)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* System Status card */}
      <div className="m-3 p-3 rounded-xl bg-[rgba(34,211,160,0.05)] border border-[rgba(34,211,160,0.12)]">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative w-2 h-2">
            <div className="absolute inset-0 rounded-full bg-[#22d3a0] animate-ping opacity-60" />
            <div className="w-2 h-2 rounded-full bg-[#22d3a0]" />
          </div>
          <span className="text-[11px] font-semibold text-[#22d3a0]">System Active</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280]">
          <Zap className="w-3 h-3 text-[#22d3a0]" />
          <span>Earn → Pay → Earn</span>
        </div>
      </div>
    </motion.aside>
  );
}
