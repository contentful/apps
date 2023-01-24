import React from 'react';

import {
  Card,
  DisplayText,
  Paragraph,
  SkeletonDisplayText,
  SkeletonContainer,
} from '@contentful/f36-components';

interface CollectionProps {
  value: number | null;
  label: string;
}

export default function Collection({ value, label }: CollectionProps) {
  return (
    <Card>
      <DisplayText as="h2" marginBottom="none" size="large">
        {value === null ? (
          <SkeletonContainer svgHeight="48px">
            <SkeletonDisplayText numberOfLines={1} />
          </SkeletonContainer>
        ) : (
          value
        )}
      </DisplayText>
      <Paragraph>{label}</Paragraph>
    </Card>
  );
}
