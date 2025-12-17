/**
 * Shared utility for parsing and validating Google Docs documents
 * Used by both client-side and server-side code
 */

/**
 * Parses a document parameter that may be a JSON string, URL, or object
 * @param document - The document to parse (string URL, JSON string, or object)
 * @returns The parsed document object
 * @throws Error if the document cannot be parsed
 */
export function parseDocument(document: unknown): unknown {
  // If already an object, return as-is
  if (typeof document !== 'string') {
    return document;
  }

  // Check if it's a URL (starts with http:// or https://)
  if (document.startsWith('http://') || document.startsWith('https://')) {
    throw new Error(
      'Document URL provided but fetching from Google Docs API is not yet implemented. Please provide the document JSON object directly.'
    );
  }

  // Try to parse as JSON
  try {
    return JSON.parse(document);
  } catch (e) {
    // Provide more helpful error message
    const preview = document.substring(0, 100);
    throw new Error(
      `Failed to parse document as JSON. Document appears to be a string but is not valid JSON. ` +
        `Preview: ${preview}${document.length > 100 ? '...' : ''}. ` +
        `Error: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

/**
 * Validates that a document is provided
 * @param document - The document to validate
 * @throws Error if the document is null, undefined, or empty
 */
export function validateDocument(document: unknown): void {
  if (!document) {
    throw new Error('Document is required');
  }
}
