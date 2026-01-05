import { NextResponse } from 'next/server';
import YoutubeDlWrap from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';

// Fix for ESM default import
const YTDlpWrap = YoutubeDlWrap.default || YoutubeDlWrap;

function nodeStreamToIterator(stream: any) {
  return async function* () {
    for await (const chunk of stream) {
      yield chunk;
    }
  }();
}

const getBinaryPath = async () => {
  // Try local path first (project root)
  let binaryPath = path.join(process.cwd(), 'yt-dlp');
  if (fs.existsSync(binaryPath)) return binaryPath;

  // Check /tmp (for serverless environments)
  binaryPath = path.join('/tmp', 'yt-dlp');
  if (fs.existsSync(binaryPath)) return binaryPath;

  // Download if missing
  console.log('Downloading yt-dlp binary to ' + binaryPath);
  await YTDlpWrap.downloadFromGithub(binaryPath, undefined, process.platform);
  fs.chmodSync(binaryPath, '755');
  return binaryPath;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const itag = searchParams.get('itag');
  const filename = searchParams.get('filename') || 'download.mp4';

  if (!videoId || !itag) {
    return NextResponse.json({ error: 'Missing videoId or itag' }, { status: 400 });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const binaryPath = await getBinaryPath();
    const ytDlpWrap = new YTDlpWrap(binaryPath);

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Type', 'video/mp4');

    // Create stream
    const stream = ytDlpWrap.execStream([
      videoUrl,
      '-f', itag,
    ]);

    // Log errors from stderr
    // stream.stderr.on('data', (d) => console.log('yt-dlp stderr:', d.toString()));

    // Prepare Web Stream
    const iterator = nodeStreamToIterator(stream);
    // @ts-ignore
    const webStream = ReadableStream.from(iterator);

    return new NextResponse(webStream, {
      headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Stream failed' }, { status: 500 });
  }
}
