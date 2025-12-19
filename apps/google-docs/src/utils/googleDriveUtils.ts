/**
 * Fetches a Google Doc as JSON from the Google Docs API
 * @param documentId - The Google Doc ID
 * @param oauthToken - OAuth token for authentication
 * @returns Promise resolving to the document JSON
 */
export async function fetchGoogleDocAsJson(
  documentId: string,
  oauthToken: string
): Promise<unknown> {
  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}?includeTabsContent=true`,
    {
      headers: {
        Authorization: `Bearer ${oauthToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to fetch document JSON: ${res.status} ${res.statusText} - ${errorText}`
    );
  }

  const json = await res.json();
  return json;
}
