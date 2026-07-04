'use client';

import { useRouter } from 'next/navigation';
import { UserPreview } from '@/types';
import { UserPlus, UserCheck } from 'lucide-react';

interface UserCardProps {
  user: UserPreview;
  isFollowing?: boolean;
  onFollow?: () => void;
  showFollowButton?: boolean;
}

export default function UserCard({ user, isFollowing = false, onFollow, showFollowButton = true }: UserCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/profile/${user.username}`)}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {user.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {user.displayName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          @{user.username}
        </p>
        {user.bio && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {user.bio}
          </p>
        )}
      </div>
      {showFollowButton && onFollow && (
        <button
          onClick={(e) => { e.stopPropagation(); onFollow(); }}
          className={`flex-shrink-0 p-2 rounded-xl transition-all ${
            isFollowing
              ? 'text-primary-500 bg-primary-50 dark:bg-primary-950/30'
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
        </button>
      )}
    </div>
  );
}
