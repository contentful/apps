import { Box, Paragraph, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

interface Props {
  slugName: string;
  viewUrl: string;
}

const styles = {
  slug: css({
    color: tokens.gray600,
    fontSize: tokens.fontSizeS,
    marginBottom: tokens.spacingM,
  }),
};

export default function ChartFooter(props: Props) {
  const { slugName, viewUrl } = props;

  return (
    <Box>
      <Paragraph className={styles.slug}>{slugName}</Paragraph>
      {viewUrl ? (
        <TextLink
          href={viewUrl}
          target="_blank"
          rel="noopener noreferer"
          icon={<ExternalLinkIcon />}
        >
          Open in Google Analytics
        </TextLink>
      ) : null}
    </Box>
  );
}
