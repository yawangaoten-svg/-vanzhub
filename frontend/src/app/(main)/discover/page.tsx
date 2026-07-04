'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userApi, groupApi } from '@/lib/api';
import { UserPreview, Group } from '@/types';
import { Compass, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const [suggestions, setSuggestions] = useState<UserPreview[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          userApi.getSuggestions(),
          groupApi.getGroups(),
        ]);
        setSuggestions(usersRes.data.data || []);
        setGroups(groupsRes.data.data?.slice(0, 6) || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Compass size={24} className="text-primary-500" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Discover</h1>
        </div>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-primary-500" />
              People you might know
            </h2>
            <button className="text-sm text-primary-500 hover:text-primary-600 font-medium">See all</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xl font-bold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user.displayName}
                </h3>
                <p className="text-xs text-slate-500 mb-3">@{user.username}</p>
                {user.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                    {user.bio}
                  </p>
                )}
                <button
                  onClick={() => router.push(`/profile/${user.username}`)}
                  className="btn-primary w-full text-sm"
                >
                  View Profile
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" />
              Trending Groups
            </h2>
            <button
              onClick={() => router.push('/groups')}
              className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-white text-lg font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {group._count?.members || 0} members
                    </p>
                  </div>
                </div>
                {group.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                    {group.description}
                  </p>
                )}
                <button className="btn-secondary w-full text-sm">Join</button>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
