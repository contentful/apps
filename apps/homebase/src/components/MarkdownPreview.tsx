import * as React from 'react';
import ReactMarkdown from 'react-markdown';

import tokens from '@contentful/f36-tokens';
import { css, cx } from 'emotion';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import Mermaid from './Mermaid';

const styles = {
  root: css`
    border: 1px solid ${tokens.gray400};
    border-width: 0 1px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    min-height: 300px;
    padding: ${tokens.spacingL};
    font-size: ${tokens.fontSizeM};
    font-family: ${tokens.fontStackPrimary};
    line-height: ${tokens.lineHeightDefault};
    color: ${tokens.gray700};
    white-space: normal;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: ${tokens.spacingL};
      margin-bottom: ${tokens.spacingM};
      color: ${tokens.gray900};
    }

    h1:first-child,
    h2:first-child,
    h3:first-child,
    h4:first-child,
    h5:first-child,
    h6:first-child {
      margin-top: 0;
    }

    h1 {
      font-size: 1.9em;
    }
    h2 {
      font-size: 1.75em;
    }
    h3 {
      font-size: 1.6em;
    }
    h4 {
      font-size: 1.45em;
    }
    h5 {
      font-size: 1.3em;
    }
    h6 {
      font-size: 1.15em;
    }

    p {
      margin-top: 0;
      margin-bottom: ${tokens.spacingM};
    }

    ul,
    ol {
      margin: ${tokens.spacingS} 0;
      padding-left: ${tokens.spacingM};
    }
    ul > li {
      list-style-type: disc;
      margin-bottom: 0;
    }

    ol > li {
      list-style-type: decimal;
      margin-bottom: 0;
    }

    table {
      table-layout: fixed;
      border-right-width: 0;
      border-bottom-width: 0;
      width: 80%;
      margin: ${tokens.spacingM} auto;
      border-spacing: 0;
      border-collapse: collapse;
      border: 1px solid ${tokens.gray300};
    }

    table th,
    table td {
      padding: 5px;
      border-left-width: 0;
      border-top-width: 0;
    }

    table th {
      background: ${tokens.gray200};
    }

    table td {
      border: 1px solid ${tokens.gray300};
    }

    a {
      color: ${tokens.blue500};
    }

    hr {
      margin-top: ${tokens.spacingL};
      margin-bottom: ${tokens.spacingL};
      height: 1px;
      background-color: ${tokens.gray300};
      border: none;
    }

    blockquote {
      border-left: 4px solid ${tokens.gray200};
      padding-left: ${tokens.spacingL};
      margin: 0;
      margin-top: ${tokens.spacingM};
      font-style: italic;
    }

    img {
      margin: ${tokens.spacingM} auto;
      display: block;
      max-width: 80%;
      max-height: 250px;
    }

    pre code {
      font-size: ${tokens.fontSizeS};
      font-family: ${tokens.fontStackMonospace};
    }

    pre {
      background-color: ${tokens.gray100};
      border: 1px solid ${tokens.gray300};
      border-radius: ${tokens.borderRadiusMedium};
      padding: ${tokens.spacingM};
      margin: ${tokens.spacingM} 0;
      overflow-x: auto;
    }

    code {
      font-family: ${tokens.fontStackMonospace};
      font-size: ${tokens.fontSizeS};
      background-color: ${tokens.gray100};
      padding: 2px 4px;
      border-radius: ${tokens.borderRadiusSmall};
    }

    pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
    }

    .embedly-card {
      margin: ${tokens.spacingM} auto;
      display: block;
    }

    .mermaid {
      margin: ${tokens.spacingM} auto;
      text-align: center;
      overflow-x: auto;
      max-width: 100%;
    }

    .mermaid svg {
      max-width: 100%;
      height: auto;
      min-width: 600px;
    }

    .mermaid .nodeLabel {
      font-size: 13px;
      font-weight: 500;
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      max-width: none !important;
    }

    .mermaid .edgeLabel {
      font-size: 11px;
      background-color: white;
      padding: 2px 4px;
      border-radius: 3px;
    }

    .mermaid .node rect {
      min-width: 160px;
    }

    .mermaid .node foreignObject {
      overflow: visible;
      width: auto !important;
      min-width: 160px !important;
    }

    .mermaid .node div {
      max-width: none !important;
      min-width: 160px !important;
      padding: 8px 12px !important;
    }
  `,
  framed: css({
    height: '100%',
    maxHeight: '500px',
    overflowY: 'auto',
  }),
  zen: css({
    maxWidth: '900px',
    margin: '0 auto',
    border: 'none !important',
  }),
  fullPage: css({
    border: 'none !important',
  }),
  rtl: css({
    direction: 'rtl',
  }),
};

type MarkdownPreviewProps = {
  /**
   * Minimum height to set for the markdown preview
   */
  minHeight?: string | number;
  mode: 'default' | 'zen' | 'fullPage';
  direction: EditorDirection;
  value: string;
  previewComponents?: PreviewComponents;
};

type MarkdownLinkProps = React.PropsWithChildren<{
  href?: string;
  title?: string;
  className?: string;
  Embedly?: React.ComponentType<{ url: string }>;
}>;

type EditorDirection = 'ltr' | 'rtl';

type PreviewComponents = {
  embedly?: React.ComponentType<{ url: string }>;
};

const replaceMailtoAmp = (string: string) => {
  return string.replace(/href="mailto:[^"]*&amp;/g, function (match) {
    return match.replace(/&amp;/g, '&');
  });
};

function MarkdownLink(props: MarkdownLinkProps) {
  const { Embedly, children, ...rest } = props;

  if (props.className === 'embedly-card' && Embedly) {
    return <Embedly url={props.href ?? ''} />;
  }

  return (
    <a {...rest} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const MarkdownPreview = React.memo((props: MarkdownPreviewProps) => {
  const className = cx(
    props.minHeight !== undefined ? css({ minHeight: props.minHeight }) : undefined,
    props.mode === 'default' && styles.framed,
    props.mode === 'zen' && styles.zen,
    props.mode === 'fullPage' && styles.fullPage,
    props.direction === 'rtl' ? styles.rtl : undefined
  );

  return (
    <div className={cx(className, styles.root)} data-test-id="markdown-preview">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        remarkRehypeOptions={{
          //The HTML is already sanitized by rehype
          allowDangerousHtml: true,
        }}
        components={{
          a: (markdownProps: MarkdownLinkProps) => (
            <MarkdownLink {...markdownProps} Embedly={props.previewComponents?.embedly} />
          ),
          code({ node, inline, className, children, ...props }) {
            // Extract language identifier from CSS class (e.g., "language-mermaid" → "mermaid")
            const match = /language-(\w+)/.exec(className || '');

            // convert React children to string and remove trailing newline that markdown adds
            const code = String(children).replace(/\n$/, '');

            //check if this is a block-level mermaid code block (not inline `code`)
            if (!inline && match?.[1] === 'mermaid') {
              return <Mermaid code={code} />;
            }

            //for all other code blocks, render normal <code> element
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}>
        {replaceMailtoAmp(props.value)}
      </ReactMarkdown>
    </div>
  );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;
