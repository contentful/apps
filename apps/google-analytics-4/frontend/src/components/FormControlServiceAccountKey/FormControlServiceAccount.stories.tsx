import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import FormControlServiceAccountKey from './FormControlServiceAccountKey';

export default {
  title: 'Components/FormControlServiceAccountKey',
  component: FormControlServiceAccountKey,
} as ComponentMeta<typeof FormControlServiceAccountKey>;

export const Primary: ComponentStory<typeof FormControlServiceAccountKey> = () => (
  <FormControlServiceAccountKey
    isValid
    errorMessage=""
    isRequired
    isExpanded
    serviceAccountKeyFile=""
    onKeyFileChange={() => {}}
    onExpanderClick={() => {}}
    currentServiceAccountKey={null}
    currentServiceAccountKeyId={null}
  />
);
