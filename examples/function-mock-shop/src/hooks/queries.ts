import { gql } from 'graphql-request';

const productFragment = gql`
  fragment ProductFragment on Product {
    id
    title
    description
    featuredImage {
      url
    }
  }
`;

export const productQuery = gql`
  ${productFragment}
  query Product($productId: ID!) {
    product(id: $productId) {
      ...ProductFragment
    }
  }
`;

export const productsQuery = gql`
  ${productFragment}
  query Products {
    products(first: 20) {
      edges {
        node {
          ...ProductFragment
        }
      }
    }
  }
`;
