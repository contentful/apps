import { FC } from 'react';
import { MessagePrimitive, ActionBarPrimitive, BranchPickerPrimitive } from '@assistant-ui/react';
import { Card, Flex, Text, IconButton, Tooltip } from '@contentful/f36-components';
import {
  CopyIcon,
  CycleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@contentful/f36-icons';

const messageStyles = {
  userMessage: {
    backgroundColor: '#E3E8EE',
    padding: '12px 16px',
    borderRadius: '16px',
    maxWidth: '80%',
    marginLeft: 'auto',
  },
  assistantMessage: {
    padding: '12px 0',
  },
  actionBar: {
    marginTop: '8px',
  },
};

export const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root>
      <Flex flexDirection="column" style={messageStyles.assistantMessage} marginBottom="spacingM">
        <Text fontSize="fontSizeM" lineHeight="lineHeightM">
          <MessagePrimitive.Parts />
        </Text>

        <Flex alignItems="center" style={messageStyles.actionBar}>
          <BranchPicker />
          <AssistantActionBar />
        </Flex>
      </Flex>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root hideWhenRunning autohide="not-last" autohideFloat="single-branch">
      <Flex gap="spacing2Xs">
        <ActionBarPrimitive.Copy asChild>
          <Tooltip content="Copy">
            <IconButton
              variant="transparent"
              icon={<CopyIcon />}
              aria-label="Copy message"
              size="small">
              <MessagePrimitive.If copied>
                <CheckCircleIcon variant="positive" />
              </MessagePrimitive.If>
              <MessagePrimitive.If copied={false}>
                <CopyIcon />
              </MessagePrimitive.If>
            </IconButton>
          </Tooltip>
        </ActionBarPrimitive.Copy>

        <ActionBarPrimitive.Reload asChild>
          <Tooltip content="Refresh">
            <IconButton
              icon={<CycleIcon />}
              variant="transparent"
              aria-label="Refresh message"
              size="small">
              <CycleIcon />
            </IconButton>
          </Tooltip>
        </ActionBarPrimitive.Reload>
      </Flex>
    </ActionBarPrimitive.Root>
  );
};

export const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root>
      <Flex flexDirection="column" alignItems="flex-end" marginBottom="spacingM">
        <Card style={messageStyles.userMessage}>
          <Text fontSize="fontSizeM" lineHeight="lineHeightM">
            <MessagePrimitive.Parts />
          </Text>
        </Card>

        <BranchPicker />
      </Flex>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC = () => {
  return (
    <BranchPickerPrimitive.Root hideWhenSingleBranch>
      <Flex alignItems="center" gap="spacing2Xs" marginTop="spacingXs">
        <BranchPickerPrimitive.Previous asChild>
          <Tooltip content="Previous">
            <IconButton
              icon={<ChevronLeftIcon />}
              variant="transparent"
              aria-label="Previous message"
              size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        </BranchPickerPrimitive.Previous>

        <Text fontSize="fontSizeS" fontColor="gray600">
          <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
        </Text>

        <BranchPickerPrimitive.Next asChild>
          <Tooltip content="Next">
            <IconButton
              icon={<ChevronRightIcon />}
              variant="transparent"
              aria-label="Next message"
              size="small">
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </BranchPickerPrimitive.Next>
      </Flex>
    </BranchPickerPrimitive.Root>
  );
};
