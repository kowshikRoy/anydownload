import YoutubeDlWrap from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';

// Fix for ESM default import
const YTDlpWrap = (YoutubeDlWrap as any).default || YoutubeDlWrap;

const getBinaryUrl = (platform: string) => {
  switch (platform) {
    case 'darwin':
      return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    case 'win32':
      return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    case 'linux':
      return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
    default:
      return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  }
};

const downloadBinary = async (filePath: string, platform: string) => {
  const url = getBinaryUrl(platform);
  console.log('Downloading yt-dlp binary from ' + url);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to download yt-dlp: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
};

export const getBinaryPath = async () => {
  // Try local path first (project root)
  // This allows developers to override the binary by placing it in the root
  let binaryPath = path.join(process.cwd(), 'yt-dlp');
  if (fs.existsSync(binaryPath)) return binaryPath;

  // Check /tmp (for serverless environments)
  binaryPath = path.join('/tmp', 'yt-dlp');
  if (fs.existsSync(binaryPath)) {
    // Validate size to ensure it's not the Python script version (which requires external python)
    // Standalone binaries are usually > 10MB. Python script/zipapp is smaller.
    const stats = fs.statSync(binaryPath);
    if (stats.size > 5 * 1024 * 1024) {
      return binaryPath;
    }
    console.log('Existing yt-dlp binary is too small (' + stats.size + ' bytes). Re-downloading standalone binary...');
    try {
      fs.unlinkSync(binaryPath);
    } catch (e) {
      console.warn('Failed to delete existing binary:', e);
    }
  }

  // Download if missing
  console.log('Downloading yt-dlp binary to ' + binaryPath);
  await downloadBinary(binaryPath, process.platform);

  // Ensure executable permissions
  fs.chmodSync(binaryPath, '755');
  return binaryPath;
};

export const getYtDlp = async () => {
  const binaryPath = await getBinaryPath();
  return new YTDlpWrap(binaryPath);
};
