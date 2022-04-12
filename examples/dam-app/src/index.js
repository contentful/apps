import { setup } from '@contentful/dam-app-base';
import { EntityList } from '@contentful/f36-components';
import pick from 'lodash/pick';
import { useAsync } from 'react-async-hook';
import { render } from 'react-dom';

const CTA = 'Sample DAM Demo App';
const FIELDS_TO_PERSIST = ['id', 'filename', 'url'];

setup({
  cta: CTA,
  name: 'Contentful DAM Demo App',
  logo: 'https://images.ctfassets.net/fo9twyrwpveg/6eVeSgMr2EsEGiGc208c6M/f6d9ff47d8d26b3b238c6272a40d3a99/contentful-logo.png',
  color: '#036FE3',
  description:
    'This is a sample Application to demonstrate how to make a custom DAM application on top of Contentful.',
  parameterDefinitions: [
    {
      id: 'apiKey',
      type: 'Symbol',
      name: 'API Key',
      description: 'Provide the API key here',
      required: true,
    },
    {
      id: 'projectId',
      type: 'Number',
      name: 'Project Id',
      description: 'Provide the Project Id here',
      required: true,
    },
  ],
  validateParameters,
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled: () => false,
});

function DialogLocation({ sdk }) {
  const apiKey = sdk.parameters.installation.apiKey;
  const projectId = sdk.parameters.installation.projectId;

  const { result: damData } = useAsync(async () => {
    const response = await fetch(
      `/dam_api_response.json?api_key=${apiKey}&project_id=${projectId}`
    );
    return response.json();
  }, [apiKey, projectId]);

  if (!damData) {
    return <div>Please wait</div>;
  }

  return (
    <EntityList>
      {damData.map((item) => (
        <EntityList.Item
          key={item.id}
          title={item.name}
          description="Description"
          thumbnailUrl={item.url}
          onClick={() => sdk.close([item])}
        />
      ))}
    </EntityList>
  );
}

function makeThumbnail(attachment) {
  const thumbnail = attachment.thumbnail_url || attachment.url;
  const url = typeof thumbnail === 'string' ? thumbnail : undefined;
  const alt = attachment.filename;
  return [url, alt];
}

async function renderDialog(sdk) {
  render(<DialogLocation sdk={sdk} />, document.getElementById('root'));
  sdk.window.startAutoResizer();
}

async function openDialog(sdk, _currentValue, _config) {
  const result = await sdk.dialogs.openCurrentApp({
    position: 'center',
    title: CTA,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    width: 400,
    allowHeightOverflow: true,
  });

  if (!Array.isArray(result)) {
    return [];
  }

  return result.map((asset) => pick(asset, FIELDS_TO_PERSIST));
}

function validateParameters({ apiKey, projectId }) {
  if (!apiKey) {
    return 'Please add an API Key';
  }

  if (!projectId) {
    return 'Please add a Project Id';
  }

  return null;
}
