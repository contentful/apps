import * as React from 'react';
import { Box, Collapse, CopyButton, Flex, IconButton, Tooltip } from '@contentful/f36-components';
import { ChevronUpTrimmedIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

interface ProductCardRawDataProps {
  value: string;
  isVisible: boolean;
  onHide: Function;
}

const ProductCardRawData = (props: ProductCardRawDataProps) => {
  const { value, isVisible, onHide } = props;

  return (
    <Collapse isExpanded={isVisible}>
      <Box paddingTop="spacingM">
        <Flex alignItems="flex-start" fullWidth={true} justifyContent="space-between">
          <pre
            style={{
              position: 'relative',
              width: '100%',
              margin: 0,
              border: `1px dashed ${tokens.gray300}`,
              backgroundColor: tokens.gray100,
              padding: `${tokens.spacingS} 56px ${tokens.spacingS} ${tokens.spacingM}`,
            }}>
            {isVisible && (
              <div
                style={{
                  position: 'absolute',
                  right: tokens.spacingXs,
                  top: tokens.spacingXs,
                }}>
                <Tooltip content="Hide Data" usePortal={true}>
                  <IconButton
                    size="small"
                    icon={<ChevronUpTrimmedIcon />}
                    onClick={() => onHide()}
                    aria-label="Hide Data"
                    variant="transparent"
                  />
                </Tooltip>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                right: tokens.spacingXs,
                bottom: tokens.spacingXs,
              }}>
              <CopyButton value={JSON.stringify(JSON.parse(value), null, 2)} />
            </div>
            <code>{JSON.stringify(JSON.parse(value), null, 2)}</code>
          </pre>
        </Flex>
      </Box>
    </Collapse>
  );
};

export default ProductCardRawData;
