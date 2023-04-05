import { SkeletonContainer, SkeletonImage } from '@contentful/f36-components';
import React from 'react';

export const LoadingStats = () => (
  <SkeletonContainer>
    <SkeletonImage width={213} height={114} />
    <SkeletonImage width={213} height={114} offsetLeft={229} />
    <SkeletonImage width={213} height={114} offsetLeft={458} />
    <SkeletonImage width={213} height={114} offsetLeft={687} />
  </SkeletonContainer>
);
