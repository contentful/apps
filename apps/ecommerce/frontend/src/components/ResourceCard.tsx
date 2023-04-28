import { EntryCard, MenuItem } from '@contentful/f36-components';
import { HydratedResourceData, ResourceCardProps, ResourceLink } from '../types';
import { isEmpty } from 'lodash';
import { MissingEntityCard } from '@contentful/field-editor-reference';
import { useEffect, useState } from 'react';

const fetchRemoteData = async (
  resource: ResourceLink,
  index?: number
): Promise<HydratedResourceData> => {
  return new Promise((resolve) => {
    const randomTimeout = Math.floor(Math.random() * 3000) + 200; // between 200 and 3000 ms

    setTimeout(async () => {
      if (index && index === 1) {
        resolve({});
      } else {
        resolve({
          name: `Product ${index ? index + 1 : ''}`,
          description: 'Lorem ipsum dolar sit amet',
          image: 'https://placekitten.com/500/500',
          status: 'new',
          extras: {
            sku: 'abc123',
          },
        });
      }
    }, randomTimeout);
  });
};

const ResourceCard = (props: ResourceCardProps) => {
  const [hydratedResourceData, setHydratedResourceData] = useState<HydratedResourceData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRemoteData(props.value, props.index).then((remoteData) => {
      setHydratedResourceData(remoteData);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoading && isEmpty(hydratedResourceData)) {
    return (
      <MissingEntityCard
        entityType="Entry"
        isDisabled={false}
        onRemove={() => props.onRemove(props.index)}
      />
    );
  }

  let resourceType = props.value.sys.linkType.toString();
  try {
    resourceType = props.value.sys.linkType.split('::')[1];
  } catch (e) {
    console.error(e);
  }

  const actions = [
    <MenuItem key="copy" onClick={() => props.onRemove(props.index)}>
      Remove
    </MenuItem>,
  ];

  if (typeof props.index !== 'undefined' && props.total && props.total > 1) {
    if (props.index > 0 && props.onMoveToTop) {
      actions.push(
        <MenuItem key="moveToTop" onClick={() => props.onMoveToTop}>
          Move to top
        </MenuItem>
      );
    }

    if (props.total !== props.index + 1 && props.onMoveToBottom) {
      actions.push(
        <MenuItem key="moveToBottom" onClick={() => props.onMoveToBottom}>
          Move to bottom
        </MenuItem>
      );
    }
  }

  return (
    <EntryCard
      isLoading={isLoading}
      title={hydratedResourceData.name}
      status={hydratedResourceData.status}
      contentType={`${props.value.sys.provider} ${resourceType}`}
      thumbnailElement={
        hydratedResourceData.image ? (
          <img src={hydratedResourceData.image} alt={hydratedResourceData.name} />
        ) : undefined
      }
      actions={actions}
      withDragHandle={!!props.dragHandleRender}
      dragHandleRender={props.dragHandleRender}
      isHovered={false}>
      {hydratedResourceData.description}
    </EntryCard>
  );
};

export default ResourceCard;
