'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Video, BarChart3, Smile, Globe, X, Send } from 'lucide-react';
import { postApi, mediaApi } from '@/lib/api';
import { Post } from '@/types';
import toast from 'react-hot-toast';

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) {
      toast.error('Add some content to your post');
      return;
    }

    setPosting(true);
    try {
      let mediaIds: string[] = [];

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        const { data } = await mediaApi.uploadMultiple(formData);
        mediaIds = data.data.map((m: any) => m.id);
      }

      const { data } = await postApi.createPost({
        content: content.trim(),
        mediaIds,
      });

      onPostCreated(data.data);
      setContent('');
      setFiles([]);
      setPreviews([]);
      setIsExpanded(false);
      toast.success('Post created!');
    } catch {
      toast.error('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-brand flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
            U
          </div>
          <div className="flex-1">
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (!isExpanded) setIsExpanded(true);
              }}
              onClick={() => setIsExpanded(true)}
              className="w-full resize-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none text-sm min-h-[40px]"
              rows={isExpanded ? 3 : 1}
              maxLength={5000}
            />

            <AnimatePresence>
              {previews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-3 gap-2 mt-3"
                >
                  {previews.map((preview, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                    >
                      <Image size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                      <Video size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                      <BarChart3 size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                      <Smile size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                      <Globe size={18} />
                    </button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={posting || (!content.trim() && files.length === 0)}
                    className="btn-primary"
                  >
                    {posting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Post
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
