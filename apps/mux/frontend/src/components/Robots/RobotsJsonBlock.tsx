import { FC } from 'react';
import { Note } from '@contentful/f36-components';
import CodeBlock from '../CodeBlock';

/**
 * Pretty-prints a payload, or returns undefined when there is nothing to print.
 *
 * `JSON.stringify` does not return a string for every input: `undefined` and a function both come
 * back as `undefined`, and a value with a cycle throws. Each of those rendered straight into a
 * block is a blank box — indistinguishable from a job that produced nothing, which is the failure
 * this feature has relapsed into three times. So every way of having nothing collapses to one
 * `undefined` here and the caller says so in words.
 */
export const prettyJson = (value: unknown): string | undefined => {
  try {
    const text = JSON.stringify(value, null, 2);
    return typeof text === 'string' && text.trim().length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
};

/**
 * The one way this app shows JSON — the same block as the Player code tab, whose `CopyButton`
 * falls back to `execCommand` and is therefore the reason copy works inside the Contentful iframe.
 */
const RobotsJsonBlock: FC<{ value: unknown; what: string; testId?: string }> = ({
  value,
  what,
  testId,
}) => {
  const text = prettyJson(value);
  if (!text) {
    return (
      <Note variant="warning">
        There is nothing here to show as JSON — {what} came back empty or could not be read.
      </Note>
    );
  }
  return (
    <CodeBlock
      value={text}
      isMonospace
      tooltipText={`Copy ${what}`}
      tooltipCopiedText="Copied"
      testId={testId}
    />
  );
};

export default RobotsJsonBlock;
