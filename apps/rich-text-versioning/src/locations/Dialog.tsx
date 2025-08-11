import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Button,
  Flex,
  Grid,
  GridItem,
  SectionHeading,
  Box,
  Note,
  Text,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { Document } from '@contentful/rich-text-types';
import { useState } from 'react';
import { styles } from './Dialog.styles';
import HtmlDiffViewer from '../components/HtmlDiffViewer';
import { ErrorInfo } from '../utils';

interface InvocationParameters {
  currentField: Document;
  publishedField: Document;
  errorInfo: ErrorInfo;
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParams = sdk.parameters.invocation as unknown as InvocationParameters;
  const [changeCount, setChangeCount] = useState(0);

  useAutoResizer();

  const currentField = invocationParams?.currentField;
  const publishedField = invocationParams?.publishedField;
  const errorInfo = invocationParams?.errorInfo;

  if (errorInfo?.hasError) {
    return (
      <Flex className={styles.modalContent} flexDirection="column" justifyContent="space-between">
        <Note variant="negative">
          <Flex alignItems="center" gap="spacingS">
            <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
              Error loading content
            </Text>
          </Flex>
          <Text fontSize="fontSizeS">
            Error {errorInfo.errorCode} - {errorInfo.errorMessage}
          </Text>
        </Note>
        <Flex justifyContent="flex-end">
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              sdk.close();
            }}>
            Close
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column">
      <Grid
        columns="1fr 1fr"
        rows="1"
        marginTop="spacingM"
        marginLeft="spacingM"
        marginRight="spacingM">
        <GridItem className={styles.gridItem}>
          <Flex alignItems="space-between">
            <SectionHeading className={styles.sectionHeadingMargin}>Current version</SectionHeading>
            <Badge variant="secondary" className={styles.changeBadge}>
              {changeCount} change{changeCount !== 1 ? 's' : ''}
            </Badge>
          </Flex>
          {publishedField && (
            <HtmlDiffViewer
              currentField={currentField}
              publishedField={publishedField}
              onChangeCount={setChangeCount}
            />
          )}
        </GridItem>
        <GridItem className={styles.gridItem}>
          <SectionHeading className={styles.sectionHeadingBase}>Published version</SectionHeading>
          <Box className={styles.diff}>{documentToReactComponents(publishedField)}</Box>
        </GridItem>
      </Grid>
      <Flex justifyContent="flex-end" marginBottom="spacingM" marginRight="spacingM">
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            sdk.close();
          }}>
          Close
        </Button>
      </Flex>
    </Flex>
  );
};

export default Dialog;
