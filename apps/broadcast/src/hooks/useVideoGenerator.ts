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
    if (!buffer.byteLength) {
      throw new Error(`${label} download returned an empty file.`);
    }

    return new Uint8Array(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `${label} download failed. Ensure the asset is published and CORS-accessible. (${message})`
    );
  }
};

const getAudioDuration = async (audioBuffer: ArrayBuffer): Promise<number> => {
  const AudioContextCtor =
    window.AudioContext || (window as Window & { webkitAudioContext?: any }).webkitAudioContext;
  if (!AudioContextCtor) {
    return 0;
  }

  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(audioBuffer.slice(0));
    return decoded.duration;
  } finally {
    await context.close();
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
        const [imageData, audioBuffer] = await Promise.all([
          fetchBinary(imageUrl, 'Image'),
          (async () => {
            const normalizedUrl = normalizeAssetUrl(audioUrl);
            const response = await fetch(normalizedUrl, { mode: 'cors' });
            if (!response.ok) {
              throw new Error(`Audio download failed (HTTP ${response.status}).`);
            }
            const buffer = await response.arrayBuffer();
            if (!buffer.byteLength) {
              throw new Error('Audio download returned an empty file.');
            }
            return buffer;
          })(),
        ]);

        const audioDuration = await getAudioDuration(audioBuffer);
        if (!Number.isFinite(audioDuration) || audioDuration <= 0) {
          throw new Error('Audio duration could not be determined.');
        }

        const audioData = new Uint8Array(audioBuffer);

        await ffmpeg.writeFile('input.jpg', imageData);
        await ffmpeg.writeFile('audio.mp3', audioData);
        const fps = 30;
        const zoomPanFrames = Math.max(1, Math.ceil(audioDuration * fps));
        const filterComplex = [
          "[0:v]scale=1280:720,format=yuv420p,zoompan=z='min(zoom+0.0005,1.5)':d=" +
            zoomPanFrames +
            ':s=1280x720[v0]',
          '[1:a]showwaves=s=1280x200:mode=cline:colors=white@0.9:scale=sqrt,format=yuva420p,colorchannelmixer=aa=0.8[wave]',
          '[v0][wave]overlay=x=0:y=H-h-24:shortest=1[outv]',
        ].join(';');

        const exitCode = await ffmpeg.exec([
          '-loop',
          '1',
          '-i',
          'input.jpg',
          '-i',
          'audio.mp3',
          '-filter_complex',
          filterComplex,
          '-map',
          '[outv]',
          '-map',
          '1:a',
          '-t',
          audioDuration.toFixed(3),
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
          '-movflags',
          '+faststart',
          'output.mp4',
        ]);

        if (exitCode !== 0) {
          throw new Error(`FFmpeg exited with code ${exitCode}.`);
        }

        const outputData = await ffmpeg.readFile('output.mp4');
        if (!(outputData instanceof Uint8Array) || outputData.byteLength === 0) {
          throw new Error('FFmpeg produced an empty video file.');
        }

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
