import { FC } from 'react';
import { ComposerPrimitive, ThreadPrimitive } from '@assistant-ui/react';
import { Box, Flex, IconButton, Textarea, Tooltip } from '@contentful/f36-components';
import { ArrowUpIcon, CloseIcon } from '@contentful/f36-icons';

const composerStyles = {
  root: {
    position: 'sticky' as const,
    bottom: 0,
    backgroundColor: 'white',
    padding: '16px',
    borderTop: '1px solid #E3E8EE',
  },
  inputWrapper: {
    border: '1px solid #CFD9E0',
    borderRadius: '8px',
    padding: '8px',
    backgroundColor: 'white',
  },
};

export const ChatComposer: FC = () => {
  return (
    <Box style={composerStyles.root}>
      <ComposerPrimitive.Root>
        <Flex flexDirection="column" gap="spacingS" style={composerStyles.inputWrapper}>
          <ComposerPrimitive.Input asChild rows={1} autoFocus placeholder="Send a message...">
            <Textarea
              style={{
                border: 'none',
                resize: 'none',
                minHeight: '40px',
                maxHeight: '120px',
                padding: 0,
              }}
            />
          </ComposerPrimitive.Input>

          <Flex justifyContent="flex-end" alignItems="center">
            <ThreadPrimitive.If running={false}>
              <ComposerPrimitive.Send asChild>
                <Tooltip content="Send message">
                  <IconButton
                    icon={<ArrowUpIcon />}
                    variant="primary"
                    aria-label="Send message"
                    size="small"
                    style={{ borderRadius: '50%' }}
                  />
                </Tooltip>
              </ComposerPrimitive.Send>
            </ThreadPrimitive.If>

            <ThreadPrimitive.If running>
              <ComposerPrimitive.Cancel asChild>
                <Tooltip content="Stop generating">
                  <IconButton
                    icon={<CloseIcon />}
                    variant="secondary"
                    aria-label="Stop generating"
                    size="small"
                    style={{ borderRadius: '50%' }}
                  />
                </Tooltip>
              </ComposerPrimitive.Cancel>
            </ThreadPrimitive.If>
          </Flex>
        </Flex>
      </ComposerPrimitive.Root>
    </Box>
  );
};
