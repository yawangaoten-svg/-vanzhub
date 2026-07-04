'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  Compass,
  Users,
  Bookmark,
  Settings,
  PlusSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const sidebarItems = [
  { icon: Home, label: 'Home', href: '/feed' },
  { icon: Search, label: 'Explore', href: '/explore' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: MessageCircle, label: 'Messages', href: '/messages' },
  { icon: Compass, label: 'Discover', href: '/discover' },
  { icon: Users, label: 'Groups', href: '/groups' },
  { icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 h-screen sticky top-0 p-4">
      <div className="glass-card rounded-2xl p-4 flex flex-col h-full">
        <Link href="/feed" className="flex items-center gap-3 px-3 py-4 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
            <span className="text-lg font-bold text-white">V</span>
          </div>
          <span className="text-xl font-bold gradient-text">VANZHUB</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'sidebar-item',
                  isActive && 'sidebar-item-active'
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.label === 'Notifications' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full bg-accent-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <Link
            href="/new-post"
            className="btn-primary w-full"
          >
            <PlusSquare size={18} />
            <span>New Post</span>
          </Link>
        </div>

        {user && (
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 mt-4 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                @{user.username}
              </p>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
