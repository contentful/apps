import { TextLink } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';

interface EntryLinkProps {
  entryId: string;
  spaceId: string;
  environmentId: string;
  children: React.ReactNode;
}

export const EntryLink = ({ entryId, spaceId, environmentId, children }: EntryLinkProps) => {
  const entryUrl = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}`;

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
