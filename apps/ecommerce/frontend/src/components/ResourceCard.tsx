import { EntityStatus, EntryCard } from '@contentful/f36-components';

export interface ResourceLink {
  type: 'ResourceLink';
  linkType: 'Ecommerce::Product';
  urn: string;
  provider: 'Shopify';
}

interface EcommerceProductData {
  sys?: ResourceLink;
  name?: string;
  description?: string;
  image?: string;
  status?: EntityStatus;
  extras?: {};
}

type ResourceCardProps = {
  value: ResourceLink;
  data: EcommerceProductData;
};

const ResourceCard = (props: ResourceCardProps) => {
  return (
    <EntryCard
      title={props.data.name}
      contentType={`${props.value.linkType} (Source: ${props.value.provider})`}
      status={props.data.status}
      thumbnailElement={<img src={props.data.image} alt={props.data.name} />}>
      {props.data.description}
    </EntryCard>
  );
};

export default ResourceCard;
