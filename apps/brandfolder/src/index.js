import pick from 'lodash/pick';
import { setup } from 'shared-dam-app';

const CTF_APP_URL = 'https://brandfolder.ctfapps.net';
const BF_EMBED_URL = `https://integration-panel-ui.brandfolder-svc.com?channel=message&appName=Contentful&origin=${CTF_APP_URL}&initMsg=hi`;

const CTA = 'Select an asset on Brandfolder';

const FIELDS_TO_PERSIST = [
  'id',
  'type',
  'mimetype',
  'extension',
  'filename',
  'size',
  'width',
  'height',
  'url',
  'thumbnail_url',
  'position',
  'relationships',
  'included',
  'asset.id',
  'cdn_url'
];

function makeThumbnail(attachment) {
  const thumbnail = attachment.thumbnail_url || attachment.url;
  const url = typeof thumbnail === 'string' ? thumbnail : undefined;
  const alt = attachment.filename;

  return [url, alt];
}

function renderDialog(sdk) {
  const config = sdk.parameters.invocation;

  const container = document.createElement('div');
  container.innerHTML = `<iframe id='brandfolder-embed' class='iframe-container' src='${BF_EMBED_URL}' width=400 height=650 style='border:none;'/>`;
  document.body.appendChild(container);

  sdk.window.startAutoResizer();

  window.addEventListener('message', e => {
    const { data, origin } = e;
    if (origin === 'https://integration-panel-ui.brandfolder-svc.com') {
      const { event, payload } = data;
      if (event === 'selectedAttachment') {
        sdk.close([payload]);
      } else if (data.event === 'selectedAsset' && payload.attachments.length !== 0) {
        const att_id = payload.attachments[0].id;
        const attachment = payload.included.find(att => att.id === att_id);
        if (attachment) {
          sdk.close([attachment]);
        }
      }
    }
  });
}

async function openDialog(sdk, _currentValue, config) {
  const result = await sdk.dialogs.openCurrentApp({
    position: 'center',
    title: CTA,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: { ...config },
    width: 400,
    allowHeightOverflow: true
  });

  if (!Array.isArray(result)) {
    return [];
  }

  // Example result:
  // [{
  //     "id": "pfbfh7-f4zem0-dpcdo2",
  //     "type": "attachments",
  //     "mimetype": "image/png",
  //     "filename": "brandfolder-icon.png",
  //     "size": 9252,
  //     "width": 312,
  //     "height": 294,
  //     "url": "https://s3.amazonaws.com/bf.boulder.prod/pfbfh7-f4zem0-dpcdo2/original/brandfolder-icon.png",
  //     "thumbnail_url": "https://assets.brandfolder.com/pfbfh7-f4zem0-dpcdo2/element.png?v=1555005228",
  //     "position": 0,
  //     "included": null,
  //     "asset": {
  //         "id": "6skcfbkq"
  //     }
  // }]
  return result.map(asset => pick(asset, FIELDS_TO_PERSIST));
}

setup({
  cta: CTA,
  name: 'Brandfolder',
  logo: 'https://cdn.brandfolder.io/YUHW9ZNT/at/pgec4f-cttweo-a5euhh/brandfolder-icon-favicon.svg',
  color: '#40D1F5',
  description:
    'The Brandfolder app is a widget that allows editors to select media from their Brandfolder account. Select a file on Brandfolder and designate the assets that you want your entry to reference.',
  parameterDefinitions: [],
  validateParameters: () => {},
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled: () => {
    false;
  }
});
