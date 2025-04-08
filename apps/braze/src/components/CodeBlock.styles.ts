import { CSSProperties } from 'react';
import tokens from '@contentful/f36-tokens';

export const lineNumberStyle: CSSProperties = {
  paddingRight: tokens.spacingM,
  paddingLeft: tokens.spacingS,
  marginRight: tokens.spacingM,
  backgroundColor: tokens.colorWhite,
  borderRight: `1px solid ${tokens.gray300}`,
  width: tokens.spacing2Xl,
};

export const copyButtonBar: CSSProperties = {
  backgroundColor: tokens.gray400,
  height: tokens.spacing2Xl,
  borderTopLeftRadius: tokens.borderRadiusSmall,
  borderTopRightRadius: tokens.borderRadiusSmall,
};

export const copyButton: CSSProperties = {
  height: tokens.spacingXl,
  width: tokens.spacingXl,
  minHeight: tokens.spacingXl,
  marginRight: tokens.spacingXs,
};

export const codeBlockWithoutErrorAndWithCopyButton: Record<string, CSSProperties> = {
  'code[class*="language-"]': {
    color: tokens.colorBlack,
    background: 'none',
    textShadow: '0 1px white',
    fontFamily: "'Geist Mono', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    fontSize: tokens.spacingS,
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '2',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    border: `1px solid ${tokens.gray300}`,
    borderBottomLeftRadius: tokens.borderRadiusSmall,
    borderBottomRightRadius: tokens.borderRadiusSmall,
    color: tokens.colorBlack,
    background: tokens.gray100,
    textShadow: '0 1px white',
    fontFamily: "'Geist Mono', Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    fontSize: '1em',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '0em',
    margin: '0em',
    overflow: 'auto',
  },
  'pre[class*="language-"]::-moz-selection': {
    textShadow: 'none',
    background: '#b3d4fc',
  },
  'pre[class*="language-"] ::-moz-selection': {
    textShadow: 'none',
    background: '#b3d4fc',
  },
  'code[class*="language-"]::-moz-selection': {
    textShadow: 'none',
    background: '#b3d4fc',
  },
  'code[class*="language-"] ::-moz-selection': {
    textShadow: 'none',
    background: '#b3d4fc',
  },
  'pre[class*="language-"]::selection': {
    textShadow: 'none',
    background: '#b3d4fc',
  },
  'pre[class*="language-"] ::selection': {
    textShadow: 'none',
    background: '#b3d4fc',
  },
  'code[class*="language-"]::selection': {
    textShadow: 'none',
    background: '#b3d4fc',
  },
  'code[class*="language-"] ::selection': {
    textShadow: 'none',
    background: '#b3d4fc',
  },
  ':not(pre) > code[class*="language-"]': {
    background: '#f5f2f0',
    padding: '.1em',
    borderRadius: '.3em',
    whiteSpace: 'normal',
  },
  comment: {
    color: 'slategray',
  },
  prolog: {
    color: 'slategray',
  },
  doctype: {
    color: 'slategray',
  },
  cdata: {
    color: 'slategray',
  },
  punctuation: {
    color: '#999',
  },
  namespace: {
    opacity: '.7',
  },
  property: {
    color: '#905',
  },
  tag: {
    color: '#905',
  },
  boolean: {
    color: '#905',
  },
  number: {
    color: '#905',
  },
  constant: {
    color: '#905',
  },
  symbol: {
    color: '#905',
  },
  deleted: {
    color: '#905',
  },
  selector: {
    color: '#690',
  },
  'attr-name': {
    color: '#690',
  },
  string: {
    color: '#690',
  },
  char: {
    color: '#690',
  },
  builtin: {
    color: '#690',
  },
  inserted: {
    color: '#690',
  },
  operator: {
    color: '#9a6e3a',
    background: 'hsla(0, 0%, 100%, .5)',
  },
  entity: {
    color: '#9a6e3a',
    background: 'hsla(0, 0%, 100%, .5)',
    cursor: 'help',
  },
  url: {
    color: '#9a6e3a',
    background: 'hsla(0, 0%, 100%, .5)',
  },
  '.language-css .token.string': {
    color: '#9a6e3a',
    background: 'hsla(0, 0%, 100%, .5)',
  },
  '.style .token.string': {
    color: '#9a6e3a',
    background: 'hsla(0, 0%, 100%, .5)',
  },
  atrule: {
    color: '#07a',
  },
  'attr-value': {
    color: '#07a',
  },
  keyword: {
    color: '#07a',
  },
  function: {
    color: '#DD4A68',
  },
  'class-name': {
    color: '#DD4A68',
  },
  regex: {
    color: '#e90',
  },
  important: {
    color: '#e90',
    fontWeight: 'bold',
  },
  variable: {
    color: '#e90',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
};

export const codeBlockWithErrorAndWithCopyButton: Record<string, CSSProperties> = {
  ...codeBlockWithoutErrorAndWithCopyButton,
  'pre[class*="language-"]': {
    ...codeBlockWithoutErrorAndWithCopyButton['pre[class*="language-"]'],
    border: `1px solid ${tokens.red600}`,
    borderBottomLeftRadius: tokens.borderRadiusSmall,
    borderBottomRightRadius: tokens.borderRadiusSmall,
  },
  'code[class*="language-"]': {
    ...codeBlockWithoutErrorAndWithCopyButton['code[class*="language-"]'],
    color: tokens.red600,
  },
};

export const codeBlockWithErrorAndWithoutCopyButtonBorder: Record<string, CSSProperties> = {
  ...codeBlockWithErrorAndWithCopyButton,
  'pre[class*="language-"]': {
    ...codeBlockWithErrorAndWithCopyButton['pre[class*="language-"]'],
    borderRadius: tokens.borderRadiusSmall,
  },
};

export const codeBlockWithoutErrorAndWithoutCopyButtonBorder: Record<string, CSSProperties> = {
  ...codeBlockWithoutErrorAndWithCopyButton,
  'pre[class*="language-"]': {
    ...codeBlockWithoutErrorAndWithCopyButton['pre[class*="language-"]'],
    borderRadius: tokens.borderRadiusSmall,
  },
};
