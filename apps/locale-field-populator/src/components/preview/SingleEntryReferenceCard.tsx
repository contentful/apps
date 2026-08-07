import { DialogAppSDK } from '@contentful/app-sdk';
import { Box, Flex, Skeleton, Text, TextLink } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { useEffect, useState } from 'react';

interface SingleEntryReferenceCardProps {
  entryId: string;
  locale: string;
  baseUrl: string;
}

const getEntryTitle = (
  entry: EntryProps,
  contentType: ContentTypeProps,
  locale: string,
  defaultLocale: string
): string => {
  const displayFieldId = contentType.displayField;
  if (!displayFieldId) return 'Untitled';

  const value = entry.fields[displayFieldId]?.[locale] ?? entry.fields[displayFieldId]?.[defaultLocale];
  if (value === undefined || value === null || value === '') {
    return 'Untitled';
  }
  return String(value);
};

/**
 * Resolves and displays the title of a referenced entry, linking out to it.
 * Falls back to the raw entry id if the entry can't be fetched (deleted,
 * inaccessible, or the fetch simply fails) -- a reference should never look
 * broken just because we couldn't resolve a friendly title for it.
 */
const SingleEntryReferenceCard = ({ entryId, locale, baseUrl }: SingleEntryReferenceCardProps) => {
  const sdk = useSDK<DialogAppSDK>();
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useAutoResizer();

  useEffect(() => {
    let isMounted = true;

    const fetchEntryTitle = async () => {
      try {
        setLoading(true);
        const entry = await sdk.cma.entry.get({ entryId });
        const contentType = await sdk.cma.contentType.get({
          contentTypeId: entry.sys.contentType.sys.id,
        });
        if (isMounted) {
          setTitle(getEntryTitle(entry, contentType, locale, sdk.locales.default));
        }
      } catch (err) {
        console.error('Error fetching referenced entry:', err);
        if (isMounted) {
          setTitle(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEntryTitle();

    return () => {
      isMounted = false;
    };
  }, [entryId, locale, sdk.cma.entry, sdk.cma.contentType, sdk.locales.default]);

  if (loading) {
    return (
      <Skeleton.Container>
        <Skeleton.BodyText numberOfLines={1} />
      </Skeleton.Container>
    );
  }

  return (
    <Box>
      <Flex alignItems="center" gap="spacingXs">
        <TextLink
          href={`${baseUrl}/entries/${entryId}`}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ArrowSquareOutIcon variant="muted" size="tiny" />}
          alignIcon="end">
          <Text fontColor="blue600">{title ?? entryId}</Text>
        </TextLink>
      </Flex>
    </Box>
  );
};

export default SingleEntryReferenceCard;
