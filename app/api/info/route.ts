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
