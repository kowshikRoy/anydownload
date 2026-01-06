'use client';

import { useState } from 'react';
import { useDownloader } from '@/hooks/useDownloader';
import { Search, Download, Loader2, Music, Video, AlertCircle, ExternalLink, Play, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function Home() {
  const [url, setUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { status, videoInfo, fetchInfo, getDownloadLink } = useDownloader();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      fetchInfo(url);
    }
  };

  // Helper to format duration
  const formatDuration = (seconds: string) => {
    const s = parseInt(seconds);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const remainingM = m % 60;
    const remainingS = s % 60;
    return h > 0
      ? `${h}:${remainingM.toString().padStart(2, '0')}:${remainingS.toString().padStart(2, '0')}`
      : `${remainingM}:${remainingS.toString().padStart(2, '0')}`;
  };

  const getFormatLabel = (f: any) => {
    if (f.hasVideo && f.hasAudio) return `${f.qualityLabel || 'Unknown'}`;
    if (f.hasVideo) return `${f.qualityLabel || 'Unknown'} (Video Only - No Sound)`;
    if (f.hasAudio) return `Audio Only (${f.container})`;
    return 'Unknown Format';
  };

  // Filter formats to show distinct options
  const bestFormats = videoInfo?.formats.reduce((acc: any[], f) => {
    const isDuplicate = acc.find(existing => existing.qualityLabel === f.qualityLabel && existing.hasAudio === f.hasAudio && existing.container === f.container);
    if (!isDuplicate) {
      // Filter out video-only formats (per user request "video only is not acceptivle")
      // We only keep:
      // 1. Video + Audio
      // 2. Audio Only (for music)
      if (f.hasVideo && !f.hasAudio) return acc;
      acc.push(f);
    }
    return acc;
  }, []).sort((a, b) => {
    // Prioritize Video+Audio formats
    if (a.hasVideo && a.hasAudio && (!b.hasVideo || !b.hasAudio)) return -1;
    if (b.hasVideo && b.hasAudio && (!a.hasVideo || !a.hasAudio)) return 1;

    // Then sort by resolution
    const getRes = (f: any) => parseInt(f.qualityLabel) || 0;
    return getRes(b) - getRes(a);
  }).slice(0, 12) || []; 

  const handleShare = (itag: number) => {
    if (!videoInfo) return;
    const shareUrl = `${window.location.origin}/watch?v=${videoInfo.videoId}&itag=${itag}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(itag.toString());
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            AnyDownload
          </h1>
          <p className="text-slate-400">Direct Download Links for YouTube</p>
        </motion.div>

        {/* Search Input */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="w-full relative group"
        >
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Paste Link (YouTube, Facebook, Instagram...)"
            className="w-full bg-slate-900/50 border border-slate-800 backdrop-blur-md rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={status.step === 'fetching_info'}
            className="absolute inset-y-2 right-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 rounded-xl font-medium transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.step === 'fetching_info' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Go'}
          </button>
        </motion.form>

        {status.step === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <p>{status.message}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {videoInfo && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative w-full md:w-48 aspect-video rounded-xl overflow-hidden shadow-lg group shrink-0">
                    <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-xs px-2 py-1 rounded-md font-mono">
                      {formatDuration(videoInfo.lengthSeconds)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold line-clamp-2 mb-2">{videoInfo.title}</h2>
                    <p className="text-slate-400 text-sm">Select a format below to download directly.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {bestFormats.map((f: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800 transition-all group"
                      >
                        <div className={clsx("p-2 rounded-lg shrink-0", f.hasVideo ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>
                          {f.hasVideo ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{getFormatLabel(f)}</div>
                          <div className="text-xs text-slate-500 flex gap-2">
                            <span>{f.container.toUpperCase()}</span>
                            <span>•</span>
                            <span>{f.contentLength ? (parseInt(f.contentLength) / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown Size'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={getDownloadLink(f, videoInfo, 'view')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-slate-700 hover:bg-purple-600 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
                            title="Watch in Browser"
                          >
                            <Play className="w-4 h-4" />
                            <span className="hidden sm:inline">Watch</span>
                          </a>
                          <a
                            href={getDownloadLink(f, videoInfo, 'download')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                          <button
                            onClick={() => handleShare(f.itag)}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
                            title="Share Watch Link"
                          >
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">{copiedId === f.itag.toString() ? 'Copied!' : 'Share'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
