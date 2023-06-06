export const metadata = {
  name: 'Shopify',
  description:
    'The Shopify app allows editors to select products from their Shopify account and reference them inside of Contentful entries.',
  parameterDefinitions: [
    {
      id: 'storefrontAccessToken',
      name: 'Storefront Access Token',
      placeholder: 'a12bc3d45e678f91011ghi121314j15k',
      description: 'The storefront access token to your Shopify store',
      type: 'Symbol',
      required: true,
    },
    {
      id: 'shopName',
      name: 'Shop Name',
      placeholder: 'example-shop',
      description: 'The shop name of your Shopify store',
      type: 'Symbol',
      required: true,
    },
  ],
  primaryColor: '#212F3F',
  logoUrl:
    'https://images.ctfassets.net/juh8bvgveao4/4eTYD0rlVO5tAucQoStln/952f5ed757229c91a099e61d8463f2f9/shopify.svg',
};
