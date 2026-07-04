'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Laugh,
  HeartHandshake,
  PartyPopper,
} from 'lucide-react';
import { Post } from '@/types';
import { postApi } from '@/lib/api';
import { formatDate, formatCount } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count?.reactions || 0);
  const [showReactions, setShowReactions] = useState(false);

  const handleLike = async () => {
    try {
      const type = liked ? 'LIKE' : 'LIKE';
      const { data } = await postApi.toggleReaction(post.id, type);
      setLiked(data.data.reacted);
      setLikeCount(prev => data.data.reacted ? prev + 1 : prev - 1);
    } catch {
      toast.error('Failed to react');
    }
  };

  const handleBookmark = async () => {
    try {
      const { data } = await postApi.toggleBookmark(post.id);
      setBookmarked(data.data.bookmarked);
      toast.success(data.data.bookmarked ? 'Bookmarked' : 'Removed bookmark');
    } catch {
      toast.error('Failed to bookmark');
    }
  };

  const reactionButtons = [
    { icon: ThumbsUp, label: 'Like', color: 'text-primary-500' },
    { icon: Heart, label: 'Love', color: 'text-red-500' },
    { icon: Laugh, label: 'Laugh', color: 'text-yellow-500' },
    { icon: PartyPopper, label: 'Celebrate', color: 'text-green-500' },
  ];

  return (
    <div className="glass-card rounded-2xl overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {post.author.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {post.author.displayName}
                </h4>
                <span className="text-xs text-slate-400">@{post.author.username}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap mb-3">
          {post.content}
        </p>

        {post.media && post.media.length > 0 && (
          <div className={`grid gap-2 mb-3 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.media.map((media) => (
              <div key={media.id} className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                {media.type.startsWith('image/') ? (
                  <img
                    src={media.url}
                    alt={media.alt || ''}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <video
                    src={media.url}
                    controls
                    className="w-full h-64 object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <span>{formatCount(likeCount)} reactions</span>
          <span>{formatCount(post._count?.comments || 0)} comments</span>
          <span>{formatCount(post.shareCount || 0)} shares</span>
        </div>

        <hr className="border-slate-200 dark:border-slate-700 mb-2" />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={handleLike}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  liked
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <Heart size={18} className={liked ? 'fill-current' : ''} />
                <span className="hidden sm:inline">Like</span>
              </button>
            </div>

            <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all">
              <MessageCircle size={18} />
              <span className="hidden sm:inline">Comment</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all">
              <Share2 size={18} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          <button
            onClick={handleBookmark}
            className={`p-2 rounded-xl transition-all ${
              bookmarked
                ? 'text-accent-500 bg-accent-50 dark:bg-accent-950/50'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <Bookmark size={18} className={bookmarked ? 'fill-current' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
