import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../services/api';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Link, FileText, Sparkles, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface CalendarProps { clientId?: string; }

const CONTENT_TYPES = ['post', 'reel', 'story', 'facebook'];
const STATUS_OPTIONS = ['posted', 'pending', 'no-content'];

const statusConfig = {
  posted: { label: 'Posted', color: '#10b981', bg: 'bg-emerald-500/10', icon: CheckCircle },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'bg-amber-500/10', icon: Clock },
  'no-content': { label: 'No Content', color: '#f43f5e', bg: 'bg-rose-500/10', icon: AlertCircle },
};

function EntryModal({
  date,
  entry,
  clientId,
  onClose,
}: {
  date: Date;
  entry?: any;
  clientId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    contentType: entry?.contentType || 'post',
    status: entry?.status || 'pending',
    postLink: entry?.postLink || '',
    caption: entry?.caption || '',
    notes: entry?.notes || '',
    title: entry?.title || '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(entry?.screenshotPath ? `/storage/screenshots/${entry.screenshotPath}` : null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    onDrop: (files) => {
      if (files[0]) {
        setFile(files[0]);
        setPreview(URL.createObjectURL(files[0]));
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('clientId', clientId);
      fd.append('date', date.toISOString());
      if (file) fd.append('screenshot', file);
      if (entry?.id) return calendarApi.update(entry.id, fd);
      return calendarApi.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', clientId] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => calendarApi.delete(entry.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', clientId] });
      onClose();
    },
  });

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
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold">{entry ? 'Edit Entry' : 'New Content Entry'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Screenshot Drop Zone */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Screenshot</label>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview} alt="preview" className="w-full h-40 object-cover" />
                <button
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  onClick={() => { setPreview(null); setFile(null); }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-violet-500 bg-violet-500/5' : 'border-border hover:border-violet-500/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload size={20} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drop screenshot here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP up to 10MB</p>
              </div>
            )}
          </div>

          {/* Content Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Content Type</label>
              <select
                className="input-base"
                value={form.contentType}
                onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))}
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
              <select
                className="input-base"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{statusConfig[s as keyof typeof statusConfig].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Title</label>
            <input
              className="input-base"
              placeholder="Content title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Post Link */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Link size={11} /> Post Link
            </label>
            <input
              className="input-base"
              placeholder="https://instagram.com/p/..."
              value={form.postLink}
              onChange={(e) => setForm((f) => ({ ...f, postLink: e.target.value }))}
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Caption</label>
            <textarea
              className="input-base resize-none"
              rows={3}
              placeholder="Post caption..."
              value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <FileText size={11} /> Notes
            </label>
            <textarea
              className="input-base resize-none"
              rows={2}
              placeholder="Internal notes..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {saveMutation.isError && (
            <p className="text-rose-400 text-xs">Failed to save. Please try again.</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {entry && (
              <button
                className="px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={14} />
              </button>
            )}
            <button className="btn-secondary flex-1 text-xs" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary flex-1 text-xs"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : entry ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Calendar({ clientId: propClientId }: CalendarProps) {
  const { id: paramId } = useParams();
  const clientId = propClientId || paramId;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: entries = [] } = useQuery({
    queryKey: ['calendar', clientId, year, month + 1],
    queryFn: () => calendarApi.getEntries(clientId!, { month: month + 1, year }),
    enabled: !!clientId,
  });

  const { data: consistency } = useQuery({
    queryKey: ['consistency', clientId],
    queryFn: () => calendarApi.getConsistency(clientId!),
    enabled: !!clientId,
  });

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getEntriesForDay = (day: number) =>
    entries.filter((e: any) => new Date(e.date).getDate() === day);

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  if (!clientId) return <div className="p-6 text-muted-foreground">Select a client to view the calendar</div>;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Content Calendar</h2>
          <p className="text-xs text-muted-foreground">Track posted content per day</p>
        </div>

        {consistency && consistency.alerts?.length > 0 && (
          <div className="flex gap-2">
            {consistency.alerts.slice(0, 2).map((alert: any, i: number) => (
              <div key={i} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                alert.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                <AlertCircle size={11} />
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consistency Stats */}
      {consistency && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Posts This Month', value: consistency.posted },
            { label: 'Days Since Last Post', value: consistency.daysSinceLastPost ?? '—' },
            { label: 'Reels This Month', value: consistency.reelsCount },
            { label: 'Consistency Score', value: `${Math.round((consistency.posted / 30) * 100)}%` },
          ].map((stat) => (
            <div key={stat.label} className="metric-card text-center py-3">
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="metric-card p-0 overflow-hidden">
        {/* Month Nav */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            className="btn-secondary text-xs px-3 py-1.5"
            onClick={() => setCurrentDate(new Date(year, month - 1))}
          >
            ← Prev
          </button>
          <h3 className="font-semibold">{monthNames[month]} {year}</h3>
          <button
            className="btn-secondary text-xs px-3 py-1.5"
            onClick={() => setCurrentDate(new Date(year, month + 1))}
          >
            Next →
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEntries = day ? getEntriesForDay(day) : [];
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isPast = day ? new Date(year, month, day) < new Date(new Date().setHours(0,0,0,0)) : false;

            return (
              <div
                key={i}
                className={`min-h-[90px] border-r border-b border-border p-2 cursor-pointer transition-colors relative group ${
                  !day ? 'opacity-0 cursor-default' : 'hover:bg-accent/30'
                } ${isToday ? 'bg-violet-500/5' : ''}`}
                onClick={() => {
                  if (day) {
                    setSelectedDate(new Date(year, month, day));
                    setSelectedEntry(null);
                  }
                }}
              >
                {day && (
                  <>
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-violet-500 text-white' : 'text-muted-foreground'
                    }`}>
                      {day}
                    </span>

                    <div className="mt-1 space-y-0.5">
                      {dayEntries.slice(0, 3).map((entry: any) => {
                        const cfg = statusConfig[entry.status as keyof typeof statusConfig] || statusConfig.pending;
                        return (
                          <div
                            key={entry.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${cfg.bg}`}
                            style={{ color: cfg.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(new Date(year, month, day));
                              setSelectedEntry(entry);
                            }}
                          >
                            {entry.contentType}
                          </div>
                        );
                      })}
                      {dayEntries.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">+{dayEntries.length - 3} more</div>
                      )}
                    </div>

                    {/* Add button on hover */}
                    {dayEntries.length === 0 && (
                      <div className="absolute inset-0 items-center justify-center hidden group-hover:flex">
                        <span className="text-xs text-muted-foreground">+ Add</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 p-3 border-t border-border">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.color, opacity: 0.7 }} />
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && (
          <EntryModal
            date={selectedDate}
            entry={selectedEntry}
            clientId={clientId}
            onClose={() => { setSelectedDate(null); setSelectedEntry(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
