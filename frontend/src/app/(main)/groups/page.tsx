'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { groupApi } from '@/lib/api';
import { Group } from '@/types';
import { Users, Lock, Globe, Plus } from 'lucide-react';
import { formatCount } from '@/lib/utils';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await groupApi.getGroups();
        setGroups(data.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Groups</h1>
        <button className="btn-primary">
          <Plus size={18} />
          Create Group
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl skeleton" />
                <div className="space-y-2 flex-1">
                  <div className="w-40 h-4 skeleton" />
                  <div className="w-24 h-3 skeleton" />
                </div>
              </div>
              <div className="w-full h-3 skeleton mb-2" />
              <div className="w-3/4 h-3 skeleton" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {groups.map((group) => (
            <div key={group.id} className="glass-card rounded-2xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {group.visibility === 'PUBLIC' ? (
                      <Globe size={14} className="text-green-500" />
                    ) : (
                      <Lock size={14} className="text-amber-500" />
                    )}
                    <span className="text-xs text-slate-500 capitalize">{group.visibility}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">{formatCount(group._count?.members || 0)} members</span>
                  </div>
                  {group.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <button className="btn-secondary mt-3 w-full text-sm py-2">
                    Join Group
                  </button>
                </div>
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <Users size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No groups yet</h3>
              <p className="text-sm text-slate-500">Create or join a group</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
