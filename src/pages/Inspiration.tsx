import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi, contentApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import {
  Sparkles, TrendingUp, Users, Lightbulb, Bookmark, BookmarkCheck,
  RefreshCw, Filter, Zap, Target, Film, Image, BookOpen, Layout
} from 'lucide-react';

const GOALS = ['engagement', 'reach', 'conversions', 'brand-awareness', 'community'];
const PLATFORMS = ['instagram', 'facebook', 'both'];
const CONTENT_TYPES = ['post', 'reel', 'story', 'carousel', 'mixed'];
const INDUSTRIES = ['e-commerce', 'fitness', 'food', 'beauty', 'tech', 'fashion', 'real estate', 'education', 'finance', 'health'];

const TYPE_ICONS: Record<string, any> = {
  post: Image, reel: Film, story: BookOpen, carousel: Layout, mixed: Sparkles,
};

export default function Inspiration() {
  const { clients, selectedClientId } = useAppStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ideas' | 'trends' | 'competitor'>('ideas');
  const [clientId, setClientId] = useState(selectedClientId || '');
  const [filters, setFilters] = useState({
    industry: '', goal: 'engagement', platform: 'instagram', contentType: 'mixed', count: 6,
  });
  const [ideas, setIdeas] = useState<any[]>([]);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorResult, setCompetitorResult] = useState<any>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data: savedIdeas = [] } = useQuery({
    queryKey: ['content-ideas', clientId],
    queryFn: () => contentApi.getIdeas(clientId),
    enabled: !!clientId,
  });

  const ideaMutation = useMutation({
    mutationFn: () => aiApi.generateIdeas({ ...filters, clientId: clientId || undefined }),
    onSuccess: (data) => setIdeas(data || []),
  });

  const competitorMutation = useMutation({
    mutationFn: () => aiApi.analyzeCompetitor({
      competitorUrl, clientId: clientId || undefined, platform: filters.platform
    }),
    onSuccess: (data) => setCompetitorResult(data),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => contentApi.saveIdea(id, saved),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-ideas', clientId] }),
  });

  const trendData = [
    { category: 'Reels', trend: 'Before & After Transformations', engagement: '+234%', hot: true },
    { category: 'Reels', trend: 'POV / Day-in-the-life', engagement: '+187%', hot: true },
    { category: 'Carousel', trend: 'Educational Myth-Busting', engagement: '+143%', hot: false },
    { category: 'Post', trend: 'User-Generated Content Reposts', engagement: '+98%', hot: false },
    { category: 'Story', trend: 'Poll & Question Boxes', engagement: '+76%', hot: false },
    { category: 'Reel', trend: 'Trending Audio + Tutorial Mashup', engagement: '+221%', hot: true },
    { category: 'Carousel', trend: 'Step-by-Step How-To Guides', engagement: '+167%', hot: true },
    { category: 'Post', trend: 'Behind the Scenes / BTS', engagement: '+112%', hot: false },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Creative Inspiration</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-powered content ideas, trends & competitor insights</p>
      </motion.div>

      {/* Client Select */}
      <div className="flex items-center gap-4">
        <div className="max-w-xs flex-1">
          <select className="input-base" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">No client selected</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {[
            { id: 'ideas', label: 'Idea Generator', icon: Lightbulb },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'competitor', label: 'Competitor', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id ? 'bg-violet-500 text-white' : 'text-muted-foreground hover:bg-accent'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Idea Generator ── */}
      {activeTab === 'ideas' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" /> Generation Filters
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Industry</label>
                <select className="input-base text-sm" value={filters.industry}
                  onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))}>
                  <option value="">General</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Goal</label>
                <select className="input-base text-sm" value={filters.goal}
                  onChange={(e) => setFilters((f) => ({ ...f, goal: e.target.value }))}>
                  {GOALS.map((g) => <option key={g} value={g}>{g.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Platform</label>
                <select className="input-base text-sm" value={filters.platform}
                  onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Content Type</label>
                <select className="input-base text-sm" value={filters.contentType}
                  onChange={(e) => setFilters((f) => ({ ...f, contentType: e.target.value }))}>
                  {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <button
              className="btn-primary mt-4 w-full"
              onClick={() => ideaMutation.mutate()}
              disabled={ideaMutation.isPending}
            >
              {ideaMutation.isPending ? (
                <><RefreshCw size={14} className="animate-spin" /> Generating Ideas...</>
              ) : (
                <><Sparkles size={14} /> Generate {filters.count} Ideas</>
              )}
            </button>
          </div>

          {/* Ideas Grid */}
          {ideas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ideas.map((idea: any, i: number) => {
                const Icon = TYPE_ICONS[idea.contentType] || Sparkles;
                return (
                  <motion.div
                    key={i}
                    className="metric-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Icon size={16} className="text-violet-400" />
                      </div>
                      <span className="badge-violet text-[10px]">{idea.contentType}</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-2">{idea.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{idea.description}</p>
                    {idea.hook && (
                      <div className="bg-muted/40 rounded-lg p-2.5 mb-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Hook</p>
                        <p className="text-xs italic">"{idea.hook}"</p>
                      </div>
                    )}
                    {idea.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {idea.tags.map((tag: string) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Saved Ideas */}
          {savedIdeas.length > 0 && (
            <div className="metric-card">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <BookmarkCheck size={14} className="text-violet-400" /> Saved Ideas ({savedIdeas.length})
              </h3>
              <div className="space-y-2">
                {savedIdeas.filter((i: any) => i.isSaved).map((idea: any) => (
                  <div key={idea.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <Lightbulb size={14} className="text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{idea.title}</p>
                      <p className="text-xs text-muted-foreground">{idea.contentType} · {idea.platform}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Trends ── */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="metric-card">
            <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <TrendingUp size={14} className="text-violet-400" /> Trending Content Formats
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Based on current Instagram & Facebook engagement patterns</p>
            <div className="space-y-3">
              {trendData.map((trend, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-xl border border-border hover:border-violet-500/30 hover:bg-accent/20 transition-all"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-16 text-center">
                    <span className="badge-violet text-[10px]">{trend.category}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{trend.trend}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{trend.engagement}</p>
                    <p className="text-[10px] text-muted-foreground">vs avg</p>
                  </div>
                  {trend.hot && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-medium">
                      <Zap size={10} /> Hot
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Viral Hook Patterns */}
          <div className="metric-card">
            <h3 className="font-semibold text-sm mb-4">🔥 Viral Hook Patterns</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                'I spent [X] days doing [Y] — here\'s what happened',
                'Stop doing [X] if you want [Y]',
                '[Number] things I wish I knew before...',
                'The [adjective] truth about [topic]',
                'How I [achieved result] in [timeframe]',
                'Nobody talks about this [topic] hack',
              ].map((hook, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs italic text-muted-foreground">"{hook}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Competitor Analysis ── */}
      {activeTab === 'competitor' && (
        <div className="space-y-5">
          <div className="metric-card">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Target size={14} className="text-violet-400" /> Competitor Analysis
            </h3>
            <div className="flex gap-3">
              <input
                className="input-base flex-1"
                placeholder="Enter competitor Instagram or Facebook URL..."
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={() => competitorMutation.mutate()}
                disabled={!competitorUrl || competitorMutation.isPending}
              >
                {competitorMutation.isPending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {competitorMutation.isPending ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

          {competitorMutation.isPending && (
            <div className="metric-card text-center py-12">
              <Sparkles size={24} className="mx-auto text-violet-400 animate-pulse mb-3" />
              <p className="font-medium">Analyzing competitor...</p>
              <p className="text-xs text-muted-foreground mt-1">AI is reviewing content patterns and engagement</p>
            </div>
          )}

          {competitorResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="metric-card">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Content Themes</h4>
                  <ul className="space-y-1.5">
                    {competitorResult.contentThemes?.map((t: string, i: number) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />{t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="metric-card">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Top Formats</h4>
                  <ul className="space-y-1.5">
                    {competitorResult.topFormats?.map((f: string, i: number) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="metric-card">
                  <h4 className="text-xs font-semibold text-emerald-400 mb-3 uppercase tracking-wide">Their Strengths</h4>
                  <ul className="space-y-1.5">
                    {competitorResult.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5 shrink-0">+</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="metric-card">
                  <h4 className="text-xs font-semibold text-amber-400 mb-3 uppercase tracking-wide">Opportunities for You</h4>
                  <ul className="space-y-1.5">
                    {competitorResult.opportunities?.map((o: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5 shrink-0">→</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {competitorResult.engagementPatterns && (
                <div className="metric-card">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Engagement Patterns</h4>
                  <p className="text-sm">{competitorResult.engagementPatterns}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
