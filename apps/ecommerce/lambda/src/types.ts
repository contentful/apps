// lambda types
export interface ExternalResourceLink {
  sys: {
    type: 'ResourceLink';
    linkType: 'Ecommerce::Product';
    urn: string;
    provider: 'Shopify';
  };
}

export interface HydratedResourceData {
  name?: string;
  description?: string;
  image?: string;
  status?: string;
  extras?: object;
}
