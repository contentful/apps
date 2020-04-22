import React from 'react';

import {
  Card,
  DisplayText,
  Paragraph,
  SkeletonDisplayText,
  SkeletonContainer,
} from '@contentful/forma-36-react-components';

interface CollectionProps {
  value: number | null;
  label: string;
}

export default function Collection({ value, label }: CollectionProps) {
  return (
    <Card>
      <DisplayText element="h2" size="large">
        {value === null ? (
          <SkeletonContainer>
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
