'use client';

import { useState, useEffect } from 'react';
import { messageApi } from '@/lib/api';
import { Conversation } from '@/types';
import { Search } from 'lucide-react';
import MessagesList, { ChatWindow } from '@/components/MessagesList';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await messageApi.getConversations();
        setConversations(data.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const selectedConversation = conversations.find(c => c.user.id === selectedChat);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="glass-card rounded-2xl h-full overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Messages</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>
          <MessagesList
            conversations={conversations}
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
        </div>
      </div>

      <div className="hidden lg:flex flex-1 flex-col">
        {selectedChat ? (
          <div className="glass-card rounded-2xl h-full flex flex-col overflow-hidden">
            <ChatWindow userId={selectedChat} conversation={selectedConversation} />
          </div>
        ) : (
          <div className="glass-card rounded-2xl h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <MessageCircle size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Select a conversation
              </h3>
              <p className="text-sm text-slate-500">
                Choose a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Import needed for the empty state
import { MessageCircle } from 'lucide-react';