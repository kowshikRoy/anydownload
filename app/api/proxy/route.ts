import { NextResponse } from 'next/server';
import { getBinaryPath, getYtDlp } from '@/lib/yt-dlp';

function nodeStreamToIterator(stream: any) {
  return async function* () {
    for await (const chunk of stream) {
      yield chunk;
    }
  }();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const itag = searchParams.get('itag');
  const filename = searchParams.get('filename') || 'download.mp4';
  const disposition = searchParams.get('disposition') === 'inline' ? 'inline' : 'attachment';

  if (!videoId || !itag) {
    return NextResponse.json({ error: 'Missing videoId or itag' }, { status: 400 });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const ytDlpWrap = await getYtDlp();

    const headers = new Headers();
    headers.set('Content-Disposition', `${disposition}; filename="${filename}"`);
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
