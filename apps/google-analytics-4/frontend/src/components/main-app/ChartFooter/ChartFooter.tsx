import { Flex, Text, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

interface Props {
  slugName: string;
  viewUrl: string;
}

const ChartFooter = (props: Props) => {
  const { slugName, viewUrl } = props;

  return (
    <Flex flexDirection="column" alignItems="flex-start">
      <Text fontColor="gray600" fontSize="fontSizeS" marginBottom="spacingM">
        {slugName}
      </Text>
      {viewUrl ? (
        <TextLink
          href={viewUrl}
          target="_blank"
          rel="noopener noreferer"
          icon={<ExternalLinkIcon />}>
          Open in Google Analytics
        </TextLink>
      ) : null}
    </Flex>
  );
};

export default ChartFooter;
