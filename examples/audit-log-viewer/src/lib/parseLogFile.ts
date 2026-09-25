/**
 * Contentful documents audit files only as ".json" — compression and internal
 * layout (array vs NDJSON) are undocumented, so tolerate all of:
 * gzip or plain; JSON array; single JSON object; newline-delimited JSON.
 */
export async function parseLogFile(buf: ArrayBuffer): Promise<unknown[]> {
  const bytes = new Uint8Array(buf);
  let text: string;
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    text = await new Response(stream).text();
  } else {
    text = new TextDecoder().decode(buf);
  }
  const trimmed = text.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return trimmed.split('\n').flatMap((line) => {
      const l = line.trim();
      if (!l) return [];
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
  }
}
