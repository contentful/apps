import { CSSProperties, FC } from 'react';
import { Box, CopyButton, Textarea } from '@contentful/f36-components';

/**
 * A read-only block of code or data, with a copy button under it.
 *
 * Lifted verbatim out of the Player code tab, which is where this treatment started and which now
 * renders through this component. Three things about it are worth keeping rather than
 * reimplementing:
 *
 * - A read-only `Textarea` is boxed, scrolls inside its own box however long the content is, and
 *   can still be selected by hand. That last part matters for a payload someone wants to paste
 *   into a bug report, and it is why the JSON views use this rather than a growing `<pre>` that
 *   pushes the modal off the screen.
 * - f36's `CopyButton` tries `navigator.clipboard.writeText` and falls back to a hidden input plus
 *   `document.execCommand('copy')` when that rejects. Inside the Contentful iframe the async
 *   clipboard API is not reliably granted, so that fallback is the reason copy works at all — do
 *   not swap this for a hand-rolled clipboard call.
 * - `.copycodearea` (`min-height: 200px`, in index.css) gives the block a floor so a one-line
 *   snippet and a thousand-line payload are the same size on screen.
 *
 * `isMonospace` is the only thing this adds to what Player code already did. Player code's block is
 * *not* monospace today — f36's Textarea sets `fontStackPrimary` — and making it so would change
 * that tab's rendering, so the face is opt-in and only the JSON views ask for it.
 */

/**
 * Contentful's own monospace stack, copied from `@contentful/f36-tokens`' `fontStackMonospace`
 * rather than imported: the token package is only a transitive dependency here, and one CSS string
 * is not worth making it a direct one.
 */
const MONOSPACE_STYLE: CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
};

interface CodeBlockProps {
  /** Shown in the block and handed to the copy button, verbatim. */
  value: string;
  /** Tooltip on the copy button before it is pressed. */
  tooltipText: string;
  /** Tooltip on the copy button after a successful copy. */
  tooltipCopiedText: string;
  /** Renders the block in a monospace face. Off by default, so Player code is unchanged. */
  isMonospace?: boolean;
  /**
   * Names this block for tests. Rendered as `data-testid`, matching the rest of this app, rather
   * than through f36's `testId` prop, which renders `data-test-id` and is not what
   * `getByTestId` looks for here. Left off, the block keeps f36's own `cf-ui-textarea`.
   */
  testId?: string;
}

const CodeBlock: FC<CodeBlockProps> = ({
  value,
  tooltipText,
  tooltipCopiedText,
  isMonospace = false,
  testId,
}) => (
  <>
    <Box marginTop="spacingM" marginBottom="spacingS">
      <Textarea
        value={value}
        isReadOnly={true}
        className="copycodearea"
        style={isMonospace ? MONOSPACE_STYLE : undefined}
        data-testid={testId}
      />
    </Box>
    <CopyButton value={value} tooltipCopiedText={tooltipCopiedText} tooltipText={tooltipText} />
  </>
);

export default CodeBlock;
