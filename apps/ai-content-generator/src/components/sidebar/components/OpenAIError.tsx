import { FormControl, Note, Paragraph } from '@contentful/f36-components';

interface Props {
  error: string;
}

const OpenAIError = (props: Props) => {
  const { error } = props;

  return (
    <FormControl>
      <Note variant="negative">
        <Paragraph marginBottom="spacingXs">OpenAI API Error</Paragraph>
        {error}
      </Note>
    </FormControl>
  );
};

export default OpenAIError;
