import { FormControl, Textarea } from '@contentful/f36-components';
import { FormEvent } from 'react';

const Topic = () => {
  return (
    <FormControl>
      <FormControl.Label>Provide a topic</FormControl.Label>
      <Textarea
        rows={5}
        name="prompt"
        placeholder="Example: 'How to make a gourmet sandwich'"
        value={prompt}
        onInput={(event: FormEvent<Text>) => setPrompt(event.target.value)}
      />
    </FormControl>
  );
};

export default Topic;
