import { Document } from '@contentful/rich-text-types';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { Diff } from '@ali-tas/htmldiff-js';
import { useEffect, useState } from 'react';
import { styles } from './HtmlDiffViewer.styles';

interface HtmlDiffViewerProps {
  currentField: Document;
  publishedField: Document;
  onChangeCount: (count: number) => void;
  sdk?: any;
}
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { EntryCard, Skeleton, InlineEntryCard } from '@contentful/f36-components';
import { createRoot } from 'react-dom/client';
import tokens from '@contentful/f36-tokens';

const HtmlDiffViewer = ({
  currentField,
  publishedField,
  onChangeCount,
  sdk,
}: HtmlDiffViewerProps) => {
  const [diffHtml, setDiffHtml] = useState<string>('');
  const [entryTitles, setEntryTitles] = useState<Record<string, string>>({});
  const [entryContentTypes, setEntryContentTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch entry titles first
  useEffect(() => {
    const fetchTitles = async () => {
      setLoading(true);
      const titles: Record<string, string> = {};
      const contentTypes: Record<string, string> = {};

      const extractEntryIds = (doc: Document): string[] => {
        const ids: string[] = [];
        const traverse = (node: any) => {
          if (
            node.nodeType === 'embedded-entry-block' ||
            node.nodeType === 'embedded-entry-inline'
          ) {
            ids.push(node.data.target.sys.id);
          }
          if (node.content) {
            node.content.forEach(traverse);
          }
        };
        doc.content?.forEach(traverse);
        return ids;
      };

      const entryIds = extractEntryIds(currentField);

      // Fetch titles and content types for each entry
      for (const entryId of entryIds) {
        try {
          const entry = await sdk.cma.entry.get({ entryId });
          const title = entry.fields?.name?.['en-US'] || entry.fields?.title?.['en-US'] || entryId;
          const contentType = entry.sys.contentType?.sys?.id || 'Unknown';
          titles[entryId] = title;
          contentTypes[entryId] = contentType;
        } catch (error) {
          titles[entryId] = entryId;
          contentTypes[entryId] = 'Unknown';
        }
      }

      setEntryTitles(titles);
      setEntryContentTypes(contentTypes);
      setLoading(false);
    };

    if (sdk) {
      fetchTitles();
    }
  }, [currentField, sdk]);

  const options = {
    renderNode: {
      [BLOCKS.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        return `<div class="entry-card" data-entry-id="${entry.sys.id}">Embedded Entry: ${entry.sys.id}</div>`;
      },
      [INLINES.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        return `<span class="inline-entry" data-entry-id="${entry.sys.id}">Inline Entry: ${entry.sys.id}</span>`;
      },
    },
  };

  useEffect(() => {
    const currentHtml = documentToHtmlString(currentField, options);
    console.log('currentField', currentField);
    console.log('currentHtml', currentHtml);
    const publishedHtml = documentToHtmlString(publishedField, options);
    console.log('publishedHtml', publishedHtml);
    const diff = Diff.execute(publishedHtml, currentHtml);

    setDiffHtml(diff);

    const diffString = diff || '';

    const additions = (diffString.match(/<ins[^>]*>/g) || []).length;
    const deletions = (diffString.match(/<del[^>]*>/g) || []).length;
    const totalChanges = additions + deletions;

    onChangeCount(totalChanges);
  }, [currentField, publishedField, onChangeCount, entryTitles]);

  // Replace entry IDs with EntryCard components after diff is rendered
  useEffect(() => {
    console.log('diffHtml', diffHtml);
    if (diffHtml && !loading) {
      const container = document.querySelector(`.${styles}`);
      if (container) {
        // Find all entry-card elements and replace them with EntryCard components
        const entryCards = container.querySelectorAll('.entry-card');
        entryCards.forEach((card) => {
          const entryId = card.getAttribute('data-entry-id');
          const contentType = entryContentTypes[entryId || ''] || 'Unknown';
          const title = entryTitles[entryId || ''] || entryId;

          if (entryId && contentType) {
            // Check if this card is inside an <ins> or <del> tag
            const isAddition = card.closest('ins') !== null;
            const isDeletion = card.closest('del') !== null;

            // Determine border color based on diff status
            let borderColor = tokens.gray300; // default
            if (isAddition) {
              borderColor = tokens.green300;
            } else if (isDeletion) {
              borderColor = tokens.red300;
            }

            // Create a container for the EntryCard
            const cardContainer = document.createElement('div');
            cardContainer.style.margin = '8px 0';
            card.replaceWith(cardContainer);

            // Render EntryCard component
            const root = createRoot(cardContainer);
            root.render(
              <EntryCard
                status="published"
                contentType={contentType}
                title={title || 'Untitled'}
                description={`ID: ${entryId}`}
                style={{ borderColor }}
              />
            );
          }
        });

        // Find all inline-entry elements and replace them with InlineEntryCard components
        const inlineEntries = container.querySelectorAll('.inline-entry');
        inlineEntries.forEach((entry) => {
          const entryId = entry.getAttribute('data-entry-id');
          const contentType = entryContentTypes[entryId || ''] || 'Unknown';
          const title = entryTitles[entryId || ''] || entryId;

          if (entryId) {
            //TODO: MAKE THIS WORK
            const isAddition = entry.closest('ins') !== null;
            const isDeletion = entry.closest('del') !== null;

            //TODO: MAKE THIS WORK
            let borderColor = tokens.gray300; // default
            if (isAddition) {
              borderColor = tokens.green300;
            } else if (isDeletion) {
              borderColor = tokens.red300;
            }

            // Create a container for the InlineEntryCard
            const cardContainer = document.createElement('span');
            cardContainer.style.display = 'inline-block';
            cardContainer.style.margin = '0 2px';
            entry.replaceWith(cardContainer);

            // Render InlineEntryCard component
            const root = createRoot(cardContainer);
            root.render(
              <InlineEntryCard
                status="published"
                contentType={contentType}
                title={title || 'Untitled'}
                style={{ borderColor }}>
                {title || 'Untitled'}
              </InlineEntryCard>
            );
          }
        });
      }
    }
  }, [diffHtml, entryTitles, entryContentTypes, loading, styles]);

  if (loading) {
    return (
      <Skeleton.Container>
        <Skeleton.BodyText numberOfLines={4} />
      </Skeleton.Container>
    );
  }

  return (
    <>
      <div
        className={styles}
        dangerouslySetInnerHTML={{
          __html: diffHtml,
        }}
      />
    </>
  );
};

export default HtmlDiffViewer;
