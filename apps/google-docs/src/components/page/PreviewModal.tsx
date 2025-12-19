import { Button, Modal, Paragraph, Box, Heading, List, Flex } from '@contentful/f36-components';
import { EntryToCreate } from '../../../functions/agents/documentParserAgent/schema';

interface AssetInfo {
  url: string;
  altText: string;
  fileName: string;
}

interface PlanData {
  summary: string;
  totalEntries: number;
  entries: EntryToCreate[];
  assets?: AssetInfo[];
  totalAssets?: number;
}

interface PlanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEntries: () => void;
  plan: PlanData | null;
  isLoading: boolean;
}

/**
 * Extracts a display title from an entry by looking for common title field names
 */
function extractEntryTitle(entry: EntryToCreate, locale: string = 'en-US'): string {
  if (!entry || !entry.fields) {
    return 'Untitled Entry';
  }

  // Common field names that might contain titles
  const titleFieldNames = ['title', 'name', 'heading', 'headline', 'label'];

  for (const fieldName of titleFieldNames) {
    const field = entry.fields[fieldName];
    if (field && typeof field === 'object') {
      const value = field[locale] || Object.values(field)[0];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  // If no title field found, try to get first non-empty string field
  for (const [fieldId, localizedValue] of Object.entries(entry.fields)) {
    if (localizedValue && typeof localizedValue === 'object') {
      const value = localizedValue[locale] || Object.values(localizedValue)[0];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  // Fallback to content type ID
  return `Entry (${entry.contentTypeId || 'unknown'})`;
}

/**
 * Builds a hierarchical structure from entries
 * For now, we'll infer relationships based on content type patterns
 * In the future, this could be enhanced with explicit dependency data from the AI
 */
interface EntryNode {
  entry: EntryToCreate;
  title: string;
  children: EntryNode[];
  level: number;
}

function buildEntryHierarchy(entries: EntryToCreate[]): EntryNode[] {
  if (!entries || !Array.isArray(entries)) {
    return [];
  }

  const nodes: Array<EntryNode | null> = entries
    .map((entry) => {
      if (!entry) {
        return null;
      }
      const title = extractEntryTitle(entry);
      return {
        entry,
        title,
        children: [],
        level: 0,
      };
    })
    .filter((node) => node !== null);

  // Simple heuristic: group entries by content type patterns
  // Articles/Pages are typically parents, Sections/FAQs are children
  const parentTypes = ['article', 'page', 'blog', 'post'];
  const childTypes = ['section', 'faq', 'item', 'block'];

  const parents: EntryNode[] = [];
  const children: EntryNode[] = [];

  nodes.forEach((node) => {
    if (!node) {
      return;
    }
    const contentTypeLower = node.entry.contentTypeId.toLowerCase();
    const isParent = parentTypes.some((type) => contentTypeLower.includes(type));
    const isChild = childTypes.some((type) => contentTypeLower.includes(type));

    if (isParent && !isChild) {
      parents.push(node);
    } else if (isChild) {
      children.push(node);
    } else {
      // Default to parent if unclear
      parents.push(node);
    }
  });

  // If we have one parent and multiple children, attach children to parent
  if (parents.length === 1 && children.length > 0) {
    parents[0].children = children.map((child) => ({ ...child, level: 1 }));
    return parents;
  }

  // Otherwise return flat structure
  return nodes.filter((node): node is EntryNode => node !== null);
}

export const PreviewModal = ({
  isOpen,
  onClose,
  onCreateEntries,
  plan,
  isLoading,
}: PlanReviewModalProps) => {
  const handleCreateEntries = () => {
    onCreateEntries();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!plan) {
    return null;
  }

  const entries = plan.entries || [];
  const totalEntries = plan.totalEntries ?? entries.length;
  const assets = plan.assets || [];
  const totalAssets = plan.totalAssets ?? assets.length;

  // Only build hierarchy if we have entries
  const entryHierarchy = entries.length > 0 ? buildEntryHierarchy(entries) : [];

  const renderEntryNode = (
    node: EntryNode,
    index: number,
    isLast: boolean,
    isChild: boolean = false,
    parentHasMoreSiblings: boolean = false
  ) => {
    const hasChildren = node.children.length > 0;
    const indent = node.level * 24;

    // Extract content type name from the title (text in parentheses)
    const titleMatch =
      node.title && typeof node.title === 'string' ? node.title.match(/^(.+?)\s*\((.+?)\)$/) : null;
    const displayTitle =
      titleMatch && titleMatch[1] ? titleMatch[1].trim() : node.title || 'Untitled';
    const contentTypeName =
      titleMatch && titleMatch[2] ? titleMatch[2].trim() : node.entry?.contentTypeId || '';

    return (
      <Box key={index} style={{ position: 'relative', marginBottom: hasChildren ? '0' : '8px' }}>
        <Flex
          alignItems="center"
          style={{ position: 'relative', marginBottom: hasChildren ? '8px' : '0' }}>
          {/* Vertical line for children - extends from parent */}
          {isChild && (
            <>
              {/* Vertical line */}
              <Box
                style={{
                  position: 'absolute',
                  left: `${indent - 20}px`,
                  top: '-8px',
                  bottom: isLast && !hasChildren ? '12px' : '100%',
                  width: '1px',
                  backgroundColor: '#d1d5db',
                }}
              />
              {/* Horizontal connector line */}
              <Box
                style={{
                  position: 'absolute',
                  left: `${indent - 20}px`,
                  top: '12px',
                  width: '20px',
                  height: '1px',
                  backgroundColor: '#d1d5db',
                }}
              />
            </>
          )}

          {/* Entry card */}
          <Box
            style={{
              marginLeft: `${indent}px`,
              padding: '10px 14px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              flex: 1,
            }}>
            {/* Title with content type */}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontWeight: node.level === 0 ? 600 : 500,
                  fontSize: '14px',
                  color: '#111827',
                }}>
                {displayTitle.length > 40 ? displayTitle.substring(0, 40) + '...' : displayTitle}
              </span>
              {contentTypeName && (
                <span
                  style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    marginLeft: '6px',
                    fontWeight: 400,
                  }}>
                  ({contentTypeName})
                </span>
              )}
            </Box>
          </Box>
        </Flex>

        {/* Render children */}
        {hasChildren && (
          <Box style={{ position: 'relative', marginLeft: `${indent}px` }}>
            {/* Vertical line connecting all children */}
            <Box
              style={{
                position: 'absolute',
                left: '12px',
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: '#d1d5db',
              }}
            />
            <Box style={{ paddingLeft: '24px' }}>
              {node.children.map((child, childIndex) =>
                renderEntryNode(
                  child,
                  childIndex,
                  childIndex === node.children.length - 1,
                  true,
                  childIndex < node.children.length - 1
                )
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Modal
      title="Create entries"
      isShown={isOpen}
      onClose={handleClose}
      size="large"
      shouldCloseOnOverlayClick={!isLoading}
      shouldCloseOnEscapePress={!isLoading}>
      {() => (
        <>
          <Modal.Header title="Create entries" onClose={handleClose} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM" color="gray700">
              {plan.summary ||
                `Based off the document, ${totalEntries} ${
                  totalEntries === 1 ? 'entry is' : 'entries are'
                } being suggested:`}
            </Paragraph>

            <Box marginBottom="spacingM">
              {entryHierarchy.length > 0 ? (
                <Box>
                  {entryHierarchy.map((node, index) =>
                    renderEntryNode(node, index, index === entryHierarchy.length - 1)
                  )}
                </Box>
              ) : (
                <Paragraph color="gray600">No entries found</Paragraph>
              )}
            </Box>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={handleClose} variant="secondary" isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateEntries}
              variant="primary"
              isDisabled={isLoading || entries.length === 0}>
              Create entries
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
