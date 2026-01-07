/**
 * Google Docs Validator
 *
 * Validates Google Docs JSON structure for security issues.
 * Only validates user-facing text content (paragraphs, tables, lists, headings, etc.)
 * while skipping metadata fields (IDs, URLs, style properties, structural metadata).
 */

import { SecurityValidationResult } from './types';
import { ContentValidator } from './contentValidator';

/**
 * Validator class for Google Docs JSON structure
 * Validates only user-facing text content while skipping metadata fields
 */
export class GoogleDocsValidator {
  private errors: string[] = [];
  private contentValidator: ContentValidator;

  constructor() {
    this.contentValidator = new ContentValidator();
  }

  /**
   * Validates text content and accumulates errors
   */
  private validateText(text: string, location: string): void {
    const result = this.contentValidator.validate(text);
    if (!result.isValid) {
      this.errors.push(...result.errors.map((e) => `${location}: ${e}`));
    }
  }

  /**
   * Validates paragraph elements (text runs, rich links)
   */
  private validateParagraphElements(elements: unknown, location: string): void {
    if (!Array.isArray(elements)) return;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (!element || typeof element !== 'object') continue;

      const elem = element as Record<string, unknown>;

      // Text runs contain user-facing text
      if (elem.textRun && typeof elem.textRun === 'object') {
        const textRun = elem.textRun as Record<string, unknown>;
        if (typeof textRun.content === 'string') {
          this.validateText(textRun.content, `${location}.textRun[${i}]`);
        }
      }

      // Rich links may contain titles
      if (elem.richLink && typeof elem.richLink === 'object') {
        const richLink = elem.richLink as Record<string, unknown>;
        if (richLink.richLinkProperties && typeof richLink.richLinkProperties === 'object') {
          const props = richLink.richLinkProperties as Record<string, unknown>;
          if (typeof props.title === 'string') {
            this.validateText(props.title, `${location}.richLink[${i}].title`);
          }
        }
      }
    }
  }

  /**
   * Validates a paragraph structure
   */
  private validateParagraph(paragraph: unknown, location: string): void {
    if (!paragraph || typeof paragraph !== 'object') return;

    const para = paragraph as Record<string, unknown>;
    if (para.elements) {
      this.validateParagraphElements(para.elements, `${location}.paragraph`);
    }
  }

  /**
   * Validates a table structure including all cells
   */
  private validateTable(table: unknown, location: string): void {
    if (!table || typeof table !== 'object') return;

    const tbl = table as Record<string, unknown>;
    if (!Array.isArray(tbl.tableRows)) return;

    for (let rowIdx = 0; rowIdx < tbl.tableRows.length; rowIdx++) {
      const row = tbl.tableRows[rowIdx];
      if (!row || typeof row !== 'object') continue;

      const rowObj = row as Record<string, unknown>;
      if (!Array.isArray(rowObj.tableCells)) continue;

      for (let cellIdx = 0; cellIdx < rowObj.tableCells.length; cellIdx++) {
        const cell = rowObj.tableCells[cellIdx];
        if (!cell || typeof cell !== 'object') continue;

        const cellObj = cell as Record<string, unknown>;
        if (!Array.isArray(cellObj.content)) continue;

        for (let contentIdx = 0; contentIdx < cellObj.content.length; contentIdx++) {
          const content = cellObj.content[contentIdx];
          if (!content || typeof content !== 'object') continue;

          const contentObj = content as Record<string, unknown>;
          if (contentObj.paragraph) {
            this.validateParagraph(
              contentObj.paragraph,
              `${location}.table.row[${rowIdx}].cell[${cellIdx}].content[${contentIdx}]`
            );
          }
        }
      }
    }
  }

  /**
   * Validates body content (paragraphs and tables)
   */
  private validateBodyContent(content: unknown, location: string): void {
    if (!Array.isArray(content)) return;

    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      if (!item || typeof item !== 'object') continue;

      const itemObj = item as Record<string, unknown>;

      // Validate paragraphs (includes headings, lists, code blocks)
      if (itemObj.paragraph) {
        this.validateParagraph(itemObj.paragraph, `${location}.content[${i}]`);
      }

      // Validate tables
      if (itemObj.table) {
        this.validateTable(itemObj.table, `${location}.content[${i}]`);
      }
    }
  }

  /**
   * Validates inline objects (images, drawings)
   */
  private validateInlineObjects(doc: Record<string, unknown>): void {
    if (!doc.inlineObjects || typeof doc.inlineObjects !== 'object') return;

    const inlineObjects = doc.inlineObjects as Record<string, unknown>;
    for (const [objectId, objectData] of Object.entries(inlineObjects)) {
      if (!objectData || typeof objectData !== 'object') continue;

      const obj = objectData as Record<string, unknown>;
      if (obj.inlineObjectProperties && typeof obj.inlineObjectProperties === 'object') {
        const props = obj.inlineObjectProperties as Record<string, unknown>;
        if (props.embeddedObject && typeof props.embeddedObject === 'object') {
          const embedded = props.embeddedObject as Record<string, unknown>;

          // Validate title
          if (typeof embedded.title === 'string') {
            this.validateText(embedded.title, `inlineObjects.${objectId}.title`);
          }

          // Validate description
          if (typeof embedded.description === 'string') {
            this.validateText(embedded.description, `inlineObjects.${objectId}.description`);
          }
        }
      }
    }
  }

  /**
   * Validates a document tab including body, headers, footers, and footnotes
   */
  private validateDocumentTab(docTab: Record<string, unknown>, tabIdx: number): void {
    // Validate body content
    if (docTab.body && typeof docTab.body === 'object') {
      const body = docTab.body as Record<string, unknown>;
      if (body.content) {
        this.validateBodyContent(body.content, `tabs[${tabIdx}].documentTab.body`);
      }
    }

    // Validate headers
    if (docTab.headers && typeof docTab.headers === 'object') {
      const headers = docTab.headers as Record<string, unknown>;
      for (const [headerId, headerData] of Object.entries(headers)) {
        if (!headerData || typeof headerData !== 'object') continue;
        const header = headerData as Record<string, unknown>;
        if (header.content) {
          this.validateBodyContent(header.content, `tabs[${tabIdx}].headers.${headerId}`);
        }
      }
    }

    // Validate footers
    if (docTab.footers && typeof docTab.footers === 'object') {
      const footers = docTab.footers as Record<string, unknown>;
      for (const [footerId, footerData] of Object.entries(footers)) {
        if (!footerData || typeof footerData !== 'object') continue;
        const footer = footerData as Record<string, unknown>;
        if (footer.content) {
          this.validateBodyContent(footer.content, `tabs[${tabIdx}].footers.${footerId}`);
        }
      }
    }

    // Validate footnotes
    if (docTab.footnotes && typeof docTab.footnotes === 'object') {
      const footnotes = docTab.footnotes as Record<string, unknown>;
      for (const [footnoteId, footnoteData] of Object.entries(footnotes)) {
        if (!footnoteData || typeof footnoteData !== 'object') continue;
        const footnote = footnoteData as Record<string, unknown>;
        if (footnote.content) {
          this.validateBodyContent(footnote.content, `tabs[${tabIdx}].footnotes.${footnoteId}`);
        }
      }
    }
  }

  /**
   * Validates all document tabs
   */
  private validateTabs(doc: Record<string, unknown>): void {
    if (!Array.isArray(doc.tabs)) return;

    for (let tabIdx = 0; tabIdx < doc.tabs.length; tabIdx++) {
      const tab = doc.tabs[tabIdx];
      if (!tab || typeof tab !== 'object') continue;

      const tabObj = tab as Record<string, unknown>;
      if (tabObj.documentTab && typeof tabObj.documentTab === 'object') {
        const docTab = tabObj.documentTab as Record<string, unknown>;
        this.validateDocumentTab(docTab, tabIdx);
      }
    }
  }

  /**
   * Main validation method
   */
  validate(documentJson: unknown): SecurityValidationResult {
    // Reset state for new validation
    this.errors = [];

    if (!documentJson || typeof documentJson !== 'object') {
      return { isValid: true, errors: [] };
    }

    const doc = documentJson as Record<string, unknown>;

    // Validate all components
    this.validateInlineObjects(doc);
    this.validateTabs(doc);

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }
}

/**
 * Validates Google Docs JSON structure for security issues
 * Only validates user-facing text content (paragraphs, tables, lists, headings, etc.)
 * Skips metadata fields like IDs, URLs, style properties, etc.
 */
export function validateGoogleDocJson(documentJson: unknown): SecurityValidationResult {
  const validator = new GoogleDocsValidator();
  return validator.validate(documentJson);
}
