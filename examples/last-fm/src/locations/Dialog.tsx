import React, { useEffect, useState } from 'react';
import { Spinner, Stack, EntityList } from '@contentful/f36-components';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';

export interface Album {
  name: string;
  artist: string;
  url: string;
  image: Image[];
  streamable: string;
  mbid: string;
}

export interface Image {
  '#text': string;
  size: string;
}

const Dialog = () => {
  const sdk = useSDK<DialogExtensionSDK>();
  useAutoResizer();

  const [album, setAlbum] = useState<Album[] | undefined>();

  const { apiKey } = sdk.parameters.installation;

  const fetchData = async (albumName: string) => {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=album.search&album=${albumName}&api_key=${apiKey}&format=json`
    );
    const { results } = await response.json();
    setAlbum(results.albummatches.album);
  };

  useEffect(() => {
    // @ts-expect-error
    fetchData(sdk.parameters.invocation.albumName);
  }, [sdk.parameters.invocation]);

  if (!album) {
    return <Spinner size="large" />;
  }
  return (
    <Stack fullWidth>
      <EntityList
        style={{
          width: '100%',
        }}
      >
        {album.map((item, i) => {
          return (
            <EntityList.Item
              key={i}
              title={item.name}
              thumbnailUrl={item.image[1]['#text']}
              onClick={() =>
                sdk.close({
                  name: item.name,
                  image: item.image[2]['#text'],
                })
              }
            />
          );
        })}
      </EntityList>
    </Stack>
  );
};

export default Dialog;
