import { useMemo, useState } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Paragraph,
  Stack,
  Text,
} from '@contentful/f36-components';
import { css } from '@emotion/css';
import { CloneReferenceNode } from '../utils/EntryCloner';

type DialogInvocationParameters = {
  referenceTree: CloneReferenceNode;
};

const styles = {
  root: css({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
  }),
  header: css({
    padding: '24px 24px 16px',
    borderBottom: '1px solid #e5ebf1',
  }),
  content: css({
    flex: 1,
    padding: '20px 24px',
    overflowY: 'auto',
  }),
  controls: css({
    padding: '16px 24px 24px',
    borderTop: '1px solid #e5ebf1',
    backgroundColor: '#ffffff',
  }),
  treeRow: css({
    width: '100%',
  }),
  treeChildren: css({
    marginLeft: '20px',
    paddingLeft: '12px',
    borderLeft: '1px solid #d3dce6',
  }),
};

function collectEntryIds(node: CloneReferenceNode): string[] {
  return [node.entryId, ...node.children.flatMap((child) => collectEntryIds(child))];
}

function toggleNodeSelection(
  node: CloneReferenceNode,
  nextChecked: boolean,
  selectedEntryIds: Set<string>
): Set<string> {
  const nextSelectedEntryIds = new Set(selectedEntryIds);

  for (const entryId of collectEntryIds(node)) {
    if (nextChecked) {
      nextSelectedEntryIds.add(entryId);
    } else {
      nextSelectedEntryIds.delete(entryId);
    }
  }

  return nextSelectedEntryIds;
}

function TreeNode({
  node,
  selectedEntryIds,
  rootEntryId,
  onToggle,
}: {
  node: CloneReferenceNode;
  selectedEntryIds: Set<string>;
  rootEntryId: string;
  onToggle: (node: CloneReferenceNode, checked: boolean) => void;
}) {
  const isRoot = node.entryId === rootEntryId;
  const isChecked = selectedEntryIds.has(node.entryId);

  return (
    <Stack
      spacing="spacingS"
      flexDirection="column"
      alignItems="stretch"
      className={styles.treeRow}>
      <Checkbox
        isChecked={isChecked}
        isDisabled={isRoot}
        onChange={(event) => onToggle(node, event.target.checked)}>
        <Text fontWeight={isRoot ? 'fontWeightDemiBold' : 'fontWeightMedium'}>{node.label}</Text>
        <Text as="div" fontColor="gray500" fontSize="fontSizeS">
          {isRoot ? 'Root entry' : node.entryId}
        </Text>
      </Checkbox>

      {node.children.length > 0 && (
        <Box className={styles.treeChildren}>
          <Stack spacing="spacingS" flexDirection="column" alignItems="stretch">
            {node.children.map((child) => (
              <TreeNode
                key={`${node.entryId}-${child.entryId}`}
                node={child}
                selectedEntryIds={selectedEntryIds}
                rootEntryId={rootEntryId}
                onToggle={onToggle}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function ReferenceSelectionDialog() {
  const sdk = useSDK<DialogAppSDK>();
  const invocationParameters = sdk.parameters.invocation as DialogInvocationParameters;
  const referenceTree = invocationParameters.referenceTree;
  useAutoResizer();

  const allEntryIds = useMemo(() => collectEntryIds(referenceTree), [referenceTree]);
  const rootEntryId = referenceTree.entryId;
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set(allEntryIds));

  const selectedReferenceCount = selectedEntryIds.size - 1;
  const totalReferenceCount = allEntryIds.length - 1;
  const allReferencesSelected = selectedReferenceCount === totalReferenceCount;

  const handleToggleNode = (node: CloneReferenceNode, checked: boolean) => {
    setSelectedEntryIds((currentSelectedEntryIds) =>
      toggleNodeSelection(node, checked, currentSelectedEntryIds)
    );
  };

  const handleToggleAllReferences = () => {
    setSelectedEntryIds(allReferencesSelected ? new Set([rootEntryId]) : new Set(allEntryIds));
  };

  const handleCancel = () => {
    sdk.close(null);
  };

  const handleConfirm = () => {
    sdk.close(Array.from(selectedEntryIds));
  };

  return (
    <Box className={styles.root}>
      <Box className={styles.header}>
        <Heading marginBottom="spacingXs">Select entries to clone</Heading>
        <Paragraph marginBottom="none">
          Review the reference tree and deselect any entries you want to keep linked to the
          originals instead of cloning.
        </Paragraph>
      </Box>

      <Box className={styles.content}>
        <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingM">
          <Text fontColor="gray700" fontWeight="fontWeightMedium">
            {`Selected ${selectedReferenceCount} of ${totalReferenceCount} referenced ${
              totalReferenceCount === 1 ? 'entry' : 'entries'
            }`}
          </Text>
          <Button variant="secondary" size="small" onClick={handleToggleAllReferences}>
            {allReferencesSelected ? 'Deselect all references' : 'Select all references'}
          </Button>
        </Flex>

        <TreeNode
          node={referenceTree}
          selectedEntryIds={selectedEntryIds}
          rootEntryId={rootEntryId}
          onToggle={handleToggleNode}
        />
      </Box>

      <Flex justifyContent="flex-end" alignItems="center" className={styles.controls}>
        <Button variant="transparent" size="small" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="small" onClick={handleConfirm}>
          Clone selected entries
        </Button>
      </Flex>
    </Box>
  );
}

export default ReferenceSelectionDialog;
