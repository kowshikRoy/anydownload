import { useState } from 'react';

interface VideoFormat {
  itag: number;
  qualityLabel: string;
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
  url: string;
  contentLength?: string;
  quality: string;
}

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  lengthSeconds: string;
  formats: VideoFormat[];
}

interface DownloadStatus {
  step: 'idle' | 'fetching_info' | 'error';
  message?: string;
}

export function useDownloader() {
  const [status, setStatus] = useState<DownloadStatus>({ step: 'idle' });
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const fetchInfo = async (url: string) => {
    try {
      setStatus({ step: 'fetching_info', message: 'Accessing video metadata...' });
      setVideoInfo(null);

      const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Failed to fetch video info');

      const data = await res.json();
      setVideoInfo(data);
      setStatus({ step: 'idle' });
    } catch (error) {
      console.error(error);
      setStatus({ step: 'error', message: 'Failed to find video. Check URL.' });
    }
  };

  const getDownloadLink = (format: VideoFormat, videoInfo: VideoInfo) => {
    const filename = `${videoInfo.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.${format.container}`;
    return `/api/proxy?videoId=${encodeURIComponent(videoInfo.videoId)}&itag=${format.itag}&filename=${encodeURIComponent(filename)}`;
  };

  return {
    status,
    videoInfo,
    fetchInfo,
    getDownloadLink
  };
}
