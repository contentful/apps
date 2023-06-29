import { Badge, Note, Text, TextLink } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

const BetaWarning = () => {
  return (
    <Note variant="warning">
      <Badge
        style={{
          float: 'right',
          marginLeft: tokens.spacingM,
          marginBottom: tokens.spacingM,
        }}
        variant="warning">
        Limited Beta
      </Badge>
      <Text>
        According to the provider, GPT-4 is currently in a limited beta and only accessible to those
        who have been granted access. Please{' '}
        <TextLink href="https://openai.com/waitlist/gpt-4" target="_blank">
          join their waitlist
        </TextLink>{' '}
        to get access when capacity is available.
      </Text>
    </Note>
  );
};

export default BetaWarning;
