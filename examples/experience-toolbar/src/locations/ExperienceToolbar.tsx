import React, { useEffect, useState } from 'react';
import type {
  ComponentPropertyDescriptor,
  ExoContext,
  ExoNodeType,
  ExperienceEditorToolbarAppSDK,
  UiMode,
} from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Flex,
  Heading,
  Note,
  Paragraph,
  Spinner,
  Stack,
  Subheading,
  Table,
  Text,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

interface Selection {
  nodeId: string | null;
  nodeType?: ExoNodeType;
}

/**
 * A minimal Experience Editor toolbar app. It demonstrates the core `sdk.exo`
 * patterns a toolbar app is built on:
 *
 *  - reading `sdk.exo.context` to tell experience vs. fragment editing apart
 *  - reacting to `sdk.exo.onUiModeChanged()` (form vs. visual mode)
 *  - subscribing to `sdk.exo.experience.selection.onChange()`
 *  - resolving the selected node with `sdk.exo.experience.getNode(nodeId)` and
 *    reading its properties
 *
 * The app mounts once when the editor opens and stays mounted for the session;
 * selection changes do NOT remount it, so all live data flows through the
 * subscriptions below. Each `on*` call returns an unsubscribe function that we
 * call on cleanup.
 */
const ExperienceToolbar = () => {
  const sdk = useSDK<ExperienceEditorToolbarAppSDK>();

  const [context, setContext] = useState<ExoContext>(() => sdk.exo.context);
  const [uiMode, setUiMode] = useState<UiMode>(() => sdk.exo.getUiMode());
  const [selection, setSelection] = useState<Selection>(() =>
    sdk.exo.experience.selection.get()
  );
  const [properties, setProperties] = useState<ComponentPropertyDescriptor[] | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Keep the editing context (experience vs. fragment) in sync.
  useEffect(() => {
    return sdk.exo.onContextChanged(setContext);
  }, [sdk]);

  // Keep the UI mode (form vs. visual) in sync. In `form` mode, canvas
  // affordances like selection highlighting are no-ops, so apps should degrade
  // gracefully — here we just surface the current mode.
  useEffect(() => {
    return sdk.exo.onUiModeChanged(setUiMode);
  }, [sdk]);

  // Track the canvas selection.
  useEffect(() => {
    return sdk.exo.experience.selection.onChange(setSelection);
  }, [sdk]);

  // When the selection changes, resolve the node and read its properties.
  useEffect(() => {
    const { nodeId } = selection;

    if (!nodeId) {
      setProperties(null);
      setLoadingProperties(false);
      return;
    }

    const node = sdk.exo.experience.getNode(nodeId);

    if (!node) {
      setProperties(null);
      setLoadingProperties(false);
      return;
    }

    let active = true;
    setLoadingProperties(true);

    node
      .getProperties()
      .then((props) => {
        if (active) {
          setProperties(props);
          setLoadingProperties(false);
        }
      })
      .catch(() => {
        // The node was likely removed or the host couldn't resolve it; clear
        // the panel back to the empty state rather than leaving a stale spinner.
        // A real app may want to surface this via sdk.notifier.
        if (active) {
          setProperties(null);
          setLoadingProperties(false);
        }
      });

    // Re-read properties whenever this node changes underneath us.
    const unsubscribe = node.onChange(() => {
      node
        .getProperties()
        .then((props) => {
          if (active) {
            setProperties(props);
          }
        })
        .catch(() => {
          /* node may have been removed; ignore */
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [sdk, selection]);

  return (
    <Box padding="spacingM">
      <Stack flexDirection="column" alignItems="flex-start" spacing="spacingM">
        <Flex alignItems="center" gap="spacingXs" flexWrap="wrap">
          <Heading marginBottom="none">Toolbar example</Heading>
          <Badge variant={context.type === 'experience' ? 'primary' : 'secondary'}>
            {context.type}
          </Badge>
          <Badge variant={uiMode === 'visual' ? 'positive' : 'warning'}>{uiMode} mode</Badge>
        </Flex>

        <Text fontColor="gray600" data-test-id="entity-id">
          Editing <code>{context.type}</code> <code>{context.entityId}</code>
        </Text>

        {uiMode === 'form' && (
          <Note variant="warning">
            You are in <strong>form</strong> mode. Canvas selection and highlighting are disabled —
            switch to <strong>visual</strong> mode to select components on the canvas.
          </Note>
        )}

        <Box>
          <Subheading marginBottom="spacingXs">Selected component</Subheading>
          <SelectedNode
            selection={selection}
            properties={properties}
            loading={loadingProperties}
          />
        </Box>
      </Stack>
    </Box>
  );
};

interface SelectedNodeProps {
  selection: Selection;
  properties: ComponentPropertyDescriptor[] | null;
  loading: boolean;
}

const SelectedNode = ({ selection, properties, loading }: SelectedNodeProps) => {
  if (!selection.nodeId) {
    return (
      <Note variant="neutral" data-test-id="empty-state">
        Select a component on the canvas to inspect its properties.
      </Note>
    );
  }

  return (
    <Stack flexDirection="column" alignItems="flex-start" spacing="spacingS">
      <Text fontColor="gray600">
        <code>{selection.nodeType ?? 'Node'}</code> &middot; <code>{selection.nodeId}</code>
      </Text>

      {loading && <Spinner size="small" />}

      {!loading && properties && properties.length === 0 && (
        <Paragraph>This component has no properties.</Paragraph>
      )}

      {!loading && properties && properties.length > 0 && (
        <Table data-test-id="properties-table">
          <Table.Head>
            <Table.Row>
              <Table.Cell>Property</Table.Cell>
              <Table.Cell>Area</Table.Cell>
              <Table.Cell>Value</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {properties.map((property) => (
              <Table.Row key={property.key}>
                <Table.Cell>
                  <code>{property.key}</code>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant={property.area === 'content' ? 'primary' : 'secondary'}>
                    {property.area}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{formatPropertyValue(property)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Stack>
  );
};

/** Renders a property value as a compact, readable string for display. */
function formatPropertyValue(property: ComponentPropertyDescriptor): string {
  if (property.binding) {
    const { sourceType, entryId } = property.binding;
    return entryId ? `${sourceType} → ${entryId}` : sourceType;
  }

  const { value } = property;

  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export default ExperienceToolbar;
