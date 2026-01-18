export const fetchElevenLabsAudio = async (
  voiceId: string,
  text: string,
  apiKey: string
): Promise<ArrayBuffer> => {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.arrayBuffer();
};
