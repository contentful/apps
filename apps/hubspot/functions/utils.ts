import type { TextNode } from './types';

// Helper function to replace text nodes in HTML while preserving structure
export function replaceTextNodesInHtml(originalHtml: string, textNodes: Array<TextNode>): string {
  // Simple regex-based approach that works in Node.js
  let resultHtml = originalHtml;
  let textNodeIndex = 0;

  // Find all text content between HTML tags and replace them
  resultHtml = resultHtml.replace(/>([^<]+)</g, (match, textContent) => {
    const trimmedText = textContent.trim();
    if (trimmedText.length > 0 && textNodeIndex < textNodes.length) {
      const newText = textNodes[textNodeIndex].textContent;
      textNodeIndex++;
      // Preserve any whitespace padding around the text
      const leadingWhitespace = textContent.match(/^\s*/)?.[0] || '';
      const trailingWhitespace = textContent.match(/\s*$/)?.[0] || '';
      return `>${leadingWhitespace}${escapeHtml(newText)}${trailingWhitespace}<`;
    }
    return match;
  });

  // Handle text at the very beginning (before any tags)
  if (textNodeIndex < textNodes.length) {
    resultHtml = resultHtml.replace(/^([^<]+)/, (match, textContent) => {
      const trimmedText = textContent.trim();
      if (trimmedText.length > 0) {
        const newText = textNodes[textNodeIndex].textContent;
        textNodeIndex++;
        const leadingWhitespace = textContent.match(/^\s*/)?.[0] || '';
        const trailingWhitespace = textContent.match(/\s*$/)?.[0] || '';
        return `${leadingWhitespace}${escapeHtml(newText)}${trailingWhitespace}`;
      }
      return match;
    });
  }

  // Handle text at the very end (after all tags)
  if (textNodeIndex < textNodes.length) {
    resultHtml = resultHtml.replace(/([^>]+)$/, (match, textContent) => {
      const trimmedText = textContent.trim();
      if (trimmedText.length > 0) {
        const newText = textNodes[textNodeIndex].textContent;
        textNodeIndex++;
        const leadingWhitespace = textContent.match(/^\s*/)?.[0] || '';
        const trailingWhitespace = textContent.match(/\s*$/)?.[0] || '';
        return `${leadingWhitespace}${escapeHtml(newText)}${trailingWhitespace}`;
      }
      return match;
    });
  }

  return resultHtml;
}

// Helper function to escape HTML special characters
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
