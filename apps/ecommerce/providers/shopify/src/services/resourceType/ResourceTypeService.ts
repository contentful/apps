export const getShopifyResources = async () => {
  createShopifyClientConfig();
};

const createShopifyClientConfig = (params = '{}') => {
  const { shopName, storefrontAccessToken } = JSON.parse(params);

  if (!shopName || !storefrontAccessToken)
    throw new Error(
      'Missing required parameters. shopName and storefrontAccessToken are required.'
    );

  const domain = `${shopName}.myshopify.com`;
  if (!!domain.match(/^[-a-z0-9]{2,256}\b([-a-z0-9]+)\.myshopify\.com$/) === false) {
    throw new Error('Invalid Shopify shop name');
  }

  return { domain, storefrontAccessToken };
};

export const resourceTypeSchema = {
  resourceTypes: [
    {
      'Shopify:Product': {
        managementDisplay: {
          type: 'productCard',
          fieldMapping: {
            id: '$.id',
            name: '$.title',
            description: '$.body_html',
            image: '$.images[0].src',
            status: '$.status',
          },
        },
        filterAttributes: [{ id: ['eq', 'neq', 'matches'] }, { description: ['eq', 'contains'] }],
        sortFields: ['id', 'createdAt'],
      },
    },
  ],
};

export const schema = {
  $ref: '#/definitions/Product',
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Product: {
      properties: {
        body_html: {
          title: 'body_html',
          type: 'string',
        },
        created_at: {
          title: 'created_at',
          type: 'string',
        },
        handle: {
          title: 'handle',
          type: 'string',
        },
        id: {
          title: 'id',
          type: 'number',
        },
        images: {
          items: {
            $ref: '#/definitions/ProductImage',
          },
          title: 'images',
          type: 'array',
        },
        options: {
          properties: {
            id: {
              title: 'id',
              type: 'number',
            },
            name: {
              title: 'name',
              type: 'string',
            },
            position: {
              title: 'position',
              type: 'number',
            },
            product_id: {
              title: 'product_id',
              type: 'number',
            },
            values: {
              items: {
                type: 'string',
              },
              title: 'values',
              type: 'array',
            },
          },
          title: 'options',
          type: 'object',
        },
        product_type: {
          title: 'product_type',
          type: 'string',
        },
        published_at: {
          title: 'published_at',
          type: 'string',
        },
        published_scope: {
          title: 'published_scope',
          type: 'string',
        },
        status: {
          title: 'status',
          type: 'string',
        },
        tags: {
          title: 'tags',
          type: 'string',
        },
        template_suffix: {
          title: 'template_suffix',
          type: 'string',
        },
        title: {
          title: 'title',
          type: 'string',
        },
        updated_at: {
          title: 'updated_at',
          type: 'string',
        },
        variants: {
          items: {
            $ref: '#/definitions/ProductVariant',
          },
          title: 'variants',
          type: 'array',
        },
        vendor: {
          title: 'vendor',
          type: 'string',
        },
      },
      title: 'Product',
      type: 'object',
    },
    ProductImage: {
      properties: {
        created_at: {
          title: 'created_at',
          type: 'string',
        },
        height: {
          title: 'height',
          type: 'number',
        },
        id: {
          title: 'id',
          type: 'number',
        },
        position: {
          title: 'position',
          type: 'number',
        },
        product_id: {
          title: 'product_id',
          type: 'number',
        },
        src: {
          title: 'src',
          type: 'string',
        },
        updated_at: {
          title: 'updated_at',
          type: 'string',
        },
        variant_ids: {
          items: {
            additionalProperties: {},
            type: 'object',
          },
          title: 'variant_ids',
          type: 'array',
        },
        width: {
          title: 'width',
          type: 'number',
        },
      },
      title: 'ProductImage',
      type: 'object',
    },
    ProductVariant: {
      properties: {
        barcode: {
          title: 'barcode',
          type: 'string',
        },
        compare_at_price: {
          title: 'compare_at_price',
          type: 'null',
        },
        created_at: {
          title: 'created_at',
          type: 'string',
        },
        fulfillment_service: {
          title: 'fulfillment_service',
          type: 'string',
        },
        grams: {
          title: 'grams',
          type: 'number',
        },
        id: {
          title: 'id',
          type: 'number',
        },
        inventory_item_id: {
          title: 'inventory_item_id',
          type: 'number',
        },
        inventory_management: {
          title: 'inventory_management',
          type: 'string',
        },
        inventory_policy: {
          title: 'inventory_policy',
          type: 'string',
        },
        inventory_quantity: {
          title: 'inventory_quantity',
          type: 'number',
        },
        option1: {
          title: 'option1',
          type: 'string',
        },
        position: {
          title: 'position',
          type: 'number',
        },
        price: {
          title: 'price',
          type: 'number',
        },
        product_id: {
          title: 'product_id',
          type: 'number',
        },
        requires_shipping: {
          title: 'requires_shipping',
          type: 'boolean',
        },
        sku: {
          title: 'sku',
          type: 'string',
        },
        taxable: {
          title: 'taxable',
          type: 'boolean',
        },
        title: {
          title: 'title',
          type: 'string',
        },
        updated_at: {
          title: 'updated_at',
          type: 'string',
        },
        weight: {
          title: 'weight',
          type: 'number',
        },
        weight_unit: {
          title: 'weight_unit',
          type: 'string',
        },
      },
      title: 'ProductVariant',
      type: 'object',
    },
  },
};
