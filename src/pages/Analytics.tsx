import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, Users, Eye, Heart, Plus } from 'lucide-react';

interface AnalyticsProps { clientId?: string; }

export default function Analytics({ clientId: propClientId }: AnalyticsProps) {
  const { id: paramId } = useParams();
  const clientId = propClientId || paramId;
  const [period, setPeriod] = useState('30');
  const [showAddData, setShowAddData] = useState(false);
  const qc = useQueryClient();

  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics', clientId, period],
    queryFn: () => analyticsApi.getForClient(clientId!, { period }),
    enabled: !!clientId,
  });

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', clientId],
    queryFn: () => analyticsApi.getSummary(clientId!),
    enabled: !!clientId,
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => analyticsApi.addSnapshot(clientId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analytics'] });
      setShowAddData(false);
    },
  });

  const [newSnapshot, setNewSnapshot] = useState({
    platform: 'instagram', date: new Date().toISOString().split('T')[0],
    followers: '', reach: '', impressions: '', engagement: '', saves: '', shares: '', comments: '',
  });

  const chartData = analytics.map((a: any) => ({
    date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    followers: a.followers,
    reach: a.reach,
    engagement: +a.engagement.toFixed(2),
    impressions: a.impressions,
    saves: a.saves,
    shares: a.shares,
  }));

  if (!clientId) return <div className="p-6 text-muted-foreground">Select a client to view analytics</div>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {['7', '14', '30', '90'].map((p) => (
              <button
                key={p}
                className={`px-3 py-1.5 font-medium transition-colors ${period === p ? 'bg-violet-500 text-white' : 'text-muted-foreground hover:bg-accent'}`}
                onClick={() => setPeriod(p)}
              >
                {p}d
              </button>
            ))}
          </div>
          <button className="btn-secondary text-xs" onClick={() => setShowAddData(true)}>
            <Plus size={12} /> Add Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Followers', value: summary?.latest?.followers?.toLocaleString() || '—', icon: Users, color: '#6366f1' },
          { label: 'Avg Engagement', value: summary ? `${summary.avgEngagement.toFixed(2)}%` : '—', icon: Heart, color: '#f43f5e' },
          { label: 'Total Reach', value: summary?.totalReach?.toLocaleString() || '—', icon: Eye, color: '#10b981' },
          { label: 'Data Points', value: summary?.dataPoints || 0, icon: TrendingUp, color: '#06b6d4' },
        ].map((stat) => (
          <div key={stat.label} className="metric-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon size={18} style={{ color: stat.color }} className="opacity-60" />
            </div>
          </div>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="metric-card text-center py-16">
          <TrendingUp size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">No analytics data yet</p>
          <p className="text-sm text-muted-foreground">Add analytics snapshots to see charts</p>
          <button className="btn-primary mt-4" onClick={() => setShowAddData(true)}>
            <Plus size={14} /> Add First Snapshot
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Followers Chart */}
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-4">Follower Growth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2} fill="url(#fg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement + Reach */}
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-card">
              <h3 className="text-sm font-semibold mb-4">Engagement Rate (%)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="engagement" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="metric-card">
              <h3 className="text-sm font-semibold mb-4">Reach</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="reach" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Add Snapshot Modal */}
      {showAddData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold mb-4">Add Analytics Snapshot</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Platform</label>
                  <select
                    className="input-base mt-1"
                    value={newSnapshot.platform}
                    onChange={(e) => setNewSnapshot((s) => ({ ...s, platform: e.target.value }))}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Date</label>
                  <input type="date" className="input-base mt-1" value={newSnapshot.date}
                    onChange={(e) => setNewSnapshot((s) => ({ ...s, date: e.target.value }))} />
                </div>
              </div>
              {['followers', 'reach', 'impressions', 'engagement', 'saves', 'shares', 'comments'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground capitalize">{field}</label>
                  <input
                    type="number" className="input-base mt-1"
                    value={(newSnapshot as any)[field]}
                    onChange={(e) => setNewSnapshot((s) => ({ ...s, [field]: e.target.value }))}
                    step={field === 'engagement' ? '0.01' : '1'}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-secondary flex-1" onClick={() => setShowAddData(false)}>Cancel</button>
              <button
                className="btn-primary flex-1"
                onClick={() => addMutation.mutate({
                  ...newSnapshot,
                  date: new Date(newSnapshot.date).toISOString(),
                  followers: +newSnapshot.followers,
                  reach: +newSnapshot.reach,
                  impressions: +newSnapshot.impressions,
                  engagement: +newSnapshot.engagement,
                  saves: +newSnapshot.saves,
                  shares: +newSnapshot.shares,
                  comments: +newSnapshot.comments,
                })}
              >
                {addMutation.isPending ? 'Saving...' : 'Save Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
