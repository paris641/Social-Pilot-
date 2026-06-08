import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Archive, Trash2, MoreHorizontal, Instagram, Facebook,
  Activity, TrendingUp, Calendar, X, AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

function AddClientModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', brandName: '', industry: '', contactPerson: '',
    email: '', phone: '', instagramUrl: '', facebookUrl: '', notes: '',
  });
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.brandName) return;
    mutation.mutate(form);
  };

  const fields = [
    { key: 'name', label: 'Client Name', required: true, placeholder: 'Acme Corp' },
    { key: 'brandName', label: 'Brand Name', required: true, placeholder: 'Acme' },
    { key: 'industry', label: 'Industry', placeholder: 'E-commerce, Fitness...' },
    { key: 'contactPerson', label: 'Contact Person', placeholder: 'John Smith' },
    { key: 'email', label: 'Email', placeholder: 'john@acme.com', type: 'email' },
    { key: 'phone', label: 'Phone', placeholder: '+1 234 567 890' },
    { key: 'instagramUrl', label: 'Instagram URL', placeholder: 'https://instagram.com/acme' },
    { key: 'facebookUrl', label: 'Facebook URL', placeholder: 'https://facebook.com/acme' },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">Add New Client</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in the client details below</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className={field.key === 'instagramUrl' || field.key === 'facebookUrl' || field.key === 'notes' ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {field.label} {field.required && <span className="text-rose-400">*</span>}
                </label>
                <input
                  type={field.type || 'text'}
                  className="input-base"
                  placeholder={field.placeholder}
                  value={(form as any)[field.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  required={field.required}
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
              <textarea
                className="input-base resize-none"
                rows={3}
                placeholder="Additional notes about the client..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-rose-400 text-xs">Failed to create client. Please try again.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Clients() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setSelectedClientId } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      setConfirmDelete(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: clientsApi.archive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  const filtered = clients.filter(
    (c: any) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.brandName.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} total clients</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-base pl-9"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <Plus size={24} className="text-violet-400" />
          </div>
          <h3 className="font-semibold mb-1">No clients found</h3>
          <p className="text-muted-foreground text-sm">
            {search ? 'Try a different search term' : 'Add your first client to get started'}
          </p>
          {!search && (
            <button className="btn-primary mt-4" onClick={() => setShowAdd(true)}>
              Add Client
            </button>
          )}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filtered.map((client: any, i: number) => (
            <motion.div
              key={client.id}
              className="metric-card cursor-pointer group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                setSelectedClientId(client.id);
                navigate(`/clients/${client.id}`);
              }}
            >
              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-amber-400 transition-colors"
                  onClick={() => archiveMutation.mutate(client.id)}
                  title="Archive"
                >
                  <Archive size={13} />
                </button>
                <button
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-rose-400 transition-colors"
                  onClick={() => setConfirmDelete(client.id)}
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center text-lg font-bold text-violet-400">
                  {client.brandName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 pr-12">
                  <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                  <p className="text-xs text-muted-foreground">{client.brandName}</p>
                  {client.industry && (
                    <span className="badge-violet mt-1">{client.industry}</span>
                  )}
                </div>
              </div>

              {/* Platforms */}
              <div className="flex gap-2 mb-4">
                {client.instagramUrl && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Instagram size={12} className="text-pink-400" /> Instagram
                  </div>
                )}
                {client.facebookUrl && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Facebook size={12} className="text-blue-400" /> Facebook
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Posts</p>
                  <p className="font-semibold text-sm mt-0.5">{client.postsThisMonth || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Engagement</p>
                  <p className={`font-semibold text-sm mt-0.5 ${(client.engagement || 0) > 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {(client.engagement || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Health</p>
                  <p className={`font-semibold text-sm mt-0.5 ${
                    client.healthScore >= 70 ? 'text-emerald-400' :
                    client.healthScore >= 40 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {client.healthScore}
                  </p>
                </div>
              </div>

              {/* Health bar */}
              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${client.healthScore}%`,
                    background: client.healthScore >= 70 ? '#10b981' : client.healthScore >= 40 ? '#f59e0b' : '#f43f5e',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-rose-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Delete Client</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                All data for this client including analytics, calendar entries, and reports will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-rose-500 hover:bg-rose-400 text-white transition-colors"
                  onClick={() => deleteMutation.mutate(confirmDelete)}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && <AddClientModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
