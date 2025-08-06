import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Button,
  Flex,
  Grid,
  GridItem,
  SectionHeading,
  Box,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { Document } from '@contentful/rich-text-types';
import { useState } from 'react';
import { styles } from './Dialog.styles';
import HtmlDiffViewer from '../components/HtmlDiffViewer';

interface InvocationParameters {
  currentField: Document;
  publishedField: Document;
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParams = sdk.parameters.invocation as unknown as InvocationParameters;
  const [changeCount, setChangeCount] = useState(0);

  useAutoResizer();

  const currentField = invocationParams?.currentField;
  const publishedField = invocationParams?.publishedField;

  return (
    <Flex flexDirection="column" className={styles}>
      <Grid
        columns="1fr 1fr"
        rows="1"
        marginTop="spacingM"
        marginLeft="spacingM"
        marginRight="spacingM">
        <GridItem className="grid-item">
          <Flex alignItems="space-between">
            <SectionHeading className="section-heading-margin">Current version</SectionHeading>
            <Badge variant="secondary" className="change-badge">
              {changeCount} change{changeCount !== 1 ? 's' : ''}
            </Badge>
          </Flex>
          <HtmlDiffViewer
            currentField={currentField}
            publishedField={publishedField}
            onChangeCount={setChangeCount}
          />
        </GridItem>
        <GridItem className="grid-item">
          <SectionHeading className="section-heading-base">Published version</SectionHeading>
          <Box className="diff">{documentToReactComponents(publishedField)}</Box>
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
