import React, { useEffect, useState } from 'react';
import type {
  ComponentPropertyDescriptor,
  ExperienceContext,
  ExperienceNodeType,
  ExperienceEditorToolbarAppSDK,
} from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Paragraph,
  Spinner,
  Stack,
  Subheading,
  Table,
  Text,
  Tooltip,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

interface Selection {
  nodeId: string | null;
  nodeType?: ExperienceNodeType;
}

/**
 * A minimal Experience Canvas toolbar app. It demonstrates the core `sdk.experiences`
 * patterns a toolbar app is built on:
 *
 *  - reading `sdk.experiences.context` to tell experience vs. fragment editing apart
 *  - subscribing to `sdk.experiences.experience.selection.onChange()`
 *  - resolving the selected node with `sdk.experiences.experience.getNode(nodeId)` and
 *    reading its properties
 *
 * The app mounts once when the editor opens and stays mounted for the session;
 * selection changes do NOT remount it, so all live data flows through the
 * subscriptions below. Each `on*` call returns an unsubscribe function that we
 * call on cleanup.
 */
const ExperienceToolbar = () => {
  const sdk = useSDK<ExperienceEditorToolbarAppSDK>();

  const [context, setContext] = useState<ExperienceContext>(() => sdk.experiences.context);
  const [selection, setSelection] = useState<Selection>(() =>
    sdk.experiences.experience.selection.get()
  );
  const [properties, setProperties] = useState<ComponentPropertyDescriptor[] | null>(null);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Report the panel's height so the host sizes the toolbar app to its content
  // in the stacked Apps panel. sdk.window on the toolbar location arrived in
  // app-sdk 4.67.0; guard it so hosts that don't serve it degrade to a no-op.
  useEffect(() => {
    if (!sdk.window) {
      return;
    }
    sdk.window.startAutoResizer();
    return () => sdk.window.stopAutoResizer();
  }, [sdk]);

  // Keep the editing context (experience vs. fragment) in sync.
  useEffect(() => {
    return sdk.experiences.onContextChanged(setContext);
  }, [sdk]);

  // Track the canvas selection.
  useEffect(() => {
    return sdk.experiences.experience.selection.onChange(setSelection);
  }, [sdk]);

  // When the selection changes, resolve the node and read its properties.
  useEffect(() => {
    const { nodeId } = selection;

    if (!nodeId) {
      setProperties(null);
      setLoadingProperties(false);
      return;
    }

    const node = sdk.experiences.experience.getNode(nodeId);

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

  // Drive the canvas from the toolbar: highlight (and scroll to) the selected
  // node. This is the outbound counterpart to the selection.onChange subscription
  // above — the app directing the canvas, not just reading from it.
  const handleHighlight = () => {
    if (!selection.nodeId) {
      return;
    }
    sdk.experiences.experience.selection.highlight(selection.nodeId, {
      flash: true,
      scrollIntoView: true,
    });
  };

  return (
    <Box padding="spacingM">
      <Stack flexDirection="column" alignItems="flex-start" spacing="spacingM">
        <Flex alignItems="center" gap="spacingXs" flexWrap="wrap">
          <Heading marginBottom="none">Toolbar example</Heading>
          <Badge variant={context.type === 'experience' ? 'primary' : 'secondary'}>
            {context.type}
          </Badge>
        </Flex>

        <Text fontColor="gray600" data-test-id="entity-id">
          Editing <code>{context.type}</code> <code>{context.entityId}</code>
        </Text>

        <Box>
          <Subheading marginBottom="spacingXs">Selected component</Subheading>
          <SelectedNode
            selection={selection}
            properties={properties}
            loading={loadingProperties}
            onHighlight={handleHighlight}
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
  onHighlight: () => void;
}

const SelectedNode = ({ selection, properties, loading, onHighlight }: SelectedNodeProps) => {
  if (!selection.nodeId) {
    return (
      <Note variant="neutral" data-test-id="empty-state">
        Select a component on the canvas to inspect its properties.
      </Note>
    );
  }

  return (
    <Stack flexDirection="column" alignItems="flex-start" spacing="spacingS">
      <Flex alignItems="center" gap="spacingXs" flexWrap="wrap">
        <Text fontColor="gray600">
          <code>{selection.nodeType ?? 'Node'}</code> &middot; <code>{selection.nodeId}</code>
        </Text>
        <Tooltip content="Flash and scroll to this component on the canvas">
          <Button size="small" variant="secondary" onClick={onHighlight} testId="highlight-button">
            Highlight on canvas
          </Button>
        </Tooltip>
      </Flex>

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
    const { binding } = property;
    return binding.type === 'entry' ? `${binding.type} → ${binding.entryId}` : binding.type;
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
