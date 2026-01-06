import { NextResponse } from 'next/server';
import { getYtDlp, ensureCookies } from '@/lib/yt-dlp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const ytDlp = await getYtDlp();
    const cookiesPath = ensureCookies();

    const args = [
      url,
      '--dump-json',
      '--no-playlist',
      '--no-cache-dir',
      // Explicitly use node for deciphering
      '--js-runtimes', 'node',
      // Get all formats
      '-f', 'all'
    ];

    if (cookiesPath) {
      args.push('--cookies', cookiesPath);
      // With cookies, we can use the default client or android
      args.push('--extractor-args', 'youtube:player_client=android');
    } else {
      // Without cookies, use TV client as a fallback to bypass bot detection on Vercel
      args.push('--extractor-args', 'youtube:player_client=tv');
    }

    const metadata = await ytDlp.execPromise(args);

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
