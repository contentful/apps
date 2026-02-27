import { TextLink } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';

interface EntryLinkProps {
  entryId: string;
  spaceId: string;
  children: React.ReactNode;
}

export const EntryLink = ({ entryId, spaceId, children }: EntryLinkProps) => {
  const entryUrl = `https://app.contentful.com/spaces/${spaceId}/entries/${entryId}`;

  return (
    <TextLink
      href={entryUrl}
      target="_blank"
      rel="noopener noreferrer"
      alignIcon="end"
      icon={<ArrowSquareOutIcon />}>
      {children}
    </TextLink>
  );
};
