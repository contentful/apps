import { DialogAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Button,
  Flex,
  Grid,
  GridItem,
  Box,
  Subheading,
  EntryCard,
  InlineEntryCard,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, Document, INLINES } from '@contentful/rich-text-types';
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

  const options = {
    renderNode: {
      [BLOCKS.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        return (
          <EntryCard
            contentType={entry.sys.contentType.sys.id}
            size="small"
            title={entry.fields.title}
          />
        );
      },
      [INLINES.EMBEDDED_ENTRY]: (node: any, children: any) => {
        const entry = node.data.target;
        return (
          <InlineEntryCard contentType={entry.sys.contentType.sys.id} title={entry.fields.title}>
            {entry.fields.title}
          </InlineEntryCard>
        );
      },
    },
  };

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
            <Subheading>Current version</Subheading>
            <Badge variant="secondary" className="change-badge">
              {changeCount} change{changeCount !== 1 ? 's' : ''}
            </Badge>
          </Flex>
          {publishedField && (
            <HtmlDiffViewer
              currentField={currentField}
              publishedField={publishedField}
              onChangeCount={setChangeCount}
              sdk={sdk}
            />
          )}
        </GridItem>
        <GridItem className="grid-item">
          <Subheading>Published version</Subheading>
          <Box className="diff">{documentToReactComponents(publishedField, options)}</Box>
        </GridItem>
      </Grid>
      <Flex justifyContent="flex-end" margin="spacingM">
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
