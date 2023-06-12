import FieldJsonEditor from './FieldJsonEditor';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCma, mockSdk } from '../../../../../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: jest.fn(),
}));

const { getByText, findByText } = screen;

describe('FieldJsonEditor component', () => {
  it('mounts', () => {
    render(<FieldJsonEditor />);

    const showButton = getByText('Show JSON');

    expect(showButton).toBeVisible();
  });

  it('handles toggle between show and hide', async () => {
    render(<FieldJsonEditor />);

    const showButton = getByText('Show JSON');

    await userEvent.click(showButton);

    const hideButton = await findByText('Hide JSON');
    expect(hideButton).toBeVisible();
  });
});
