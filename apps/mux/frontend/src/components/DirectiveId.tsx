import { FC } from 'react';
import { Text } from '@contentful/f36-components';

/** A Robots directive id: long and unbroken, so it wraps anywhere rather than overflowing its box. */
const DirectiveId: FC<{ id: string }> = ({ id }) => (
  <Text as="code" fontStack="fontStackMonospace" fontSize="fontSizeS" isWordBreak>
    {id}
  </Text>
);

export default DirectiveId;
