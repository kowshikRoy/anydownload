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

    // Debug: Check binary version
    try {
      const version = await ytDlp.execPromise(['--version']);
      console.log('yt-dlp version:', version.trim());
    } catch (e) {
      console.error('Failed to get version:', e);
    }

    const cookiesPath = ensureCookies();
    console.log('Cookies configured:', cookiesPath ? 'YES' : 'NO');
    if (cookiesPath) {
      const stat = require('fs').statSync(cookiesPath);
      console.log('Cookies file size:', stat.size);
    }

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
    }
    // Always use Android client - it supports streams best if authenticated,
    // and if unauthenticated, it fails loudly (Sign in) rather than silently (MHTML)
    args.push('--extractor-args', 'youtube:player_client=android');

    // Capture both stdout and stderr (if possible with execPromise, otherwise we rely on error thrown)
    // execPromise usually only returns stdout. If it fails, it throws.
    // If it succeeds but returns partial data/warnings, we see it in metadata logs if we add them.
    const metadata = await ytDlp.execPromise(args);

    // Debug output length
    console.log('Metadata length:', metadata.length);
    if (metadata.length < 500) {
      console.log('Short metadata content:', metadata);
    }

    // yt-dlp --dump-json output can sometimes contain warnings or consist of multiple lines
    // We want the first valid JSON line that looks like a video info object
    let info: any = null;
    const lines = metadata.trim().split('\n');

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        // Basic validation to ensure it's a video info object (has id and title)
        if (parsed.id && parsed.title) {
          info = parsed;
          break;
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON lines
      }
    }

    if (!info) {
      // Fallback: try parsing the whole thing if lines failed (unlikely but safe)
      try {
        info = JSON.parse(metadata);
      } catch (e) {
        throw new Error('Failed to parse yt-dlp output. Metadata length: ' + metadata.length + '. First 100 chars: ' + metadata.substring(0, 100));
      }
    }

    // Normalize formats
    const formats = (info.formats || [])
      .filter((f: any) => f.ext !== 'mhtml') // Filter out broken MHTML formats
      .map((f: any) => ({
      itag: f.format_id, // Use format_id as itag replacement
        qualityLabel: f.format_note || f.resolution || f.quality || 'unknown', // Use format_note (e.g. 1080p) first
      container: f.ext,
      hasVideo: f.vcodec !== 'none',
      hasAudio: f.acodec !== 'none',
      url: f.url,
        contentLength: f.filesize ? f.filesize.toString() : (f.filesize_approx ? f.filesize_approx.toString() : undefined),
      quality: f.quality,
    }));

    if (formats.length === 0) {
      throw new Error('No valid formats found. This usually means YouTube bot detection is blocking requests from this IP. Please configure YOUTUBE_COOKIES.');
    }

    return NextResponse.json({
      videoId: info.id,
      title: info.title,
      thumbnail: info.thumbnail,
      lengthSeconds: info.duration?.toString() || '0',
      formats: formats,
    });
  } catch (error: any) {
    console.error('Error fetching video info:', error);
    const errorMessage = error?.message || '';

    // Check for specific bot detection messages
    if (errorMessage.includes('Sign in to confirm') || errorMessage.includes('cookies')) {
      return NextResponse.json({
        error: 'Bot detection triggered. Please configure YOUTUBE_COOKIES in Vercel settings.',
        details: 'YouTube requires authentication from this IP address.'
      }, { status: 403 });
    }

    return NextResponse.json({ error: errorMessage || 'Failed to fetch video info' }, { status: 500 });
  }
}
