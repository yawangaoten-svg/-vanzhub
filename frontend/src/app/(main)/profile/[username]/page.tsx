'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  UserPlus,
  UserCheck,
  MessageCircle,
  Settings,
} from 'lucide-react';
import { userApi } from '@/lib/api';
import { User, Post } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { formatCount, formatDate } from '@/lib/utils';
import PostCard from '@/components/PostCard';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const username = params.username as string;
        const { data } = await userApi.getProfile(username);
        setProfile(data.data);

        const postsRes = await userApi.getUserPosts(data.data.id);
        setPosts(postsRes.data.data || []);
      } catch {
        toast.error('User not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [params.username]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await userApi.unfollow(profile.id);
        setIsFollowing(false);
      } else {
        await userApi.follow(profile.id);
        setIsFollowing(true);
      }
    } catch {
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full skeleton" />
            <div className="space-y-3 flex-1">
              <div className="w-48 h-5 skeleton" />
              <div className="w-32 h-4 skeleton" />
              <div className="w-64 h-3 skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-48 bg-gradient-brand relative">
          {profile.coverPhoto && (
            <img src={profile.coverPhoto} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-brand border-4 border-white dark:border-slate-800 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {profile.displayName}
              </h1>
              <p className="text-sm text-slate-500">@{profile.username}</p>
            </div>

            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <button className="btn-secondary">
                  <Settings size={16} />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                  >
                    {isFollowing ? (
                      <><UserCheck size={16} /> Following</>
                    ) : (
                      <><UserPlus size={16} /> Follow</>
                    )}
                  </button>
                  <button className="btn-ghost">
                    <MessageCircle size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{profile.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {profile.location}
              </span>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline">
                <LinkIcon size={14} /> {profile.website.replace('https://', '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={14} /> Joined {formatDate(profile.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">{formatCount(profile._count?.posts || 0)}</strong> Posts
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">{formatCount(profile._count?.followers || 0)}</strong> Followers
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">{formatCount(profile._count?.following || 0)}</strong> Following
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['posts', 'media'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'posts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12 text-slate-500">No posts yet</div>
          )}
        </motion.div>
      )}
    </div>
  );
}
