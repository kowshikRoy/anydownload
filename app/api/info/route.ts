import { NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    if (!ytdl.validateURL(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const videoFormats = ytdl.filterFormats(info.formats, 'videoonly');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    return NextResponse.json({
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      lengthSeconds: info.videoDetails.lengthSeconds,
      formats: [...formats, ...videoFormats, ...audioFormats].map((f) => ({
        itag: f.itag,
        qualityLabel: f.qualityLabel,
        container: f.container,
        hasVideo: f.hasVideo,
        hasAudio: f.hasAudio,
        url: f.url,
        contentLength: f.contentLength,
        quality: f.quality,
      })),
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    return NextResponse.json({ error: 'Failed to fetch video info' }, { status: 500 });
  }
}
