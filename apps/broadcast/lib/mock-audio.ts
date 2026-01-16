const MOCK_AUDIO_URL =
  'https://github.com/rafaelreis-hotmart/Audio-Sample-files/raw/master/sample.mp3';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const getMockAudioBuffer = async (): Promise<ArrayBuffer> => {
  const response = await fetch(MOCK_AUDIO_URL);
  if (!response.ok) {
    throw new Error(`Mock audio fetch failed: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  await delay(3000);
  return buffer;
};
