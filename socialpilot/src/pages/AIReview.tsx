import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi, clientsApi } from '../services/api';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/appStore';
import {
  Upload, Sparkles, Eye, Palette, Megaphone, FileText,
  CheckCircle, XCircle, Lightbulb, ChevronDown
} from 'lucide-react';

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function AIReview() {
  const { clients, selectedClientId } = useAppStore();
  const [clientId, setClientId] = useState(selectedClientId || '');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    onDrop: (files) => {
      if (files[0]) {
        setFile(files[0]);
        setPreview(URL.createObjectURL(files[0]));
        setResult(null);
      }
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!file || !clientId) return;
      const fd = new FormData();
      fd.append('screenshot', file);
      fd.append('clientId', clientId);
      return aiApi.reviewScreenshot(fd);
    },
    onSuccess: (data) => setResult(data),
  });

  const { data: pastReviews = [] } = useQuery({
    queryKey: ['ai-reviews', clientId],
    queryFn: () => aiApi.getReviews(clientId),
    enabled: !!clientId,
  });

  const scoreColors = {
    overall: '#6366f1',
    design: '#06b6d4',
    marketing: '#10b981',
    content: '#f59e0b',
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">AI Screenshot Review</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a social media screenshot for AI-powered design, marketing, and content analysis
        </p>
      </motion.div>

      {/* Client Select */}
      <div className="max-w-xs">
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Client (optional)</label>
        <select className="input-base" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Select client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-violet-500 bg-violet-500/5 scale-[1.01]'
                : 'border-border hover:border-violet-500/50 hover:bg-accent/30'
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="preview" className="w-full max-h-64 object-contain rounded-xl" />
                <p className="text-xs text-muted-foreground">Click or drop to replace</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                  <Upload size={24} className="text-violet-400" />
                </div>
                <p className="font-medium text-sm">Drop screenshot here</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — up to 10MB</p>
              </>
            )}
          </div>

          <button
            className="btn-primary w-full"
            onClick={() => reviewMutation.mutate()}
            disabled={!file || !clientId || reviewMutation.isPending}
          >
            <Sparkles size={16} />
            {reviewMutation.isPending ? 'Analyzing with AI...' : 'Analyze Screenshot'}
          </button>

          {!clientId && file && (
            <p className="text-amber-400 text-xs text-center">Please select a client to save the review</p>
          )}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {reviewMutation.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="metric-card flex flex-col items-center justify-center gap-4 min-h-64"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Sparkles size={20} className="text-violet-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-medium">Analyzing your content...</p>
                <p className="text-xs text-muted-foreground mt-1">GPT-4 Vision is reviewing design, marketing, and content quality</p>
              </div>
              <div className="flex gap-1">
                {[0,1,2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Score Cards */}
              <div className="metric-card">
                <h3 className="text-sm font-semibold mb-4">Scores</h3>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Overall', score: result.overallScore, color: scoreColors.overall },
                    { label: 'Design', score: result.designScore, color: scoreColors.design },
                    { label: 'Marketing', score: result.marketingScore, color: scoreColors.marketing },
                    { label: 'Content', score: result.contentScore, color: scoreColors.content },
                  ].map(({ label, score, color }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <ScoreRing score={score} color={color} size={64} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div className="metric-card">
                <h3 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-3">
                  <CheckCircle size={13} /> Strengths
                </h3>
                <ul className="space-y-1.5">
                  {(result.parsed?.strengths || []).map((s: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="metric-card">
                <h3 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-3">
                  <XCircle size={13} /> Weaknesses
                </h3>
                <ul className="space-y-1.5">
                  {(result.parsed?.weaknesses || []).map((w: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="text-rose-400 mt-0.5 shrink-0">✗</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="metric-card">
                <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-3">
                  <Lightbulb size={13} /> Recommendations
                </h3>
                <ul className="space-y-1.5">
                  {(result.parsed?.recommendations || []).map((r: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="metric-card flex flex-col items-center justify-center gap-3 min-h-64 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Eye size={24} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">No Analysis Yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Upload a screenshot and click Analyze to get AI-powered feedback on design, marketing, and content quality
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Past Reviews */}
      {pastReviews.length > 0 && (
        <div className="metric-card">
          <h3 className="font-semibold text-sm mb-4">Review History</h3>
          <div className="space-y-3">
            {pastReviews.slice(0, 5).map((review: any) => (
              <div key={review.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: scoreColors.overall }}>{review.overallScore}</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Design', score: review.designScore, color: scoreColors.design },
                    { label: 'Marketing', score: review.marketingScore, color: scoreColors.marketing },
                    { label: 'Content', score: review.contentScore, color: scoreColors.content },
                  ].map(({ label, score, color }) => (
                    <div key={label}>
                      <p className="text-sm font-semibold" style={{ color }}>{score}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
