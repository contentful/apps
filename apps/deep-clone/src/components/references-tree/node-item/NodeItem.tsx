import { Checkbox, Text, Flex } from '@contentful/f36-components';
import { AssetIcon } from '@contentful/f36-icons';
import { treeNodeInnerFlex, treeNodeIcon, treeNodeText } from '../ReferencesTree.styles';
import { TreeNode } from '../ReferencesTree.types';

export interface NodeItemProps {
  node: TreeNode;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (nodePath: string, entryId: string) => void;
  nodePath: string;
}

export function NodeItem({ node, isSelected, isDisabled, onToggle, nodePath }: NodeItemProps) {
  return (
    <Checkbox
      className="tree-node-item-checkbox"
      isChecked={isSelected}
      isDisabled={isDisabled}
      onChange={() => onToggle(nodePath, node.entryId)}
      id={`checkbox-${nodePath}`}>
      <Flex alignItems="center" gap="spacing2Xs" className={treeNodeInnerFlex}>
        {node.isAsset && <AssetIcon variant="muted" size="small" className={treeNodeIcon} />}
        <Text fontWeight="fontWeightDemiBold" className={treeNodeText}>
          {node.displayName}
        </Text>
        {node.internalName && (
          <Text fontWeight="fontWeightNormal" fontColor="gray600" className={treeNodeText}>
            ({node.internalName})
          </Text>
        )}
      </Flex>
      {node.children.length > 0 && (
        <Flex className="tree-node-item-children-count">
          <Text
            style={{ width: 'max-content' }}
            fontStack="fontStackMonospace"
            fontSize="fontSizeS"
            isWordBreak={false}>
            {node.children.length} item{node.children.length > 1 ? 's' : ''}
          </Text>
        </Flex>
      )}
    </Checkbox>
  );
}
