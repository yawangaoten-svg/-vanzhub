'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { searchApi } from '@/lib/api';
import { Post, UserPreview, Hashtag } from '@/types';
import PostCard from '@/components/PostCard';
import { Search, Users, FileText, Hash, Loader2 } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'hashtags'>('all');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    const fetchResults = async () => {
      try {
        const { data } = await searchApi.search(query);
        setResults(data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search VANZHUB..."
          defaultValue={query}
          onChange={(e) => {
            const val = e.target.value;
            router.push(`/search?q=${encodeURIComponent(val)}`);
          }}
          className="input-field pl-11 py-3 text-base"
        />
      </div>

      {query && (
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All', icon: Search },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'posts', label: 'Posts', icon: FileText },
            { id: 'hashtags', label: 'Hashtags', icon: Hash },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-primary-500" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {(activeTab === 'all' || activeTab === 'users') && results?.users?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Users size={18} /> People
              </h3>
              <div className="space-y-2">
                {results.users.map((user: UserPreview) => (
                  <div
                    key={user.id}
                    onClick={() => router.push(`/profile/${user.username}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold">
                      {user.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.displayName}</p>
                      <p className="text-xs text-slate-500">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'posts') && results?.posts?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText size={18} /> Posts
              </h3>
              <div className="space-y-3">
                {results.posts.map((post: Post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'hashtags') && results?.hashtags?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Hash size={18} /> Hashtags
              </h3>
              <div className="glass-card rounded-2xl p-3">
                {results.hashtags.map((tag: Hashtag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50">
                    <span className="text-sm font-medium text-primary-500">#{tag.name}</span>
                    <span className="text-xs text-slate-500">{tag.count} posts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {query && !loading && !results?.users?.length && !results?.posts?.length && !results?.hashtags?.length && (
            <div className="text-center py-16">
              <Search size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No results found</h3>
              <p className="text-sm text-slate-500">Try different keywords</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-16"><Loader2 size={24} className="animate-spin text-primary-500 mx-auto" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
