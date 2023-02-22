import { SDKProvider } from '@contentful/react-apps-toolkit';
import { GlobalStyles } from '@contentful/f36-components';
import React from 'react';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  storySort: {
    order: ['Components', 'Example'],
  },
  // viewport: {
  //   viewports: {
  //     desktop: {
  //       name: 'Desktop',
  //       styles: {
  //         width: '1300px',
  //         heigth: '700px'
  //       }
  //     }
  //   }
  // },
  backgrounds: {
    default: 'white',
    values: [
      {
        name: 'white',
        value: '#FFFFFF',
      },
      {
        name: 'dark',
        value: '#333333',
      },
      {
        name: 'lightblue',
        value: '#F4FBFF',
      },
    ],
  },
};

export const decorators = [
  (Story) => (
    // <SDKProvider>
    <>
      <GlobalStyles />
      <Story />
    </>
    // </SDKProvider>
  ),
];
