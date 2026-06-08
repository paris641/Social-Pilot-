import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BarChart2, Calendar, Library,
  Sparkles, MessageSquare, FileText, Settings, Zap,
  ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../utils/cn';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Clients', icon: Users, to: '/clients' },
  { label: 'AI Review', icon: Eye, to: '/ai-review' },
  { label: 'Inspiration', icon: Sparkles, to: '/inspiration' },
  { label: 'AI Assistant', icon: MessageSquare, to: '/assistant' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, to: '/settings' },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, clients, selectedClientId, setSelectedClientId } = useAppStore();
  const navigate = useNavigate();

  const activeClient = clients.find((c) => c.id === selectedClientId);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 60 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full border-r border-border bg-card shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-sm tracking-tight"
            >
              SocialPilot
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors shrink-0"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          whileHover={{ scale: 1.1 }}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Main Nav */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active', sidebarCollapsed && 'justify-center px-2')
            }
          >
            <item.icon size={16} className="shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* Client Quick Select */}
        {!sidebarCollapsed && clients.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
              Clients
            </p>
            <div className="space-y-0.5 max-h-52 overflow-y-auto">
              {clients.slice(0, 8).map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    navigate(`/clients/${client.id}`);
                  }}
                  className={cn(
                    'nav-item w-full text-left',
                    selectedClientId === client.id && 'active'
                  )}
                >
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {client.brandName.charAt(0)}
                  </div>
                  <span className="truncate text-xs">{client.name}</span>
                  {client.healthScore < 40 && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="p-2 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active', sidebarCollapsed && 'justify-center px-2')
            }
          >
            <item.icon size={16} className="shrink-0" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </div>
    </motion.aside>
  );
}
