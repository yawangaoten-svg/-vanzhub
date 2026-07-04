'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { postApi } from '@/lib/api';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';
import { Bookmark } from 'lucide-react';

export default function BookmarksPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await postApi.getFeed();
        const bookmarkedPosts = (data.data || []).filter((p: any) => p._count?.bookmarks > 0);
        setPosts(bookmarkedPosts);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bookmarks</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="space-y-2 flex-1">
                  <div className="w-32 h-3 skeleton" />
                  <div className="w-20 h-2 skeleton" />
                </div>
              </div>
              <div className="w-full h-3 skeleton mb-2" />
              <div className="w-3/4 h-3 skeleton" />
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Bookmark size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No bookmarks yet
          </h3>
          <p className="text-sm text-slate-500">
            Save posts to read them later
          </p>
        </div>
      )}
    </div>
  );
}
