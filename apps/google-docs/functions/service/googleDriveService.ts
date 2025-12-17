type FetchGoogleDocAsJsonParams = {
  documentId: string;
  oauthToken: string;
};

export async function fetchGoogleDocAsJson({
  documentId,
  oauthToken,
}: FetchGoogleDocAsJsonParams): Promise<unknown> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
    headers: {
      Authorization: `Bearer ${oauthToken}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch document JSON: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json;
}
