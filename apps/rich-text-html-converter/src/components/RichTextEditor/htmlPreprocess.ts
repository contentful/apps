/**
 * Block-level tags that TipTap natively understands.
 * Everything else at the top level gets preserved as a RawHtmlBlock.
 */
const KNOWN_BLOCKS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'blockquote', 'hr', 'pre', 'table',
]);

/**
 * Walk top-level children of <body>. Any element whose tag is not in
 * KNOWN_BLOCKS gets replaced with a `<div data-type="raw-html-block">`
 * marker that the RawHtmlBlock extension can parse.
 */
export function preprocessHtml(html: string): string {
  if (!html.trim()) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;

  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    if (KNOWN_BLOCKS.has(el.tagName.toLowerCase())) continue;

    const marker = doc.createElement('div');
    marker.setAttribute('data-type', 'raw-html-block');
    // setAttribute encodes the value automatically; getAttribute decodes it
    marker.setAttribute('data-raw-html', el.outerHTML);
    body.replaceChild(marker, el);
  }

  return body.innerHTML;
}

/**
 * Structural elements that TipTap inserts gap paragraphs next to.
 * An empty <p> immediately adjacent to one of these is a cursor-management
 * artifact and should not appear in the serialized HTML.
 */
const STRUCTURAL_BLOCKS = new Set([
  'div', 'section', 'article', 'figure', 'figcaption',
  'header', 'footer', 'nav', 'aside', 'main', 'hr',
]);

function isEmptyParagraph(el: Element): boolean {
  if (el.tagName.toLowerCase() !== 'p') return false;
  if ((el.textContent ?? '').trim() !== '') return false;
  // Allow removal of <p></p> and <p><br></p> — both are TipTap gap forms
  const firstChild = el.firstElementChild;
  if (firstChild && firstChild.tagName.toLowerCase() !== 'br') return false;
  return true;
}

/**
 * Reverse of preprocessHtml: replace every
 * `<div data-type="raw-html-block" data-raw-html="...">` back with the
 * original HTML, then strip empty <p> gap nodes that TipTap inserts
 * adjacent to structural/void block elements.
 */
export function postprocessHtml(html: string): string {
  if (!html.trim()) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Step 1: restore raw HTML markers
  const markers = Array.from(doc.querySelectorAll('[data-type="raw-html-block"]'));
  for (const marker of markers) {
    const rawHtml = marker.getAttribute('data-raw-html') ?? '';
    const temp = doc.createElement('div');
    temp.innerHTML = rawHtml;
    const parent = marker.parentNode;
    if (!parent) continue;
    while (temp.firstChild) {
      parent.insertBefore(temp.firstChild, marker);
    }
    parent.removeChild(marker);
  }

  // Step 2: remove TipTap gap paragraphs — empty <p> elements that sit
  // immediately before or after a structural block element.
  const children = Array.from(doc.body.children);
  const toRemove: Element[] = [];

  for (let i = 0; i < children.length; i++) {
    if (!isEmptyParagraph(children[i])) continue;
    const prev = i > 0 ? children[i - 1] : null;
    const next = i < children.length - 1 ? children[i + 1] : null;
    const adjToStructural =
      (prev && STRUCTURAL_BLOCKS.has(prev.tagName.toLowerCase())) ||
      (next && STRUCTURAL_BLOCKS.has(next.tagName.toLowerCase()));
    if (adjToStructural) toRemove.push(children[i]);
  }

  for (const el of toRemove) el.remove();

  return doc.body.innerHTML;
}
