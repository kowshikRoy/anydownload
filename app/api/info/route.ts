import { NextResponse } from 'next/server';
import { getYtDlp } from '@/lib/yt-dlp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const ytDlp = await getYtDlp();
    const metadata = await ytDlp.execPromise([
      url,
      '--dump-json',
      '--no-playlist',
      // Explicitly use node for deciphering to fix "No supported JavaScript runtime"
      '--js-runtimes', 'node',
      // Use iOS client to minimize "Sign in to confirm you're not a bot" errors
      // Android client was failing with empty player responses
      '--extractor-args', 'youtube:player_client=ios',
      // Get all formats
      '-f', 'all'
    ]);

    const info = JSON.parse(metadata);

    // Normalize formats
    const formats = (info.formats || []).map((f: any) => ({
      itag: f.format_id, // Use format_id as itag replacement
      qualityLabel: f.resolution || f.quality || 'unknown',
      container: f.ext,
      hasVideo: f.vcodec !== 'none',
      hasAudio: f.acodec !== 'none',
      url: f.url,
      contentLength: f.filesize ? f.filesize.toString() : undefined,
      quality: f.quality,
    }));

    return NextResponse.json({
      videoId: info.id,
      title: info.title,
      thumbnail: info.thumbnail,
      lengthSeconds: info.duration?.toString() || '0',
      formats: formats,
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    return NextResponse.json({ error: 'Failed to fetch video info' }, { status: 500 });
  }
}
