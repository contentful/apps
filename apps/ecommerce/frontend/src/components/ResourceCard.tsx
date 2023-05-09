import { EntryCard, MenuItem } from '@contentful/f36-components';
import { HydratedResourceData, ResourceCardProps, ExternalResourceLink } from '../types';
import { useEffect, useState } from 'react';
import fetchWithSignedRequest from '../helpers/signedRequests';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { config } from '../config';
import MissingResourceCard from './MissingResourceCard';
import { useDebounce } from 'usehooks-ts';

const ResourceCard = (props: ResourceCardProps) => {
  const sdk = useSDK<FieldAppSDK>();
  const cma = useCMA();

  const [hydratedResourceData, setHydratedResourceData] = useState<HydratedResourceData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [errorStatus, setErrorStatus] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const debouncedValue = useDebounce(props.value, 300);

  const hydrateExternalResource = async (resource: ExternalResourceLink) => {
    const url = new URL(`${config.backendApiUrl}/api/resource`);
    const data = await fetchWithSignedRequest(
      url,
      sdk.ids.app!,
      cma,
      'POST',
      {
        'x-contentful-data-provider': resource.sys?.provider?.toLowerCase(),
      },
      resource
    )
      .then((res) => {
        if (res.ok) {
          setError(undefined);
          setErrorStatus(undefined);
          return res.json();
        }

        setErrorStatus(res.status);
        throw new Error(res.statusText);
      })
      .then((data) => data)
      .catch((error) => {
        console.error(errorStatus, error.message);
        setError(
          `Error fetching external resource${resource.sys?.urn ? ` "${resource.sys.urn}"` : ''}${
            resource.sys?.provider ? ` from ${resource.sys.provider}` : ''
          }.`
        );
        setErrorMessage(error.message);
        return {};
      });

    return data;
  };

  useEffect(() => {
    hydrateExternalResource(props.value).then((resource) => {
      setHydratedResourceData(resource);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  if (error) {
    return (
      <MissingResourceCard
        index={props.index}
        onRemove={props.onRemove}
        isLoading={isLoading}
        error={error}
        value={JSON.stringify(props.value)}
        errorMessage={errorMessage}
        errorStatus={errorStatus}
        dragHandleRender={props.dragHandleRender}
      />
    );
  }

  const provider = props.value.sys?.provider || 'External Resource';

  let resourceType = props.value.sys?.linkType?.toString();
  if (resourceType) resourceType = resourceType?.split(':')[1];

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
      contentType={`${provider} ${resourceType}`}
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
