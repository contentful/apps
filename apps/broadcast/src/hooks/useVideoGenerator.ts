import { useCallback, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';

// Single-threaded core avoids SharedArrayBuffer requirements in Contentful iframes.
const FFMPEG_CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
const FFMPEG_WASM_URL = `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`;
const LOCAL_WORKER_URL = '/ffmpeg-core.worker.js';

type GenerateVideoInput = {
  imageUrl: string;
  audioUrl: string;
};

const normalizeAssetUrl = (url: string) => (url.startsWith('//') ? `https:${url}` : url);

const fetchBinary = async (url: string, label: string) => {
  const normalizedUrl = normalizeAssetUrl(url);

  try {
    const response = await fetch(normalizedUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`${label} download failed (HTTP ${response.status}).`);
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `${label} download failed. Ensure the asset is published and CORS-accessible. (${message})`
    );
  }
};

const safelyDeleteFile = async (ffmpeg: FFmpeg, path: string) => {
  try {
    await ffmpeg.deleteFile(path);
  } catch {
    // Ignore cleanup errors to avoid masking the main failure.
  }
};

export const useVideoGenerator = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && isReady) {
      return;
    }

    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }

    if (!loadPromiseRef.current) {
      loadPromiseRef.current = (async () => {
        await ffmpegRef.current!.load({
          coreURL,
          wasmURL: FFMPEG_WASM_URL,
          workerURL: LOCAL_WORKER_URL,
        });

        setIsReady(true);
      })();
    }

    await loadPromiseRef.current;
  }, [isReady]);

  const generateVideo = useCallback(
    async ({ imageUrl, audioUrl }: GenerateVideoInput): Promise<Blob> => {
      setIsLoading(true);
      try {
        await loadFFmpeg();

        const ffmpeg = ffmpegRef.current!;
        const [imageData, audioData] = await Promise.all([
          fetchBinary(imageUrl, 'Image'),
          fetchBinary(audioUrl, 'Audio'),
        ]);

        await ffmpeg.writeFile('input.jpg', imageData);
        await ffmpeg.writeFile('audio.mp3', audioData);
        await ffmpeg.exec([
          '-loop',
          '1',
          '-i',
          'input.jpg',
          '-i',
          'audio.mp3',
          '-c:v',
          'libx264',
          '-tune',
          'stillimage',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-pix_fmt',
          'yuv420p',
          '-shortest',
          'output.mp4',
        ]);

        const outputData = await ffmpeg.readFile('output.mp4');
        return new Blob([outputData], { type: 'video/mp4' });
      } finally {
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg) {
          await Promise.all([
            safelyDeleteFile(ffmpeg, 'input.jpg'),
            safelyDeleteFile(ffmpeg, 'audio.mp3'),
            safelyDeleteFile(ffmpeg, 'output.mp4'),
          ]);
        }
        setIsLoading(false);
      }
    },
    [loadFFmpeg]
  );

  return { generateVideo, isLoading, isReady };
};
