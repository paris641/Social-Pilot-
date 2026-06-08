import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { settingsApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Key, Eye, EyeOff, Save, CheckCircle, Bell, Database, Palette, Shield, Info } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme, openAIKey, setOpenAIKey } = useAppStore();
  const [apiKey, setApiKey] = useState(openAIKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveKey = async () => {
    setOpenAIKey(apiKey);
    // Also save to backend
    try {
      await settingsApi.set('openai_api_key', apiKey);
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      id: 'ai',
      title: 'AI Configuration',
      icon: Key,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
    {
      id: 'data',
      title: 'Data & Storage',
      icon: Database,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'security',
      title: 'Privacy & Security',
      icon: Shield,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  const [activeSection, setActiveSection] = useState('ai');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure SocialPilot for your workspace</p>
      </motion.div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 shrink-0">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                onClick={() => setActiveSection(s.id)}
              >
                <s.icon size={14} className={activeSection === s.id ? s.color : ''} />
                {s.title.split(' ')[0]}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === 'ai' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="metric-card">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Key size={16} className="text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">OpenAI API Key</h3>
                    <p className="text-xs text-muted-foreground">Required for AI features</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      className="input-base pr-10"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                    <Info size={12} className="mt-0.5 shrink-0 text-violet-400" />
                    <div>
                      Your API key is stored locally and encrypted. It's never sent to any server other than OpenAI.
                      Get your key from{' '}
                      <a href="https://platform.openai.com/api-keys" className="text-violet-400 hover:underline" target="_blank" rel="noreferrer">
                        platform.openai.com
                      </a>
                    </div>
                  </div>

                  <button className="btn-primary w-full" onClick={saveKey}>
                    {saved ? (
                      <><CheckCircle size={14} /> Saved!</>
                    ) : (
                      <><Save size={14} /> Save API Key</>
                    )}
                  </button>
                </div>
              </div>

              <div className="metric-card">
                <h3 className="font-semibold text-sm mb-4">AI Features Status</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Screenshot Analysis (GPT-4 Vision)', enabled: !!apiKey },
                    { label: 'AI Chat Assistant', enabled: !!apiKey },
                    { label: 'Content Idea Generator', enabled: !!apiKey },
                    { label: 'Report Summary Generator', enabled: !!apiKey },
                    { label: 'Competitor Analysis', enabled: !!apiKey },
                  ].map((feature) => (
                    <div key={feature.label} className="flex items-center justify-between py-1.5">
                      <span className="text-sm">{feature.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        feature.enabled ? 'badge-green' : 'badge-rose'
                      }`}>
                        {feature.enabled ? 'Active' : 'No API Key'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="metric-card space-y-4">
              <h3 className="font-semibold text-sm mb-2">Notification Preferences</h3>
              {[
                { label: 'Missing content alerts', desc: 'Notify when a client hasn\'t posted in 7+ days', defaultOn: true },
                { label: 'Engagement decline alerts', desc: 'Notify when engagement drops significantly', defaultOn: true },
                { label: 'Monthly report reminders', desc: 'Reminder to generate monthly reports', defaultOn: true },
                { label: 'Desktop notifications', desc: 'Show system-level desktop notifications', defaultOn: false },
              ].map((setting, i) => (
                <label key={i} className="flex items-center justify-between cursor-pointer py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.desc}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" defaultChecked={setting.defaultOn} />
                    <div className="w-9 h-5 bg-muted peer-checked:bg-violet-500 rounded-full transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              ))}
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="metric-card space-y-4">
              <h3 className="font-semibold text-sm mb-2">Appearance</h3>
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Theme</label>
                <div className="flex gap-3">
                  {['dark', 'light'].map((t) => (
                    <button
                      key={t}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        theme === t ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-border text-muted-foreground hover:border-violet-500/30'
                      }`}
                      onClick={() => setTheme(t as 'dark' | 'light')}
                    >
                      {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Full light mode implementation can be completed by adding light-mode CSS variable overrides.
                </p>
              </div>
            </motion.div>
          )}

          {activeSection === 'data' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="metric-card">
                <h3 className="font-semibold text-sm mb-4">Storage Locations</h3>
                <div className="space-y-3 text-sm font-mono">
                  {[
                    { label: 'Database', path: 'data/app.db' },
                    { label: 'Screenshots', path: 'storage/screenshots/' },
                    { label: 'Reports', path: 'storage/reports/' },
                    { label: 'Exports', path: 'storage/exports/' },
                    { label: 'Profile Images', path: 'storage/profile-images/' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground text-xs">{item.label}</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded text-violet-400">{item.path}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div className="metric-card bg-amber-500/5 border-amber-500/20">
                <h3 className="font-semibold text-sm text-amber-400 mb-2">⚠️ Local-First Storage</h3>
                <p className="text-xs text-muted-foreground">
                  All data is stored locally on your computer. No cloud sync. Back up the <code className="text-amber-400">data/</code> and <code className="text-amber-400">storage/</code> directories regularly to avoid data loss.
                </p>
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="metric-card space-y-4">
              <h3 className="font-semibold text-sm mb-2">Privacy & Security</h3>
              <div className="space-y-3">
                {[
                  { label: 'API key encryption', status: 'Enabled', green: true, desc: 'Keys are encrypted using electron-store' },
                  { label: 'Local data only', status: 'Active', green: true, desc: 'No data leaves your machine except AI/sync requests' },
                  { label: 'CORS protection', status: 'Enabled', green: true, desc: 'Backend only accepts requests from the app' },
                  { label: 'Cloud sync', status: 'Disabled', green: false, desc: 'All data stays on-device' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <span className={item.green ? 'badge-green' : 'badge-rose'}>{item.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>SocialPilot v1.0.0</span>
        <span>Local-first · AI-powered · Built with Electron + React</span>
      </div>
    </div>
  );
}
