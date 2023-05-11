import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { ExternalResource, ExternalResourceLink } from '../types';
import ResourceCard from './ResourceCard';
import { Collapse, Grid, TextLink } from '@contentful/f36-components';
import { Field } from '@contentful/default-field-editors';
import { AddContentButton } from './AddContentButton';

const SingleResource = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<ExternalResourceLink>(sdk.field.getValue());
  const [data, setData] = useState<ExternalResource>({});
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    sdk.field.onValueChanged((value) => {
      setValue(value);
    });
  }, [sdk.field, setValue]);

  const mockValue: ExternalResourceLink = {
    sys: {
      urn: crypto.randomUUID(),
      type: 'ResourceLink',
      linkType: sdk.parameters.instance.linkType,
    },
    metadata: {
      resourceType: 'Commerce:Product',
    },
  };

  useEffect(() => {
    // TODO: replace this with dynamic data resolver
    if (value) {
      const mockData = {
        name: 'Allbirds: Men’s Tree Dasher 2',
        description:
          'The Tree Dasher 2 is the next evolution of our everyday running shoe with more responsive foam, extra grip, and an improved fit to keep you running and nature winning',
        image:
          'https://cdn.allbirds.com/image/fetch/q_auto,f_auto/w_1200,f_auto,q_auto,b_rgb:f5f5f5/https://cdn.shopify.com/s/files/1/1104/4168/products/AA0023W_Shoe_Angle_Global_Womens_Tree_Dasher_2_Natural_Black_Natural_Black_6c22ef7a-8fee-4564-be22-daeaef8125ac.png?v=1680298200',
        status: 'new',
        extras: {
          sku: 'abc123',
        },
      };
      setData(Object.assign(mockData, { sys: value }) as ExternalResource);
    } else {
      setData({});
    }
  }, [value]);

  return (
    <Grid rowGap="spacingM">
      <Grid.Item>
        {value ? (
          <ResourceCard value={value} data={data} onRemove={() => sdk.field.setValue(undefined)} />
        ) : (
          <AddContentButton onClick={() => sdk.field.setValue(mockValue)} />
        )}
      </Grid.Item>
      <Grid.Item>
        <TextLink as="button" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Hide' : 'Show'} JSON
        </TextLink>
        <Collapse isExpanded={isExpanded}>
          <Field sdk={sdk} />
        </Collapse>
      </Grid.Item>
    </Grid>
  );
};

export default SingleResource;
