import YoutubeDlWrap from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';

// Fix for ESM default import
const YTDlpWrap = (YoutubeDlWrap as any).default || YoutubeDlWrap;

export const getBinaryPath = async () => {
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

export const getYtDlp = async () => {
  const binaryPath = await getBinaryPath();
  return new YTDlpWrap(binaryPath);
};
