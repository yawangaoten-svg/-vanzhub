'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { postApi } from '@/lib/api';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { FeedSkeleton } from '@/components/Skeleton';
import { getSocket } from '@/lib/socket';
import { Loader2, RefreshCw } from 'lucide-react';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      const { data } = await postApi.getFeed(pageNum);
      if (append) {
        setPosts(prev => [...prev, ...(data.data || [])]);
      } else {
        setPosts(data.data || []);
      }
      setHasMore(data.pagination?.hasNext || false);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, true);
    }
  }, [page, fetchPosts]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('post:reacted', (data: { postId: string; userId: string; type: string }) => {
      setPosts(prev => prev.map(p =>
        p.id === data.postId ? { ...p, _count: { ...p._count, reactions: p._count.reactions + 1 } } : p
      ));
    });
    socket.on('post:commented', (data: { postId: string; userId: string }) => {
      setPosts(prev => prev.map(p =>
        p.id === data.postId ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p
      ));
    });
    return () => {
      socket.off('post:reacted');
      socket.off('post:commented');
    };
  }, []);

  const handlePostCreated = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPosts(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Home
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-ghost p-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Feed
          </div>
        </div>
      </div>

      {user && <CreatePost onPostCreated={handlePostCreated} />}

      {loading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            No posts yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Follow people to see their posts in your feed
          </p>
        </div>
      ) : (
        <motion.div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {hasMore && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary w-full py-3"
            >
              <Loader2 size={18} className="animate-spin" />
              Load more
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
