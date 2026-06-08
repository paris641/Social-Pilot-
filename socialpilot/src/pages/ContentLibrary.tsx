import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../services/api';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trash2, ExternalLink, Film, Image, BookOpen, Facebook, Plus } from 'lucide-react';

interface ContentLibraryProps { clientId?: string; }

const TYPE_ICONS: Record<string, any> = {
  post: Image,
  reel: Film,
  story: BookOpen,
  facebook: Facebook,
};

const TYPE_COLORS: Record<string, string> = {
  post: 'text-violet-400',
  reel: 'text-pink-400',
  story: 'text-amber-400',
  facebook: 'text-blue-400',
};

function AddContentModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', contentType: 'post', platform: 'instagram',
    caption: '', postLink: '', tags: '',
  });

  const mutation = useMutation({
    mutationFn: () => contentApi.create({ ...form, clientId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content', clientId] });
      onClose();
    },
  });

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-card border border-border rounded-2xl w-full max-w-md"
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold">Add Content Item</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Content Type</label>
              <select className="input-base" value={form.contentType}
                onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))}>
                {['post', 'reel', 'story', 'facebook'].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Platform</label>
              <select className="input-base" value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Title</label>
            <input className="input-base" placeholder="Content title" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Post Link</label>
            <input className="input-base" placeholder="https://..." value={form.postLink}
              onChange={(e) => setForm((f) => ({ ...f, postLink: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Caption</label>
            <textarea className="input-base resize-none" rows={3} value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Tags (comma separated)</label>
            <input className="input-base" placeholder="marketing, brand, promo" value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ContentLibrary({ clientId: propClientId }: ContentLibraryProps) {
  const { id: paramId } = useParams();
  const clientId = propClientId || paramId;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['content', clientId, filterType],
    queryFn: () => contentApi.getItems(clientId!, { contentType: filterType || undefined }),
    enabled: !!clientId,
  });

  const deleteMutation = useMutation({
    mutationFn: contentApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', clientId] }),
  });

  const filtered = items.filter((item: any) =>
    !search ||
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.caption?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by month
  const grouped = filtered.reduce((acc: any, item: any) => {
    const month = item.postedAt
      ? new Date(item.postedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  if (!clientId) return <div className="p-6 text-muted-foreground">Select a client to view content library</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Content Library</h2>
          <p className="text-xs text-muted-foreground">{items.length} items stored</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Content
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-base pl-8 text-sm" placeholder="Search content..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {['', 'post', 'reel', 'story', 'facebook'].map((type) => (
            <button
              key={type}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === type ? 'bg-violet-500 text-white' : 'btn-secondary'
              }`}
              onClick={() => setFilterType(type)}
            >
              {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 metric-card">
          <Image size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">No content yet</p>
          <p className="text-sm text-muted-foreground">Add your first content item</p>
          <button className="btn-primary mt-4" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Content
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([month, monthItems]: [string, any]) => (
          <div key={month}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{month}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {(monthItems as any[]).map((item: any, i: number) => {
                const Icon = TYPE_ICONS[item.contentType] || Image;
                const color = TYPE_COLORS[item.contentType] || 'text-violet-400';
                return (
                  <motion.div
                    key={item.id}
                    className="metric-card p-0 overflow-hidden group"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    {/* Thumbnail or Placeholder */}
                    <div className="h-32 bg-muted relative flex items-center justify-center">
                      {item.thumbnailPath ? (
                        <img src={`/storage/clients/${item.thumbnailPath}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <Icon size={28} className={`${color} opacity-40`} />
                      )}
                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {item.postLink && (
                          <a href={item.postLink} target="_blank" rel="noreferrer"
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button
                          className="p-2 rounded-full bg-white/20 hover:bg-rose-500/60 text-white transition-colors"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={11} className={color} />
                        <span className={`text-[10px] font-medium uppercase tracking-wide ${color}`}>
                          {item.contentType}
                        </span>
                      </div>
                      <p className="text-xs font-medium truncate">{item.title || 'Untitled'}</p>
                      {item.caption && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.caption}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <AnimatePresence>
        {showAdd && <AddContentModal clientId={clientId} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
