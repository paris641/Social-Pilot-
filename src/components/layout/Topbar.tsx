import React, { useState } from 'react';
import { Bell, Search, Command, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { unreadCount, notifications, setSearchQuery, setIsSearchOpen, clients, theme, setTheme } = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    setSearchQuery(e.target.value);
  };

  const filteredClients = searchVal
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
          c.brandName.toLowerCase().includes(searchVal.toLowerCase())
      )
    : [];

  return (
    <header className="h-14 border-b border-border flex items-center px-4 gap-4 shrink-0 bg-card/50 backdrop-blur-sm">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-base pl-9 pr-3 py-1.5 text-sm"
          placeholder="Search clients, posts..."
          value={searchVal}
          onChange={handleSearch}
          onFocus={() => setIsSearchOpen(true)}
          onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>

        <AnimatePresence>
          {searchVal && filteredClients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left text-sm"
                  onClick={() => {
                    navigate(`/clients/${client.id}`);
                    setSearchVal('');
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">
                    {client.brandName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.brandName}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <div>
          <button
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        {/* Notifications */}
        <div className="relative">
          <button
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-sm">Notifications</span>
                  <span className="badge-violet">{unreadCount} new</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">All caught up!</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.type === 'missing_content' ? 'bg-amber-500' : 'bg-violet-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                            {n.client && (
                              <p className="text-xs text-violet-400 mt-1">{n.client.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
          U
        </div>
      </div>
    </header>
  );
}
