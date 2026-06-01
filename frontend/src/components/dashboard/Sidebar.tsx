'use client';

import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, CheckCircle2, BarChart3, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Tasks', href: '/dashboard' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', roles: ['ADMIN', 'MANAGER'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="p-1.5 bg-blue-600 rounded-lg">
          <CheckCircle2 className="text-white" size={20} />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">TeamTask</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          if (item.roles && !item.roles.includes(user?.role || '')) return null;

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive 
                  ? "bg-blue-600/10 text-blue-500 font-medium" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 text-slate-300">
          <div className="p-2 bg-slate-800 rounded-full">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}
