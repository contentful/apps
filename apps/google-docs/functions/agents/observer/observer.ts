/*
 * INTEG-3260 Must be complete first before implementing INTEG-3261
 * INTEG-3261 Implement the observer. This will probably be broken down and done in pieces for the Document and Content Type parsers
 */

export async function createContentTypeObservationsFromLLMResponse(
  aiContentTypeResponse: any
): Promise<void> {
  throw new Error('Not implemented');
}

export async function createDocumentObservationsFromLLMResponse(
  aiDocumentResponse: any
): Promise<void> {
  throw new Error('Not implemented');
}
