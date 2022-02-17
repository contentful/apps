import React from 'react';
import { Paragraph } from '@contentful/f36-components';

const Field = (props) => {
  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  return <Paragraph>Hello Entry Field Component</Paragraph>;
};

export default Field;
