'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { searchApi, postApi } from '@/lib/api';
import { Post, Hashtag, UserPreview } from '@/types';
import PostCard from '@/components/PostCard';
import { TrendingUp, Users, Hash, Search } from 'lucide-react';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'users' | 'hashtags'>('trending');
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const [postsRes, hashtagsRes] = await Promise.all([
          postApi.getFeed(1),
          postApi.getTrending(),
        ]);
        setTrendingPosts(postsRes.data.data || []);
        setTrendingHashtags(hashtagsRes.data.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(async () => {
        try {
          const { data } = await searchApi.search(query);
          setSearchResults(data.data);
        } catch {
          // ignore
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults(null);
    }
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search VANZHUB..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field pl-11 py-3 text-base"
        />
      </div>

      {searchResults ? (
        <div className="space-y-6">
          {searchResults.users?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Users size={18} /> People
              </h3>
              <div className="space-y-2">
                {searchResults.users.map((user: UserPreview) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50">
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

          {searchResults.posts?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Posts</h3>
              <div className="space-y-3">
                {searchResults.posts.map((post: Post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            {[
              { id: 'trending', label: 'Trending', icon: TrendingUp },
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

          {activeTab === 'trending' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {trendingPosts.slice(0, 5).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </motion.div>
          )}

          {activeTab === 'hashtags' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="space-y-2">
                {trendingHashtags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Hash size={18} className="text-primary-500" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        #{tag.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{tag.count} posts</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
