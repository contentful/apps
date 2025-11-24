import { FieldAppSDK } from '@contentful/app-sdk';
import { AssetCard, Button, Stack } from '@contentful/f36-components';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { Link } from 'contentful-management';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = sdk.cma;
  useAutoResizer();

  const [value, setValue] = useFieldValue<Link<'Asset'>>();

  const handleUpload = async () => {
    const file = await new Promise<File>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.addEventListener('change', (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files) {
          reject();
          return;
        }
        resolve(files[0]);
      });
      input.click();
    });

    const data = await new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    let asset = await cma.asset.createFromFiles(
      {},
      {
        fields: {
          title: { [sdk.locales.default]: 'New Asset' },
          description: { [sdk.locales.default]: '' },
          file: {
            [sdk.locales.default]: {
              file: data,
              fileName: file.name,
              contentType: file.type,
            },
          },
        },
      }
    );
    asset = await cma.asset.processForAllLocales({}, asset);
    asset = await cma.asset.publish({ assetId: asset.sys.id }, asset);

    setValue({
      sys: {
        type: 'Link',
        linkType: 'Asset',
        id: asset.sys.id,
      },
    });
  };

  const handleDelete = async () => {
    setValue(undefined);
  };

  if (value) {
    return (
      <Stack flexDirection="column">
        <AssetCard
          title={`Asset: ${value.sys.id}`}
          onClick={() => sdk.navigator.openAsset(value.sys.id, { slideIn: true })}
        />
        <Button variant="negative" onClick={handleDelete}>
          Delete
        </Button>
      </Stack>
    );
  }

  return (
    <Stack flexDirection="column">
      <Button onClick={handleUpload}>Upload asset</Button>
    </Stack>
  );
};

export default Field;
