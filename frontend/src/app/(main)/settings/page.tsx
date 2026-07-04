'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/components/ThemeProvider';
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  Smartphone,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language & Region', icon: Globe },
  { id: 'sessions', label: 'Active Sessions', icon: Smartphone },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('appearance');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  return (
    <div className="flex gap-6">
      <div className="hidden md:block w-64 flex-shrink-0">
        <div className="glass-card rounded-2xl p-3 sticky top-20">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white px-3 py-2">Settings</h2>
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === section.id
                  ? 'sidebar-item-active'
                  : 'sidebar-item'
              }`}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
          <hr className="my-2 border-slate-200 dark:border-slate-700" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          {activeSection === 'appearance' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Appearance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon size={20} className="text-slate-600 dark:text-slate-300" /> : <Sun size={20} className="text-slate-600" />}
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Theme</p>
                      <p className="text-xs text-slate-500">Switch between light and dark mode</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      theme === 'dark' ? 'bg-primary-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                  <input type="text" className="input-field" defaultValue={user?.displayName} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                  <input type="text" className="input-field" defaultValue={user?.username} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                  <textarea className="input-field" rows={3} defaultValue={user?.bio || ''} />
                </div>
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Privacy & Security</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Private Account</p>
                      <p className="text-xs text-slate-500">Only approved followers can see your posts</p>
                    </div>
                  </div>
                  <div className="relative w-12 h-6 rounded-full bg-slate-300">
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <button className="btn-secondary text-sm">Enable</button>
                </div>
              </div>
            </div>
          )}

          {activeSection !== 'profile' && activeSection !== 'appearance' && activeSection !== 'privacy' && (
            <div className="text-center py-12 text-slate-500">
              Settings section coming soon
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
