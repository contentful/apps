import React from 'react';
import ConfigScreen from './ConfigScreen';
import { render, screen, fireEvent, configure} from '@testing-library/react';

// configure({testIdAttribute: 'data-test-id'})

// describe('Config Screen component', () => {
//   it('Component text exists', async () => {

//     render(<ConfigScreen sdk={mockSdk} />);
//     // simulate the user clicking the install button
//     await mockSdk.app.onConfigure.mock.calls[0][0];

//     expect( 
//       screen.getByText('Marketo App Configuration')
//       ).toBeInTheDocument();

//   });
// });

// describe('Config inputs work', () => {
//   it('Values are set correctly', () => {

//     render(<ConfigScreen sdk={mockSdk} />);

//     screen.getAllByTestId('cf-ui-text-input').forEach((input, i) => {
//       fireEvent.change(input, {
//         target:{ value: `A test value for input ${i}` }
//       })
//     })

//     screen.getAllByTestId('cf-ui-text-input').forEach((input, i) => {
//       expect(input).toHaveValue(`A test value for input ${i}`)
//     })
//   });
// });

// describe('Test connection button works', () => {
//   it('Produces a notification', () => {
//     render(<ConfigScreen sdk={mockSdk} />);

//     const button = screen.getByTestId('cf-ui-button');

//     fireEvent.click(button)
//     expect(screen.getByTestId('cf-ui-notification'))
//   })
// })