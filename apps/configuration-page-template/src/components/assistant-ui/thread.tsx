import {
  ArrowDownIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  CopySimpleIcon,
  PencilSimpleIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CubesThreeIcon,
} from '@contentful/f36-icons';
import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react';

import type { FC } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';

import { MarkdownText } from '../../components/assistant-ui/markdown-text';
import { ToolFallback } from '../../components/assistant-ui/tool-fallback';
import { TooltipIconButton } from '../../components/assistant-ui/tooltip-icon-button';
import {
  ComposerAttachments,
  UserMessageAttachments,
} from '../../components/assistant-ui/attachment';

import { cn } from '../../lib/utils';
import { IconButton, Paragraph, Button } from '@contentful/f36-components';
import { XSquareIcon } from 'lucide-react';
import tokens from '@contentful/f36-tokens';

export interface ThreadProps {
  onSuggestionClick?: () => void;
}

export const Thread: FC<ThreadProps> = ({ onSuggestionClick }) => {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <ThreadPrimitive.Root
          className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
          style={{
            ['--thread-max-width' as string]: '44rem',
            height: 'calc(100vh - 101px)',
          }}>
          <ThreadPrimitive.Viewport className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll px-4">
            <ThreadPrimitive.If empty>
              <ThreadWelcome onSuggestionClick={onSuggestionClick} />
            </ThreadPrimitive.If>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                EditComposer,
                AssistantMessage,
              }}
            />

            <ThreadPrimitive.If empty={false}>
              <div className="aui-thread-viewport-spacer min-h-8 grow" />
            </ThreadPrimitive.If>

            <Composer />
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </MotionConfig>
    </LazyMotion>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent">
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

interface ThreadWelcomeProps {
  onSuggestionClick?: () => void;
}

const ThreadWelcome: FC<ThreadWelcomeProps> = ({ onSuggestionClick }) => {
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
      <div className="aui-thread-welcome-center flex w-full flex-grow flex-col items-center justify-center">
        <Paragraph
          style={{
            textAlign: 'center',
            fontSize: tokens.fontSizeXl,
            fontWeight: tokens.fontWeightDemiBold,
            lineHeight: tokens.lineHeightXl,
            maxWidth: '220px',
          }}>
          Let's build your app's configuration page
        </Paragraph>
        <ThreadSuggestions onSuggestionClick={onSuggestionClick} />
      </div>
    </div>
  );
};

interface ThreadSuggestionsProps {
  onSuggestionClick?: () => void;
}

const ThreadSuggestions: FC<ThreadSuggestionsProps> = ({ onSuggestionClick }) => {
  return (
    <div className="aui-thread-welcome-suggestions pb-4">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.05 }}
        key={`suggested-action`}
        className="aui-thread-welcome-suggestion-display">
        <Button
          startIcon={<CubesThreeIcon color={tokens.gray700} />}
          onClick={onSuggestionClick}
          style={{ borderRadius: '50px' }}>
          <Paragraph
            style={{
              fontSize: tokens.fontSizeS,
              fontWeight: tokens.fontWeightMedium,
              margin: '0',
            }}>
            Add UI building blocks
          </Paragraph>
        </Button>
      </m.div>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <div className="aui-composer-wrapper sticky bottom-0 mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
      <ThreadScrollToBottom />
      <ComposerPrimitive.Root
        style={{
          border: '1px solid #E3E8EE',
          borderRadius: '8px',
          padding: '8px',
          backgroundColor: 'white',
        }}>
        <ComposerAttachments />

        <ComposerPrimitive.Input
          placeholder="Send a message..."
          className="aui-composer-input mb-1 max-h-32 min-h-16 w-full resize-none bg-transparent px-3.5 pt-1.5 pb-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <ComposerAction />
      </ComposerPrimitive.Root>
    </div>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="aui-composer-action-wrapper relative mx-1 mt-2 mb-2 flex items-center justify-between">
      {/* <ComposerAddAttachment /> */}
      <div />
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <IconButton
            icon={<ArrowUpIcon />}
            variant="primary"
            aria-label="Send message"
            size="small"
            style={{ borderRadius: '50%' }}
          />
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <IconButton
            icon={<XSquareIcon />}
            variant="primary"
            aria-label="Send message"
            size="small"
            style={{ borderRadius: '50%', height: '32px', width: '32px', padding: '6px' }}
          />
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <div
        className="aui-assistant-message-root relative mx-auto w-full max-w-[var(--thread-max-width)] animate-in py-4 duration-150 ease-out fade-in slide-in-from-bottom-1 last:mb-24"
        data-role="assistant">
        <div className="aui-assistant-message-content mx-2 leading-7 break-words text-foreground">
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              tools: { Fallback: ToolFallback },
            }}
          />
          <MessageError />
        </div>

        <div className="aui-assistant-message-footer mt-2 ml-2 flex">
          <BranchPicker />
          <AssistantActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm">
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckCircleIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopySimpleIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <PencilSimpleIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <div
        className="aui-user-message-root mx-auto grid w-full max-w-[var(--thread-max-width)] animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 px-2 py-4 duration-150 ease-out fade-in slide-in-from-bottom-1 first:mt-3 last:mb-5 [&:where(>*)]:col-start-2"
        data-role="user">
        <UserMessageAttachments />

        <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
          <div className="aui-user-message-content rounded-3xl bg-muted px-5 py-2.5 break-words text-foreground">
            <MessagePrimitive.Parts />
          </div>
          <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
            <UserActionBar />
          </div>
        </div>

        <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
      </div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end">
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-4">
          <PencilSimpleIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <div className="aui-edit-composer-wrapper mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 px-2 first:mt-4">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-7/8 flex-col rounded-xl bg-muted">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input flex min-h-[60px] w-full resize-none bg-transparent p-4 text-foreground outline-none"
          autoFocus
        />

        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center justify-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="transparent" aria-label="Cancel edit">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button variant="primary" aria-label="Update message">
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({ className, ...rest }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        'aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-xs text-muted-foreground',
        className
      )}
      {...rest}>
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <CaretLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <CaretRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
