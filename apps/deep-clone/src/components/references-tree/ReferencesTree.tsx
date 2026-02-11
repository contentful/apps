import { useState, useMemo, useEffect } from 'react';
import { Text, Stack, Box, Spinner } from '@contentful/f36-components';
import { ReferencesTreeProps } from './ReferencesTree.types';
import {
  buildTreeStructure,
  collectAllNodeIds,
  collectDisabledPaths,
} from './ReferencesTree.utils';
import { TreeComponent } from './tree/TreeComponent';
import { treeContainerStyles, treeLoadingContainer } from './ReferencesTree.styles';
import { MAX_NODES_TO_EXPAND } from './constant';

export type { TreeNode, ReferencesTreeProps } from './ReferencesTree.types';

export function ReferencesTree({
  referencesTree,
  parentEntryId,
  onSelectedIdsChange,
  listBlockContentIds = [],
}: ReferencesTreeProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([parentEntryId]));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoadingNodes, setIsLoadingNodes] = useState<boolean>(false);

  const tree = useMemo(() => {
    return buildTreeStructure(referencesTree, parentEntryId);
  }, [referencesTree, parentEntryId]);

  // Pre-compute disabled paths for efficient lookups
  const disabledPaths = useMemo(() => {
    if (!tree || listBlockContentIds.length === 0) return new Set<string>();
    return collectDisabledPaths(tree, listBlockContentIds);
  }, [tree, listBlockContentIds]);

  // Initialize expandedIds with all node IDs so all nodes are expanded by default
  useEffect(() => {
    if (!tree) return;

    setIsLoadingNodes(true);
    // Use setTimeout to allow UI to update and show spinner
    setTimeout(() => {
      const allNodeIds =
        Object.keys(referencesTree).length > MAX_NODES_TO_EXPAND
          ? new Set<string>([parentEntryId])
          : collectAllNodeIds(tree);
      setExpandedIds(allNodeIds);
      setIsLoadingNodes(false);
    }, 0);
  }, [tree, referencesTree, parentEntryId]);

  // Filter out disabled nodes from selection on mount and when disabledPaths changes
  useEffect(() => {
    if (disabledPaths.size === 0) return;

    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      // Remove all disabled paths from selection
      disabledPaths.forEach((path) => {
        newSet.delete(path);
      });
      return newSet;
    });
  }, [disabledPaths]);

  // Notify parent when selectedIds change
  // Convert path-based selections back to unique entryIds for the parent
  useEffect(() => {
    if (onSelectedIdsChange) {
      // Extract unique entryIds from paths (paths are like "id1:id2:id3")
      const uniqueEntryIds = new Set<string>();
      selectedIds.forEach((path) => {
        // Get the last entryId from the path (the actual entry being selected)
        const pathParts = path.split(':');
        const entryId = pathParts[pathParts.length - 1];
        if (entryId) {
          uniqueEntryIds.add(entryId);
        }
      });
      onSelectedIdsChange(uniqueEntryIds);
    }
  }, [selectedIds, onSelectedIdsChange]);

  const handleToggle = (nodePath: string, _entryId: string) => {
    if (!tree) return;

    // Don't allow toggling disabled nodes
    if (disabledPaths.has(nodePath)) {
      return;
    }

    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      const isCurrentlySelected = newSet.has(nodePath);

      if (isCurrentlySelected) {
        // Unselecting: remove this node instance and all its descendants in this path
        newSet.delete(nodePath);
        // Remove all descendant paths that start with this path
        const pathsToRemove: string[] = [];
        newSet.forEach((path) => {
          if (path.startsWith(`${nodePath}:`)) {
            pathsToRemove.push(path);
          }
        });
        pathsToRemove.forEach((path) => newSet.delete(path));
      } else {
        // Selecting: add this node instance and all its parent instances in this path
        newSet.add(nodePath);

        // Find and add parent paths in the same branch
        const pathParts = nodePath.split(':');
        if (pathParts.length > 1) {
          // Add all parent paths (remove last part iteratively)
          for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join(':');
            newSet.add(parentPath);
          }
        }
      }

      return newSet;
    });
  };

  const handleToggleExpand = (entryId: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  if (!tree) {
    return <Text>No references found</Text>;
  }

  return (
    <Stack spacing="spacingM" flexDirection="column" style={{ marginTop: '20px', width: '100%' }}>
      <Box className={`${treeContainerStyles}`}>
        {isLoadingNodes ? (
          <Box className={treeLoadingContainer}>
            <Spinner size="large" />
          </Box>
        ) : (
          <TreeComponent
            node={tree}
            selectedIds={selectedIds}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onToggleExpand={handleToggleExpand}
            rootNodeId={parentEntryId}
            disabledPaths={disabledPaths}
          />
        )}
      </Box>
    </Stack>
  );
}
