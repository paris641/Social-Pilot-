import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, aiApi } from '../services/api';
import { useParams } from 'react-router-dom';
import { FileText, Plus, Download, Trash2, Sparkles, Calendar, BarChart2 } from 'lucide-react';

interface ReportsProps { clientId?: string; }

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

export default function Reports({ clientId: propClientId }: ReportsProps) {
  const { id: paramId } = useParams();
  const clientId = propClientId || paramId;
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState('');
  const [metrics, setMetrics] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: reports = [] } = useQuery({
    queryKey: ['reports', clientId],
    queryFn: () => reportsApi.getForClient(clientId!),
    enabled: !!clientId,
  });

  const createMutation = useMutation({
    mutationFn: () => reportsApi.create({
      clientId, month: selectedMonth, year: selectedYear, summary, metrics,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports', clientId] });
      setShowCreate(false);
      setSummary('');
      setMetrics(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reportsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', clientId] }),
  });

  const handleGenerateAI = async () => {
    if (!clientId) return;
    setIsGenerating(true);
    try {
      const result = await aiApi.generateReportSummary({
        clientId, month: selectedMonth, year: selectedYear,
      });
      setSummary(result.summary || '');
      setMetrics(result.metrics || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!clientId) return <div className="p-6 text-muted-foreground">Select a client to view reports</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Monthly Reports</h2>
          <p className="text-xs text-muted-foreground">{reports.length} reports generated</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="metric-card text-center py-16">
          <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">No reports yet</p>
          <p className="text-sm text-muted-foreground">Generate your first monthly report</p>
          <button className="btn-primary mt-4" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create First Report
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report: any, i: number) => {
            let parsedMetrics: any = {};
            try { parsedMetrics = report.metrics ? JSON.parse(report.metrics) : {}; } catch {}

            return (
              <motion.div
                key={report.id}
                className="metric-card flex items-center gap-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{report.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generated {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                  {report.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.summary}</p>
                  )}
                </div>

                {/* Quick metrics */}
                <div className="flex gap-4 shrink-0">
                  {parsedMetrics.postedPosts !== undefined && (
                    <div className="text-center">
                      <p className="text-lg font-bold">{parsedMetrics.postedPosts}</p>
                      <p className="text-[10px] text-muted-foreground">Posts</p>
                    </div>
                  )}
                  {parsedMetrics.avgEngagement !== undefined && (
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">{parsedMetrics.avgEngagement?.toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">Engagement</p>
                    </div>
                  )}
                  {parsedMetrics.followerGrowth !== undefined && (
                    <div className="text-center">
                      <p className={`text-lg font-bold ${parsedMetrics.followerGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {parsedMetrics.followerGrowth >= 0 ? '+' : ''}{parsedMetrics.followerGrowth}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <a
                    href={reportsApi.downloadPdf(report.id)}
                    download
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <Download size={12} /> PDF
                  </a>
                  <button
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 transition-colors"
                    onClick={() => deleteMutation.mutate(report.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Report Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h2 className="font-bold">Create Monthly Report</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Generate an AI-powered performance report</p>
                </div>
                <button className="text-muted-foreground hover:text-foreground text-xl" onClick={() => setShowCreate(false)}>×</button>
              </div>

              <div className="p-5 space-y-4">
                {/* Month / Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Month</label>
                    <select className="input-base" value={selectedMonth}
                      onChange={(e) => setSelectedMonth(+e.target.value)}>
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Year</label>
                    <select className="input-base" value={selectedYear}
                      onChange={(e) => setSelectedYear(+e.target.value)}>
                      {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {/* AI Generate */}
                <button
                  className="btn-primary w-full"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <><Sparkles size={14} className="animate-pulse" /> Generating AI Summary...</>
                  ) : (
                    <><Sparkles size={14} /> Generate with AI</>
                  )}
                </button>

                {/* Metrics preview */}
                {metrics && (
                  <div className="metric-card bg-muted/20 grid grid-cols-3 gap-3 text-center p-3">
                    <div>
                      <p className="text-lg font-bold">{metrics.postedPosts}</p>
                      <p className="text-[10px] text-muted-foreground">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-400">{metrics.avgEngagement?.toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">Engagement</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${metrics.followerGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {metrics.followerGrowth >= 0 ? '+' : ''}{metrics.followerGrowth}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                  </div>
                )}

                {/* Summary text */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Executive Summary
                  </label>
                  <textarea
                    className="input-base resize-none"
                    rows={6}
                    placeholder="AI-generated summary will appear here, or write your own..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button
                    className="btn-primary flex-1"
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Saving...' : 'Save Report'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
