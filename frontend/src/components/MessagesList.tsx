'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Paperclip, Smile, Search } from 'lucide-react';
import { messageApi } from '@/lib/api';
import { Conversation, Message } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';

interface MessagesListProps {
  conversations: Conversation[];
  selectedChat: string | null;
  onSelectChat: (userId: string) => void;
}

export default function MessagesList({ conversations, selectedChat, onSelectChat }: MessagesListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          <MessageCircle size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          No conversations yet
        </div>
      ) : (
        conversations.map((conv) => (
          <button
            key={conv.user.id}
            onClick={() => onSelectChat(conv.user.id)}
            className={cn(
              'w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors',
              selectedChat === conv.user.id && 'bg-slate-50 dark:bg-slate-700/30'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0 relative">
              {conv.user.displayName.charAt(0).toUpperCase()}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-800" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {conv.user.displayName}
                </span>
                {conv.lastMessage && (
                  <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                    {formatDate(conv.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {conv.lastMessage?.content || 'Start a conversation'}
              </p>
            </div>
            {conv.unreadCount > 0 && (
              <div className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );
}

interface ChatWindowProps {
  userId: string;
  conversation: Conversation | undefined;
}

export function ChatWindow({ userId, conversation }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      messageApi.getMessages(userId, 1, 50).then(({ data }) => {
        setMessages(data.data || []);
      });
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('message:new', (message: Message) => {
      if (message.senderId === userId || message.receiverId === userId) {
        setMessages(prev => [...prev, message]);
      }
    });
    socket.on('typing:start', ({ userId: typingUserId }: { userId: string }) => {
      if (typingUserId === userId) setIsTyping(true);
    });
    socket.on('typing:stop', ({ userId: typingUserId }: { userId: string }) => {
      if (typingUserId === userId) setIsTyping(false);
    });
    return () => {
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [userId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const socket = getSocket();
    socket.emit('message:send', {
      receiverId: userId,
      content: newMessage.trim(),
      type: 'TEXT',
    });
    setNewMessage('');
  };

  const handleTyping = () => {
    const socket = getSocket();
    socket.emit('typing:start', { receiverId: userId });
    setTimeout(() => {
      socket.emit('typing:stop', { receiverId: userId });
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col">
      {conversation && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold">
              {conversation.user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {conversation.user.displayName}
              </p>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex', msg.senderId === userId ? 'justify-start' : 'justify-end')}
          >
            <div
              className={cn(
                'max-w-[70%] rounded-2xl px-4 py-2.5',
                msg.senderId === userId
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  : 'bg-gradient-brand text-white'
              )}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={cn(
                'text-[10px] mt-1',
                msg.senderId === userId ? 'text-slate-400' : 'text-white/60'
              )}>
                {formatDate(msg.createdAt)}
                {msg.senderId !== userId && msg.isRead && (
                  <span className="ml-1">· Read</span>
                )}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="input-field flex-1"
          />
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <Smile size={18} />
          </button>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="btn-primary p-2.5"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
