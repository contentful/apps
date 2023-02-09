import React, { useState } from 'react';
import {
  Form,
  FormControl,
  TextInput,
  Button,
  AssetCard,
  MenuItem,
} from '@contentful/f36-components';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';

interface Album {
  name: string;
  image: string;
}

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  useAutoResizer();
  const [albumSearch, setAlbumSearch] = useState<string>('');
  const [albumData, setAlbumData] = useFieldValue<Album | undefined>();

  const openDialog = async () => {
    const album = await sdk.dialogs.openCurrentApp({
      width: 700,
      parameters: {
        albumName: albumSearch,
      },
      title: 'Album Search',
      allowHeightOverflow: true,
      shouldCloseOnEscapePress: true,
      shouldCloseOnOverlayClick: true,
    });
    if (album) {
      setAlbumData(album);
    }
  };

  return (
    <>
      <Form onSubmit={() => openDialog()}>
        <FormControl>
          <FormControl.Label isRequired>Album name</FormControl.Label>

          <TextInput type="text" onChange={(e) => setAlbumSearch(e.target.value)} isRequired />
        </FormControl>
        <FormControl>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </FormControl>
      </Form>
      {albumData && (
        <AssetCard
          type="image"
          title={albumData.name}
          src={albumData.image}
          actions={[
            <MenuItem key="remove" onClick={() => setAlbumData(undefined)}>
              Remove
            </MenuItem>,
          ]}
        />
      )}
    </>
  );
};

export default Field;
