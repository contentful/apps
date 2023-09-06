import type { FC } from 'react';
import { CommerceToolsProduct } from './types';
import { LinkDataItemRenderer, MetaDataRenderer } from '@contentful/ecommerce-app-base';
import * as React from 'react';
import { Box, Caption, DateTime, Text, TextLink } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

type Props = {
  product: CommerceToolsProduct;
};

const NOT_AVAILABLE = 'Not available';
const MAX_NUM_ATTRIBUTES = 3;

const createCreatedDate = (data?: string) => ({
  name: 'Created',
  value: data ? <DateTime date={data} /> : NOT_AVAILABLE,
});

const createUpdatedDate = (data?: string) => ({
  name: 'Updated',
  value: data ? <DateTime date={data} /> : NOT_AVAILABLE,
});

const createExternalLink = (href?: string) => {
  return () => (!!href ? <LinkDataItemRenderer text={'More information'} href={href} /> : null);
};

const createAttributes = (
  attributes: NonNullable<CommerceToolsProduct['additionalData']>['attributes']
) => {
  const hasTooManyAttributes = attributes.length > MAX_NUM_ATTRIBUTES;

  if (!hasTooManyAttributes) {
    return attributes;
  }

  return [
    ...attributes.slice(0, MAX_NUM_ATTRIBUTES),
    () => (
      <Text fontSize="fontSizeS" fontColor="gray700">
        <i>+{attributes.length - MAX_NUM_ATTRIBUTES} more attributes in commercetools</i>
      </Text>
    ),
  ];
};

const footer = () => {
  return (
    <Box marginTop={'spacingXs'}>
      <Caption>
        Missing something?{' '}
        <TextLink
          href={'https://contentful.typeform.com/shopify-app'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: tokens.fontSizeS,
            verticalAlign: 'inherit',
          }}>
          Let us know
        </TextLink>
      </Caption>
    </Box>
  );
};

export const AdditionalDataRenderer: FC<Props> = ({ product }) => {
  const { additionalData, externalLink } = product;

  const columns = [
    {
      title: 'Commercetools activity',
      items: [
        createCreatedDate(additionalData?.createdAt),
        createUpdatedDate(additionalData?.updatedAt),
      ],
    },
    {
      title: 'Attributes',
      items: [
        ...createAttributes(additionalData?.attributes ?? []),
        createExternalLink(externalLink),
      ],
    },
  ];

  return <MetaDataRenderer columns={columns} footer={footer} />;
};
