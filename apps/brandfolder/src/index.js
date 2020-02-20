import { setup } from 'shared-dam-app';

const CTF_APP_URL = 'https://integration-contentful-app.brandfolder-svc.com'
const BF_EMBED_URL = `https://integration-panel-ui.brandfolder-svc.com?channel=message&appName=Contentful&origin=${CTF_APP_URL}&initMsg=hi`


const CTA = 'Select an asset on Brandfolder';

function makeThumbnail(attachment) {
  const thumbnail = attachment.thumbnail_url || attachment.url
  const url = typeof thumbnail === 'string' ? thumbnail : undefined
  const alt = attachment.filename

  return [url, alt];
}


function renderDialog(sdk) {
  const config = sdk.parameters.invocation;

  const container = document.createElement('div');
  container.innerHTML = `<iframe id='brandfolder-embed' class='iframe-container' src='${BF_EMBED_URL}' width=400 height=650 style='border:none;'/>`;
  document.body.appendChild(container);

  sdk.window.startAutoResizer();

  window.addEventListener('message', e => {
    const { data, origin } = e
    if (origin === 'https://integration-panel-ui.brandfolder-svc.com'){
      const { event, payload } = data;
      console.log('Brandfolder event', event)
      if (event == 'selectedAttachment') {
        sdk.close([payload]);
      }
      else if (data.event === 'selectedAsset') {
        const att_id = payload.attachments[0].id
        const attachment = payload.included.find(att => att.id === att_id)
        if (attachment){
          sdk.close([attachment])
        }
      }
    }
  });

  // TODO maybe figure out how to make this work
  // document.addEventListener('message', e => {
  //  ...
  // });
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

  return result

  // return result.map(item => ({
  //   ...item,
  //   src: item.url
  // }));
}

setup({
  cta: CTA,
  name: 'Brandfolder',
  logo: 'https://cdn.brandfolder.io/YUHW9ZNT/at/pgec4f-cttweo-a5euhh/brandfolder-icon-favicon.svg',
  color: '#0061ff',
  description:
    'The Brandfolder app is a widget that allows editors to select media from their Brandfolder account. Select a file on Brandfolder and designate the assets that you want your entry to reference.',
  parameterDefinitions: [],
  validateParameters: () => {},
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled: () => {false},
});
