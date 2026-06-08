import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Users, TrendingUp, AlertTriangle, FileText, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function Dashboard() {
  const { clients } = useAppStore();
  const navigate = useNavigate();

  const activeClients = clients.filter((c) => !c.isArchived);
  const healthyClients = activeClients.filter((c) => c.healthScore >= 60);
  const alertClients = activeClients.filter((c) => c.healthScore < 40);
  const avgEngagement = activeClients.length
    ? activeClients.reduce((sum, c) => sum + (c.engagement || 0), 0) / activeClients.length
    : 0;

  // Mock trend data for visualization
  const trendData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    posts: Math.floor(Math.random() * 40 + 20),
    engagement: +(Math.random() * 3 + 2).toFixed(1),
    reach: Math.floor(Math.random() * 10000 + 5000),
  }));

  const statsCards = [
    {
      label: 'Total Clients',
      value: activeClients.length,
      icon: Users,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      trend: '+2 this month',
      up: true,
    },
    {
      label: 'Avg Engagement',
      value: `${avgEngagement.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      trend: '+0.3% vs last month',
      up: true,
    },
    {
      label: 'Needs Attention',
      value: alertClients.length,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      trend: `${alertClients.length} clients below threshold`,
      up: false,
    },
    {
      label: 'Reports Due',
      value: activeClients.length,
      icon: FileText,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      trend: 'End of month',
      up: true,
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 xl:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {statsCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.1 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-3 text-xs ${card.up ? 'text-emerald-400' : 'text-amber-400'}`}>
              {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {card.trend}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          className="col-span-2 metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Content Published</h3>
              <p className="text-xs text-muted-foreground">Posts across all clients</p>
            </div>
            <span className="badge-violet">Monthly</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="postsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f0f17', border: '1px solid #1f1f2e', borderRadius: 8, fontSize: 12 }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="posts" stroke="#6366f1" strokeWidth={2} fill="url(#postsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-sm mb-4">Client Health</h3>
          <div className="space-y-3">
            {activeClients.slice(0, 6).map((client) => (
              <div key={client.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {client.brandName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{client.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${client.healthScore}%`,
                          background: client.healthScore >= 70 ? '#10b981' : client.healthScore >= 40 ? '#f59e0b' : '#f43f5e',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-6 text-right">
                      {client.healthScore}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {activeClients.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No clients yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Clients Table */}
      <motion.div
        className="metric-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Active Clients</h3>
          <button className="btn-secondary text-xs" onClick={() => navigate('/clients')}>
            View all
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left pb-2 font-medium">Client</th>
              <th className="text-left pb-2 font-medium">Industry</th>
              <th className="text-center pb-2 font-medium">Posts/Month</th>
              <th className="text-center pb-2 font-medium">Engagement</th>
              <th className="text-center pb-2 font-medium">Health</th>
              <th className="text-center pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {activeClients.slice(0, 8).map((client) => (
              <tr
                key={client.id}
                className="hover:bg-accent/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-violet-400">
                      {client.brandName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.brandName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-xs text-muted-foreground">{client.industry || '—'}</td>
                <td className="py-3 text-center text-sm">{client.postsThisMonth || 0}</td>
                <td className="py-3 text-center text-sm">
                  <span className={client.engagement && client.engagement > 3 ? 'text-emerald-400' : 'text-amber-400'}>
                    {client.engagement?.toFixed(2) || '0.00'}%
                  </span>
                </td>
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${client.healthScore}%`,
                          background: client.healthScore >= 70 ? '#10b981' : client.healthScore >= 40 ? '#f59e0b' : '#f43f5e',
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{client.healthScore}</span>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <span className={
                    client.healthScore >= 70 ? 'badge-green' :
                    client.healthScore >= 40 ? 'badge-amber' : 'badge-rose'
                  }>
                    {client.healthScore >= 70 ? 'Healthy' : client.healthScore >= 40 ? 'Fair' : 'Alert'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activeClients.length === 0 && (
          <div className="text-center py-12">
            <Users size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No clients yet. Add your first client to get started.</p>
            <button className="btn-primary mt-4" onClick={() => navigate('/clients')}>
              Add Client
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
