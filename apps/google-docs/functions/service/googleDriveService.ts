export async function fetchGoogleDoc(googleDocUrl: string): Promise<string> {
  // Extract /d/{id}
  const m = googleDocUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) throw new Error('Invalid Google Doc URL format');
  const documentId = m[1];

  const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=html`;

  const res = await fetch(exportUrl);
  const html = await res.text();
  return html;
}
