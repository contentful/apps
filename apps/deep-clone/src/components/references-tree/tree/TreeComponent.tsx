import { Text, Box, Flex, IconButton, Tooltip } from '@contentful/f36-components';
import { ChevronRightIcon, ChevronDownIcon } from '@contentful/f36-icons';
import { TreeNode } from '../ReferencesTree.types';
import {
  treeNodeStyles,
  treeNodeWrapper,
  treeNodeSpacer,
  treeNodeIconButton,
} from '../ReferencesTree.styles';
import { NodeItem } from '../node-item/NodeItem';

interface TreeComponentProps {
  node: TreeNode;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onToggle: (_path: string, _entryId: string) => void;
  onToggleExpand: (_entryId: string) => void;
  rootNodeId: string;
  level?: number;
  isLast?: boolean;
  path?: string;
  disabledPaths: Set<string>;
}

export function TreeComponent({
  node,
  selectedIds,
  expandedIds,
  onToggle,
  onToggleExpand,
  rootNodeId,
  level = 0,
  isLast = false,
  path = '',
  disabledPaths,
}: TreeComponentProps) {
  // Use path-based key to uniquely identify this node instance
  const nodePath = path ? `${path}:${node.entryId}` : node.entryId;
  const isSelected = selectedIds.has(nodePath);
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.entryId);
  const isDisabled = disabledPaths.has(nodePath) || !!node.isMorePlaceholder;
  const isRoot = node.entryId === rootNodeId;

  // Special rendering for "+more" placeholder
  if (node.isMorePlaceholder) {
    return (
      <Flex alignItems="flex-start" gap="spacing2Xs">
        <Box className={treeNodeSpacer} />
        <Box className={`${treeNodeStyles} ${treeNodeWrapper} ${isLast ? 'is-last-child' : ''}`}>
          <Box className="tree-node-item">
            <Tooltip content="There are more child components. Open parent entry to see them.">
              <Text fontWeight="fontWeightDemiBold" fontColor="gray600">
                {node.displayName}
              </Text>
            </Tooltip>
          </Box>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex alignItems="flex-start" gap="spacing2Xs">
      {hasChildren && !isRoot && (
        <IconButton
          variant="transparent"
          size="small"
          icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          onClick={() => onToggleExpand(node.entryId)}
          className={treeNodeIconButton}
          style={{ marginTop: '5px' }}
        />
      )}
      {!hasChildren && !isRoot && <Box className={treeNodeSpacer} />}
      <Box className={`${treeNodeStyles} ${treeNodeWrapper} ${isLast ? 'is-last-child' : ''}`}>
        <Box
          className={`tree-node-item ${isDisabled || isRoot ? 'disabled' : ''} ${
            isExpanded ? 'expanded' : ''
          }`}>
          <NodeItem
            node={node}
            isSelected={isSelected}
            isDisabled={isDisabled || isRoot}
            onToggle={onToggle}
            nodePath={nodePath}
          />
        </Box>
        {hasChildren && isExpanded && (
          <Box className="tree-node-children">
            {node.children.map((child, index) => (
              <TreeComponent
                key={`${nodePath}:${child.entryId}`}
                node={child}
                rootNodeId={rootNodeId}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onToggleExpand={onToggleExpand}
                level={level + 1}
                isLast={index === node.children.length - 1}
                path={nodePath}
                disabledPaths={disabledPaths}
              />
            ))}
          </Box>
        )}
      </Box>
    </Flex>
  );
}
