import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Instagram, Facebook, Activity, Calendar, Library, BarChart2, FileText, Edit2 } from 'lucide-react';
import Analytics from './Analytics';
import Calendar from './Calendar';
import ContentLibrary from './ContentLibrary';
import Reports from './Reports';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'content', label: 'Content', icon: Library },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['client-dashboard', id],
    queryFn: () => clientsApi.getDashboard(id!),
    enabled: !!id && activeTab === 'overview',
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    );
  }

  if (!client) return <div className="p-6 text-muted-foreground">Client not found</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-0 shrink-0">
        <button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          onClick={() => navigate('/clients')}
        >
          <ArrowLeft size={14} /> Back to Clients
        </button>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center text-2xl font-bold text-violet-400">
              {client.brandName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{client.name}</h1>
              <p className="text-muted-foreground text-sm">{client.brandName}</p>
              <div className="flex items-center gap-2 mt-1">
                {client.industry && <span className="badge-violet">{client.industry}</span>}
                {client.instagramUrl && (
                  <a href={client.instagramUrl} className="badge-rose" onClick={(e) => e.stopPropagation()}>
                    <Instagram size={10} className="mr-1" /> Instagram
                  </a>
                )}
                {client.facebookUrl && (
                  <a href={client.facebookUrl} className="badge-violet" onClick={(e) => e.stopPropagation()}>
                    <Facebook size={10} className="mr-1" /> Facebook
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              client.healthScore >= 70 ? 'bg-emerald-500/10 text-emerald-400' :
              client.healthScore >= 40 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              Health: {client.healthScore}/100
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                  layoutId="tab-indicator"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Posts This Month', value: dashboard?.postsThisMonth || 0 },
                { label: 'Avg Engagement', value: `${(dashboard?.engagement || 0).toFixed(2)}%` },
                { label: 'Reach', value: (dashboard?.reach || 0).toLocaleString() },
                { label: 'Follower Growth', value: `${dashboard?.followerGrowth > 0 ? '+' : ''}${dashboard?.followerGrowth || 0}` },
              ].map((stat) => (
                <div key={stat.label} className="metric-card text-center">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Client Info */}
            <div className="metric-card">
              <h3 className="font-semibold text-sm mb-4">Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Contact Person', value: client.contactPerson },
                  { label: 'Email', value: client.email },
                  { label: 'Phone', value: client.phone },
                  { label: 'Industry', value: client.industry },
                ].filter((f) => f.value).map((field) => (
                  <div key={field.label}>
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-medium mt-0.5">{field.value}</p>
                  </div>
                ))}
              </div>
              {client.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {dashboard?.recentPosts && dashboard.recentPosts.length > 0 && (
              <div className="metric-card">
                <h3 className="font-semibold text-sm mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {dashboard.recentPosts.map((post: any) => (
                    <div key={post.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className={`w-2 h-2 rounded-full ${
                        post.status === 'posted' ? 'bg-emerald-400' :
                        post.status === 'pending' ? 'bg-amber-400' : 'bg-rose-400'
                      }`} />
                      <div className="flex-1">
                        <span className="text-sm">{post.contentType}</span>
                        {post.title && <span className="text-muted-foreground text-sm"> — {post.title}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                      <span className={`text-xs ${
                        post.status === 'posted' ? 'badge-green' :
                        post.status === 'pending' ? 'badge-amber' : 'badge-rose'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'analytics' && <Analytics clientId={id} />}
        {activeTab === 'calendar' && <Calendar clientId={id} />}
        {activeTab === 'content' && <ContentLibrary clientId={id} />}
        {activeTab === 'reports' && <Reports clientId={id} />}
      </div>
    </div>
  );
}
