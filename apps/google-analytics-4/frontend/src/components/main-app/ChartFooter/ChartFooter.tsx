import { Flex, Text, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

interface Props {
  slugName: string;
  viewUrl: string;
  includedPaths?: string[];
}

const ChartFooter = (props: Props) => {
  const { slugName, viewUrl, includedPaths = [] } = props;
  const isAggregated = includedPaths.length > 1;

  return (
    <Flex flexDirection="column" alignItems="flex-start">
      {isAggregated ? (
        <>
          <Text fontColor="gray600" fontSize="fontSizeS" marginTop="spacingS" marginBottom="spacing2Xs">
            Included paths ({includedPaths.length})
          </Text>
          <Flex flexDirection="column" alignItems="flex-start" marginBottom="spacingS">
            {includedPaths.map((path) => (
              <Text key={path} fontColor="gray600" fontSize="fontSizeS">
                {path}
              </Text>
            ))}
          </Flex>
        </>
      ) : (
        <Text fontColor="gray600" fontSize="fontSizeS" marginTop="spacingS" marginBottom="spacingS">
          {slugName.startsWith('/') ? 'Page path' : 'Matching rules'}: {slugName}
        </Text>
      )}
      {!isAggregated && viewUrl ? (
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
