import ResourceCardRawData from './ResourceCardRawData';
import { render, screen } from '@testing-library/react';

const { getAllByTestId, getByTestId } = screen;

describe('ResourceCardRawData component', () => {
  it('mounts', () => {
    render(
      <ResourceCardRawData
        value={JSON.stringify('random JSON')}
        isVisible={true}
        onHide={() => {}}
      />
    );

    const collapse = getByTestId('cf-collapse');
    const JSONElement = document.querySelector('code');
    const icons = getAllByTestId('cf-ui-icon');
    const copyButton = getByTestId('cf-ui-copy-button');

    expect(collapse).toBeInTheDocument();
    expect(JSONElement).toHaveTextContent('random JSON');
    icons.forEach((icon) => expect(icon).toBeInTheDocument());
    expect(copyButton).toBeInTheDocument();
  });
});
