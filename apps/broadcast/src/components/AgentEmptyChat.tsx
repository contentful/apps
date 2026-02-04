import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { ImageIcon, UsersIcon, ListBulletedIcon } from '@contentful/f36-icons';
import { Caption, Flex, Heading, Button } from '@contentful/f36-components';
import { ChatEmptyStateSuggestion } from '../types';

const styles = {
  suggestionPill: css({
    backgroundColor: tokens.colorWhite,
    border: `1px solid ${tokens.gray200}`,
    borderRadius: '99px',
    padding: `${tokens.spacing2Xs} ${tokens.spacingM}`,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.gray100,
    },
    ':active': {
      backgroundColor: tokens.gray200,
    },
  }),
  suggestionIcon: css({
    color: tokens.gray500,
  }),
  layoutToggleButton: css({
    marginBottom: tokens.spacingM,
  }),
  errorMessage: css({
    color: tokens.red600,
    marginTop: tokens.spacingXs,
    textAlign: 'center',
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightMedium,
  }),
};

interface AIChatEmptyStateProps {
  suggestions?: ChatEmptyStateSuggestion[];
  onSuggestionClick?: (suggestion: string) => void;
  onToggleLayout?: () => void;
  currentLayoutVariant?: 'expanded' | 'normal';
  isChangingLayout?: boolean;
  layoutError?: string | null;
  testId?: string;
}

const getDefaultSuggestions = (): ChatEmptyStateSuggestion[] => [
  {
    icon: ImageIcon,
    text: 'Generate a video for the entry about app building guidelines.',
  },
  {
    icon: UsersIcon,
    text: 'Find the entry titled "Product Update" and return its ID.',
  },
  {
    icon: ListBulletedIcon,
    text: 'Search for the entry about "Q1 launch" and create a video.',
  },
];

export const AIChatEmptyState = ({
  suggestions,
  onSuggestionClick,
  onToggleLayout,
  currentLayoutVariant = 'normal',
  isChangingLayout = false,
  layoutError = null,
  testId,
}: AIChatEmptyStateProps) => {
  // Debug: log when error is received
  if (layoutError) {
    console.log('[AgentEmptyChat] Error received:', layoutError);
  }

  const displaySuggestions = suggestions ?? getDefaultSuggestions();
  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick?.(suggestion);
  };

  const handleKeyDown = (event: React.KeyboardEvent, suggestion: string) => {
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      handleSuggestionClick(suggestion);
    }
  };

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap="spacing2Xs"
      padding="spacing2Xs"
      fullHeight
      fullWidth
      testId={testId}>
      {onToggleLayout && (
        <>
          <Button
            onClick={onToggleLayout}
            variant="secondary"
            size="small"
            className={styles.layoutToggleButton}
            isDisabled={isChangingLayout}>
            {isChangingLayout
              ? 'Changing...'
              : currentLayoutVariant === 'expanded'
              ? 'Collapse'
              : 'Expand'}
          </Button>
          {layoutError && (
            <div className={styles.errorMessage}>
              <Caption>{layoutError}</Caption>
            </div>
          )}
        </>
      )}
      <Heading>How can I help?</Heading>
      <Flex flexWrap="wrap" gap="spacingXs" justifyContent="center" fullWidth>
        {displaySuggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon;
          return (
            <button
              key={index}
              type="button"
              className={styles.suggestionPill}
              onClick={() => handleSuggestionClick(suggestion.text)}
              onKeyDown={(event) => handleKeyDown(event, suggestion.text)}>
              <Flex alignItems="center" gap="spacingXs">
                <IconComponent className={styles.suggestionIcon} />
                <Caption>{suggestion.text}</Caption>
              </Flex>
            </button>
          );
        })}
      </Flex>
    </Flex>
  );
};
