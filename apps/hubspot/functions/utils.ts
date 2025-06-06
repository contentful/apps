import type { TextNode } from './types';

// Helper function to replace text nodes in HTML while preserving structure
export function replaceTextNodesInHtml(originalHtml: string, textNodes: Array<TextNode>): string {
  // Validate inputs to prevent injection attacks
  if (!originalHtml || typeof originalHtml !== 'string') {
    throw new Error('Invalid HTML input');
  }

  if (!Array.isArray(textNodes)) {
    throw new Error('Invalid textNodes input');
  }

  // Simple regex-based approach that works in Node.js
  let resultHtml = originalHtml;
  let textNodeIndex = 0;

  // Find all text content between HTML tags and replace them
  resultHtml = resultHtml.replace(/>([^<]+)</g, (match, textContent) => {
    const trimmedText = textContent.trim();
    if (trimmedText.length > 0 && textNodeIndex < textNodes.length) {
      const newText = sanitizeUserInput(textNodes[textNodeIndex].textContent);
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
        const newText = sanitizeUserInput(textNodes[textNodeIndex].textContent);
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
        const newText = sanitizeUserInput(textNodes[textNodeIndex].textContent);
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

// Comprehensive function to sanitize user input against various attacks
export function sanitizeUserInput(text: unknown): string {
  // Input validation
  if (text === null || text === undefined) {
    return '';
  }

  // Convert to string safely
  const textStr = String(text);

  // Length limit to prevent DoS attacks
  const maxLength = 10000;
  if (textStr.length > maxLength) {
    console.warn(`Input truncated: length ${textStr.length} exceeds limit ${maxLength}`);
    return textStr.substring(0, maxLength);
  }

  // Remove or escape potential injection patterns
  let sanitized = textStr
    // Remove null bytes that can terminate strings in some contexts
    .replace(/\0/g, '')
    // Remove control characters except common whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove potential script injection patterns - fixed to handle closing tags with whitespace
    .replace(/<script[^>]*>.*?<\/script\s*>/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove data URLs that could contain scripts
    .replace(/data:.*?base64/gi, '');

  return sanitized;
}

// Enhanced HTML escape function with comprehensive character mapping
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  const map: { [key: string]: string } = {
    '&': '&amp;', // Must be first to avoid double-escaping
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;', // More secure than &#039;
    '/': '&#x2F;', // Prevent closing tags
    '`': '&#x60;', // Prevent template literals
    '=': '&#x3D;', // Prevent attribute injection
  };

  return text.replace(/[&<>"'`=\/]/g, (match) => map[match] || match);
}
