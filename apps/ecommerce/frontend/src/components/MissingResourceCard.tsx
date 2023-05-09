import {
  Badge,
  Box,
  Card,
  Collapse,
  CopyButton,
  Flex,
  IconButton,
  Menu,
  Text,
  Tooltip,
} from '@contentful/f36-components';
import { CloseTrimmedIcon, MoreHorizontalIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { RenderDragFn } from '@contentful/field-editor-reference/dist/types';
import { useState } from 'react';
import { ExternalResourceLink } from '../types';

interface MissingResourceCardProps {
  onRemove: Function;
  dragHandleRender?: RenderDragFn;
  error: string;
  errorMessage?: string;
  errorStatus?: number;
  index?: number;
  isLoading?: boolean;
  value: string;
}

const MissingResourceCard = (props: MissingResourceCardProps) => {
  const [showJson, setShowJson] = useState<boolean>(false);
  const resourceLink = JSON.parse(props.value) as ExternalResourceLink;
  const resourceProvider = resourceLink.sys.provider;
  const resourceType = resourceLink.sys.linkType.split('::')[1];

  return (
    <Card
      isLoading={props.isLoading}
      withDragHandle={!!props.dragHandleRender}
      dragHandleRender={props.dragHandleRender}
      padding="none"
      isHovered={false}>
      <Box paddingLeft="spacingM" style={{ borderBottom: `1px solid ${tokens.gray200}` }}>
        <Flex alignItems="center" fullWidth={true} justifyContent="space-between">
          <Text fontColor="gray600" isWordBreak={true}>
            {resourceProvider} {resourceType}
          </Text>
          <Flex alignItems="center" isInline={true}>
            <Badge variant={props.errorStatus === 404 ? 'warning' : 'negative'}>
              {props.errorMessage}
            </Badge>
            <Menu offset={[-5, 0]}>
              <Menu.Trigger>
                <IconButton icon={<MoreHorizontalIcon />} aria-label="Actions" />
              </Menu.Trigger>
              <Menu.List>
                <Menu.Item onClick={() => props.onRemove(props.index)}>Remove</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={() => setShowJson(!showJson)}>
                  {showJson ? 'Hide Data' : 'Show Data'}
                </Menu.Item>
              </Menu.List>
            </Menu>
          </Flex>
        </Flex>
      </Box>
      <Box padding="spacingXs" paddingLeft="spacingM" paddingRight="spacingM">
        <Text
          fontSize="fontSizeL"
          fontWeight="fontWeightDemiBold"
          lineHeight="lineHeightL"
          isWordBreak={true}>
          Resource is missing or inaccessible
        </Text>
        <Collapse isExpanded={showJson}>
          <Flex alignItems="flex-start" fullWidth={true} justifyContent="space-between">
            <pre
              style={{
                position: 'relative',
                width: '100%',
                margin: `${tokens.spacingXs} 0`,
                border: `1px dashed ${tokens.gray300}`,
                backgroundColor: tokens.gray100,
                padding: `${tokens.spacingS} 56px ${tokens.spacingS} ${tokens.spacingM}`,
              }}>
              {showJson && (
                <div
                  style={{ position: 'absolute', right: tokens.spacingXs, top: tokens.spacingXs }}>
                  <Tooltip content="Hide Data" usePortal={true}>
                    <IconButton
                      size="small"
                      icon={<CloseTrimmedIcon />}
                      onClick={() => setShowJson(false)}
                      aria-label="Hide Data"
                      variant="transparent"
                    />
                  </Tooltip>
                </div>
              )}
              <div
                style={{ position: 'absolute', right: tokens.spacingXs, bottom: tokens.spacingXs }}>
                <CopyButton value={JSON.stringify(JSON.parse(props.value), null, 2)} />
              </div>
              <code>{JSON.stringify(JSON.parse(props.value), null, 2)}</code>
            </pre>
          </Flex>
        </Collapse>
      </Box>
    </Card>
  );
};

export default MissingResourceCard;
