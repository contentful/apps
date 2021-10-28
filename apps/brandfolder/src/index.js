import pick from 'lodash/pick';
import { setup } from '@contentful/dam-app-base';

const CTF_APP_URL = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
const BF_EMBED_URL = `https://integration-panel-ui.brandfolder-svc.com?channel=message&appName=Contentful&origin=${CTF_APP_URL}&attachment_fields=mux_hls_url`;

const CTA = 'Select an asset on Brandfolder';

const FIELDS_TO_PERSIST = [
  'asset',
  'cdn_url',
  'mux_hls_url',
  'extension',
  'filename',
  'height',
  'id',
  'included',
  'mimetype',
  'position',
  'relationships',
  'size',
  'thumbnail_url',
  'type',
  'url',
  'width',
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
  const bf_embed_url = config.bf_api_key
    ? BF_EMBED_URL + `&apiKey=${config.bf_api_key}&hideLogout=true`
    : BF_EMBED_URL;

  const iframe = document.createElement('iframe');
  iframe.id = 'brandfolder-embed';
  iframe.className = 'iframe-container';
  iframe.src = bf_embed_url;
  iframe.width = 400;
  iframe.height = 650;
  iframe.style.border = 'none';
  container.appendChild(iframe);

  document.body.appendChild(container);

  sdk.window.startAutoResizer();

  window.addEventListener('message', (e) => {
    if (e.source !== iframe.contentWindow) {
      return;
    }

    const { event, payload } = e.data;
    if (event === 'selectedAttachment') {
      sdk.close([payload]);
    } else if (event === 'selectedAsset' && payload.attachments.length !== 0) {
      const att_id = payload.attachments[0].id;
      const attachment = payload.included.find((att) => att.id === att_id);
      if (attachment) {
        sdk.close([attachment]);
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
    allowHeightOverflow: true,
  });

  if (!Array.isArray(result)) {
    return [];
  }

  // Example result:
  // [{
  //       asset: {id: "6skcfbkq"}
  //       cdn_url: "https://cdn.brandfolder.io/YUHW9ZNT/at/pfbfh7-f4zem0-dpcdo2/orig.png"
  //       extension: "png"
  //       filename: "brandfolder-icon.png"
  //       height: 294
  //       id: "pfbfh7-f4zem0-dpcdo2"
  //       included: null
  //       mimetype: "image/png"
  //       position: 0
  //       relationships: undefined
  //       size: 9252
  //       thumbnail_url: "https://assets.brandfolder.com/pfbfh7-f4zem0-dpcdo2/v/3549487/element.png?v=1592396058"
  //       type: "attachments"
  //       url: "https://s3.amazonaws.com/bf.boulder.prod/pfbfh7-f4zem0-dpcdo2/original/brandfolder-icon.png"
  //       width: 312
  // }]
  return result.map((asset) => pick(asset, FIELDS_TO_PERSIST));
}

setup({
  cta: CTA,
  name: 'Brandfolder',
  logo: 'https://cdn.brandfolder.io/YUHW9ZNT/at/pgec4f-cttweo-a5euhh/brandfolder-icon-favicon.png',
  color: '#40D1F5',
  description:
    'The Brandfolder app is a widget that allows editors to select media from their Brandfolder account. Select a file on Brandfolder and designate the assets that you want your entry to reference.',
  parameterDefinitions: [
    {
      id: 'bf_api_key',
      type: 'Symbol',
      name: 'Brandfolder API key',
      description:
        'If you want to use just one API key (https://brandfolder.com/profile#integrations) for all users, enter it here.',
      required: false,
    },
  ],
  validateParameters: () => {},
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled: () => false,
});
