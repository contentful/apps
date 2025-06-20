import React from 'react';
import { Button, Flex, CopyButton } from '@contentful/f36-components';
import DeleteUndoButton from './DeleteUndoButton';

interface MenuProps {
  requestRemoveAsset: () => void;
  onDelete: () => void;
  onUndo: () => void;
  isPendingDelete: boolean;
  resync: () => void;
  assetId: string;
}

class Menu extends React.Component<MenuProps, {}> {
  render() {
    return (
      <section data-testid="menu_header">
        <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingM">
          <Flex alignItems="center">
            <Flex marginRight="spacingM">
              <CopyButton value={this.props.assetId} tooltipText="Mux Asset ID" />
            </Flex>
          </Flex>
          <Flex>
            <Flex marginRight="spacingM">
              <Button variant="secondary" onClick={this.props.requestRemoveAsset} id="remove">
                Remove
              </Button>
            </Flex>
            <Flex>
              <DeleteUndoButton
                isPendingDelete={this.props.isPendingDelete}
                onDelete={this.props.onDelete}
                onUndo={this.props.onUndo}
              />
            </Flex>
          </Flex>
        </Flex>
      </section>
    );
  }
}

export default Menu;
