import type { ComponentType, ReactNode } from 'react';
import type { IconProps } from '@contentful/f36-icons';

export type ChatEmptyStateSuggestion = {
  icon: ComponentType<IconProps>;
  text: string;
};

export type Agent = {
  name: string;
  icon?: ReactNode;
  suggestions?: ChatEmptyStateSuggestion[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type AIChatProps = {
  agent: Agent;
  onClose?: () => void;
};
