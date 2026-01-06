import { Metadata } from 'next';
import ytdl from '@distube/ytdl-core';
import { Download, Play, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

// Force dynamic rendering to handle searchParams
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getVideoInfo(videoId: string) {
  try {
    if (!ytdl.validateID(videoId)) return null;
    const info = await ytdl.getInfo(videoId);
    return info.videoDetails;
  } catch (error) {
    console.error('Error fetching video info:', error);
    return null;
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const v = typeof params.v === 'string' ? params.v : '';

  if (!v) return { title: 'AnyDownload - Watch Video' };

  const info = await getVideoInfo(v);
  if (!info) return { title: 'Video Not Found - AnyDownload' };

  return {
    title: `${info.title} - AnyDownload`,
    description: `Watch ${info.title} on AnyDownload`,
    openGraph: {
      title: info.title,
      description: `Watch ${info.title} directly in your browser.`,
      images: [
        {
          url: info.thumbnails[info.thumbnails.length - 1].url,
          width: 1280,
          height: 720,
        },
      ],
      type: 'video.other',
    },
  };
}

export default async function WatchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const v = typeof params.v === 'string' ? params.v : '';
  const itag = typeof params.itag === 'string' ? params.itag : '';

  if (!v || !itag) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <p>Invalid Video URL. Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  const info = await getVideoInfo(v);

  // Construct proxy URL
  // We need safe filename
  const safeTitle = info ? info.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50) : 'video';
  const downloadSrc = `/api/proxy?videoId=${v}&itag=${itag}&filename=${encodeURIComponent(safeTitle)}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 hover:opacity-80 transition-opacity"
          >
            AnyDownload
          </Link>
        </div>

        <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative group">
          <iframe
            src={`https://www.youtube.com/embed/${v}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h1 className="text-xl md:text-2xl font-bold mb-4 line-clamp-2">{info?.title || 'Loading title...'}</h1>

          <div className="flex flex-wrap gap-4">
            <a
              href={downloadSrc}
              className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Download className="w-5 h-5" />
              <span>Download File</span>
            </a>
            <Link
              href="/"
              className="flex-1 min-w-[140px] bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              <span>Download Another</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
