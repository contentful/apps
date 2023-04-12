import { SkeletonContainer, SkeletonImage, SkeletonDisplayText } from '@contentful/f36-components';
import React from 'react';

export const LoadingMembers = () => (
  <SkeletonContainer>
    <SkeletonImage
      width={85}
      height={85}
      offsetLeft={24}
      offsetTop={20}
      radiusX={50}
      radiusY={50}
    />
    <SkeletonDisplayText offsetLeft={24} width={85} offsetTop={120} />
    <SkeletonImage
      width={85}
      height={85}
      offsetLeft={174}
      offsetTop={20}
      radiusX={50}
      radiusY={50}
    />
    <SkeletonDisplayText offsetLeft={174} width={85} offsetTop={120} />
    <SkeletonImage
      width={85}
      height={85}
      offsetLeft={328}
      offsetTop={20}
      radiusX={50}
      radiusY={50}
    />
    <SkeletonDisplayText offsetLeft={328} width={85} offsetTop={120} />
    <SkeletonImage
      width={85}
      height={85}
      offsetLeft={478}
      offsetTop={20}
      radiusX={50}
      radiusY={50}
    />
    <SkeletonDisplayText offsetLeft={478} width={85} offsetTop={120} />
  </SkeletonContainer>
);
