import { Text, Spacing, Paragraph, TextLink } from '@contentful/f36-components';
import { ColorTokens } from '@contentful/f36-tokens';
import React from 'react';
import { ExternalLinkIcon } from '@contentful/f36-icons';

type InformationSectionProps = {
  url: string;
  children?: string;
  linkText: string;
  marginTop?: Spacing;
  marginBottom?: Spacing;
  fontColor?: ColorTokens | undefined;
  dataTestId?: string;
};
function InformationWithLink(props: InformationSectionProps) {
  return (
    <Paragraph
      fontColor={props.fontColor}
      marginBottom={props.marginBottom ? props.marginBottom : 'spacing2Xs'}
      marginTop={props.marginTop ? props.marginTop : 'spacingXs'}
      data-testid={props.dataTestId}>
      {props.children}{' '}
      <TextLink
        icon={<ExternalLinkIcon />}
        alignIcon="end"
        href={props.url}
        target="_blank"
        data-testid={`link-${props.dataTestId}`}
        rel="noopener noreferrer">
        {props.linkText}
      </TextLink>
      <Text> .</Text>
    </Paragraph>
  );
}

export default InformationWithLink;
